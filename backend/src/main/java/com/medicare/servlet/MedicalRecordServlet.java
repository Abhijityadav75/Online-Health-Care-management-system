package com.medicare.servlet;

import com.google.gson.JsonObject;
import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.AppointmentDAOImpl;
import com.medicare.dao.MedicalRecordDAO;
import com.medicare.dao.MedicalRecordDAOImpl;
import com.medicare.dao.NotificationDAO;
import com.medicare.dao.NotificationDAOImpl;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.MedicalRecord;
import com.medicare.model.Notification;
import com.medicare.model.Role;
import com.medicare.util.ServletUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Jakarta Servlet managing Clinical Records and Prescriptions.
 * Clinical Access Policy:
 *  - Patient: View own records only (patient_id == session.userId).
 *  - Doctor: View/Create records ONLY for patients with a COMPLETED clinical consultation.
 *            UPCOMING and CANCELLED appointments do NOT confer medical record access.
 *  - Admin: Administrative access by explicit patientId parameter (no hardcoded defaults).
 */
@WebServlet(name = "MedicalRecordServlet", urlPatterns = {"/api/medical-records/*"})
public class MedicalRecordServlet extends HttpServlet {

    private final MedicalRecordDAO medicalRecordDAO;
    private final NotificationDAO notificationDAO;
    private final AppointmentDAO appointmentDAO;

    public MedicalRecordServlet() {
        this.medicalRecordDAO = new MedicalRecordDAOImpl();
        this.notificationDAO = new NotificationDAOImpl();
        this.appointmentDAO = new AppointmentDAOImpl();
    }

    public MedicalRecordServlet(MedicalRecordDAO medicalRecordDAO, NotificationDAO notificationDAO, AppointmentDAO appointmentDAO) {
        this.medicalRecordDAO = medicalRecordDAO;
        this.notificationDAO = notificationDAO;
        this.appointmentDAO = appointmentDAO;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String currentUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (currentUserId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required");
            return;
        }

        String patientParam = request.getParameter("patientId");

        if (currentRole == Role.PATIENT) {
            // Patients can ONLY view their own records
            List<MedicalRecord> list = medicalRecordDAO.findByPatientId(currentUserId);
            ServletUtils.sendSuccess(response, list, "Medical records retrieved");
        } else if (currentRole == Role.DOCTOR) {
            if (patientParam != null) {
                // Verify COMPLETED Clinical Relationship (UPCOMING and CANCELLED appointments disallowed)
                List<Appointment> doctorApts = appointmentDAO.findByDoctorId(currentUserId);
                boolean hasCompletedConsultation = doctorApts.stream().anyMatch(a ->
                        patientParam.equals(a.getPatientId()) && a.getStatus() == AppointmentStatus.COMPLETED
                );

                if (!hasCompletedConsultation) {
                    ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                            "Doctor access to medical records requires a completed clinical consultation. Upcoming or cancelled appointments do not authorize access.");
                    return;
                }
                List<MedicalRecord> list = medicalRecordDAO.findByPatientId(patientParam);
                ServletUtils.sendSuccess(response, list, "Patient medical records retrieved");
            } else {
                List<MedicalRecord> list = medicalRecordDAO.findByDoctorId(currentUserId);
                ServletUtils.sendSuccess(response, list, "Consultation records retrieved");
            }
        } else if (currentRole == Role.ADMIN) {
            if (patientParam == null || patientParam.trim().isEmpty()) {
                ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing required patientId parameter");
                return;
            }
            List<MedicalRecord> list = medicalRecordDAO.findByPatientId(patientParam);
            ServletUtils.sendSuccess(response, list, "Medical records retrieved for patient " + patientParam);
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Invalid role access");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String currentUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (currentRole != Role.DOCTOR && currentRole != Role.ADMIN) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Only medical practitioners can issue medical records");
            return;
        }

        JsonObject body = ServletUtils.parseRequestBody(request, JsonObject.class);
        if (body == null || !body.has("patientId") || !body.has("diagnosis")) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing required medical record parameters");
            return;
        }

        String patientId = body.get("patientId").getAsString();

        // Verify COMPLETED clinical relationship on record creation (UPCOMING / CANCELLED disallowed)
        if (currentRole == Role.DOCTOR) {
            List<Appointment> doctorApts = appointmentDAO.findByDoctorId(currentUserId);
            boolean hasCompletedConsultation = doctorApts.stream().anyMatch(a ->
                    patientId.equals(a.getPatientId()) && a.getStatus() == AppointmentStatus.COMPLETED
            );
            if (!hasCompletedConsultation) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                        "Cannot create medical record: No completed clinical consultation found between doctor and patient.");
                return;
            }
        }

        String id = "rec-" + System.currentTimeMillis();
        String doctorId = currentUserId;
        String recordDate = body.has("recordDate") ? body.get("recordDate").getAsString() : "Today";
        String recordType = body.has("recordType") ? body.get("recordType").getAsString() : "Consultation Note";
        String diagnosis = body.get("diagnosis").getAsString();
        String treatmentPlan = body.has("treatmentPlan") ? body.get("treatmentPlan").getAsString() : "";
        String prescriptions = body.has("prescriptions") ? body.get("prescriptions").getAsString() : "";

        MedicalRecord record = new MedicalRecord(id, patientId, doctorId, recordDate, recordType, diagnosis, treatmentPlan, prescriptions);
        boolean created = medicalRecordDAO.create(record);

        if (created) {
            Notification notif = new Notification(
                    "notif-rec-" + System.currentTimeMillis(),
                    patientId,
                    null,
                    "New Medical Record Added",
                    "A new clinical diagnosis record and treatment summary has been uploaded to your profile.",
                    "MEDICAL"
            );
            notificationDAO.create(notif);

            ServletUtils.sendJsonResponse(
                    response,
                    HttpServletResponse.SC_CREATED,
                    true,
                    "Medical record filed successfully.",
                    record,
                    null
            );
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to save medical record");
        }
    }
}
