package com.medicare.servlet;

import com.google.gson.JsonObject;
import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.AppointmentDAOImpl;
import com.medicare.dao.UserDAO;
import com.medicare.dao.UserDAOImpl;
import com.medicare.exception.AppointmentException;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.ApprovalStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Role;
import com.medicare.model.User;
import com.medicare.service.AppointmentService;
import com.medicare.util.ServletUtils;
import com.medicare.util.ValidationUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Date;
import java.util.List;
import java.util.Optional;

/**
 * Jakarta Servlet managing appointments with strict cross-role authorization and ownership enforcement.
 */
@WebServlet(name = "AppointmentServlet", urlPatterns = {"/api/appointments/*"})
public class AppointmentServlet extends HttpServlet {

    private final AppointmentService appointmentService;
    private final AppointmentDAO appointmentDAO;
    private final UserDAO userDAO;

    public AppointmentServlet() {
        this.appointmentDAO = new AppointmentDAOImpl();
        this.appointmentService = new AppointmentService();
        this.userDAO = new UserDAOImpl();
    }

    public AppointmentServlet(AppointmentService appointmentService, AppointmentDAO appointmentDAO, UserDAO userDAO) {
        this.appointmentService = appointmentService;
        this.appointmentDAO = appointmentDAO;
        this.userDAO = userDAO;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String currentUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (currentUserId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required");
            return;
        }

        if (pathInfo == null || "/".equals(pathInfo)) {
            // General /api/appointments - Route strictly by session role
            if (currentRole == Role.PATIENT) {
                List<Appointment> list = appointmentService.getAppointmentsForPatient(currentUserId);
                ServletUtils.sendSuccess(response, list, "Patient appointments retrieved");
            } else if (currentRole == Role.DOCTOR) {
                List<Appointment> list = appointmentService.getAppointmentsForDoctor(currentUserId);
                ServletUtils.sendSuccess(response, list, "Doctor appointments retrieved");
            } else if (currentRole == Role.ADMIN) {
                List<Appointment> list = appointmentService.getAllAppointments();
                ServletUtils.sendSuccess(response, list, "All appointments retrieved");
            } else {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Invalid role");
            }
            return;
        }

        if ("/patient".equalsIgnoreCase(pathInfo)) {
            List<Appointment> list = appointmentService.getAppointmentsForPatient(currentUserId);
            ServletUtils.sendSuccess(response, list, "Patient appointments retrieved");
        } else if ("/doctor".equalsIgnoreCase(pathInfo)) {
            List<Appointment> list = appointmentService.getAppointmentsForDoctor(currentUserId);
            ServletUtils.sendSuccess(response, list, "Doctor appointments retrieved");
        } else if ("/admin".equalsIgnoreCase(pathInfo)) {
            if (currentRole != Role.ADMIN) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Admin role required");
                return;
            }
            List<Appointment> list = appointmentService.getAllAppointments();
            ServletUtils.sendSuccess(response, list, "Admin appointments retrieved");
        } else {
            // Specific appointment lookup: /api/appointments/{id}
            String appointmentId = pathInfo.substring(1);
            Optional<Appointment> aptOpt = appointmentService.getAppointmentById(appointmentId);
            if (aptOpt.isEmpty()) {
                ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Appointment not found");
                return;
            }

            Appointment apt = aptOpt.get();

            // Authorization Guard: Strict Ownership Verification
            if (currentRole == Role.PATIENT && !currentUserId.equals(apt.getPatientId())) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "You are not authorized to view another patient's appointment.");
                return;
            }
            if (currentRole == Role.DOCTOR && !currentUserId.equals(apt.getDoctorId())) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "You are not authorized to view appointments assigned to another doctor.");
                return;
            }

            ServletUtils.sendSuccess(response, apt, "Appointment retrieved");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String currentUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (currentUserId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required");
            return;
        }

        JsonObject body = ServletUtils.parseRequestBody(request, JsonObject.class);
        if (body == null || !body.has("doctorId") || !body.has("appointmentDate") || !body.has("appointmentTime")) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing appointment booking fields");
            return;
        }

        String doctorId = body.get("doctorId").getAsString();
        String appointmentDate = body.get("appointmentDate").getAsString();
        String appointmentTime = body.get("appointmentTime").getAsString();
        String reason = body.has("reason") ? body.get("reason").getAsString() : "General Consultation";
        String type = body.has("type") ? body.get("type").getAsString() : "Consultation";

        // Security Guard 1: Prevent patient impersonation
        String patientId;
        if (currentRole == Role.PATIENT) {
            patientId = currentUserId; // Always bind to authenticated session
        } else if (currentRole == Role.ADMIN) {
            patientId = body.has("patientId") ? body.get("patientId").getAsString() : currentUserId;
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Doctors cannot initiate appointment booking for patients.");
            return;
        }

        // Security Guard 2: Verify Target Doctor Credentials
        Optional<User> doctorOpt = userDAO.findById(doctorId);
        if (doctorOpt.isEmpty() || !(doctorOpt.get() instanceof Doctor doctor)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Invalid Doctor", "Selected doctor does not exist.");
            return;
        }
        if (doctor.getApprovalStatus() != ApprovalStatus.APPROVED) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Unverified Doctor", "Appointments can only be scheduled with verified, approved doctors.");
            return;
        }
        if (!"ACTIVE".equalsIgnoreCase(doctor.getStatus())) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Doctor Unavailable", "Selected doctor is currently inactive.");
            return;
        }

        // Determine date ISO
        Date dateIso;
        if (body.has("appointmentDateIso") && ValidationUtils.isValidDateIso(body.get("appointmentDateIso").getAsString())) {
            dateIso = Date.valueOf(body.get("appointmentDateIso").getAsString());
        } else {
            dateIso = Date.valueOf(java.time.LocalDate.now());
        }

        String appointmentId = "MC-" + System.currentTimeMillis();
        Appointment appointment = new Appointment(
                appointmentId,
                patientId,
                doctorId,
                appointmentDate,
                dateIso,
                appointmentTime,
                reason
        );
        appointment.setType(type);
        appointment.setStatus(AppointmentStatus.UPCOMING);

        Optional<User> patientOpt = userDAO.findById(patientId);
        String patientName = patientOpt.map(User::getName).orElse("Patient");

        try {
            // Execute transactional booking with slot availability check
            boolean success = appointmentService.bookAppointmentWithTransaction(appointment, patientName);
            if (success) {
                ServletUtils.sendJsonResponse(
                        response,
                        HttpServletResponse.SC_CREATED,
                        true,
                        "Appointment scheduled successfully.",
                        appointment,
                        null
                );
            } else {
                ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Could not complete booking");
            }
        } catch (AppointmentException e) {
            ServletUtils.sendError(response, HttpServletResponse.SC_CONFLICT, "Slot Conflict", e.getMessage());
        } catch (Exception e) {
            ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "An error occurred while booking appointment");
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String currentUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (pathInfo == null || pathInfo.length() <= 1) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing appointment ID");
            return;
        }

        String[] parts = pathInfo.substring(1).split("/");
        String appointmentId = parts[0];

        Optional<Appointment> aptOpt = appointmentDAO.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Appointment not found");
            return;
        }
        Appointment apt = aptOpt.get();

        JsonObject body = ServletUtils.parseRequestBody(request, JsonObject.class);
        if (body == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing update body");
            return;
        }

        // Reschedule action: /api/appointments/{id}/reschedule
        if (parts.length > 1 && "reschedule".equalsIgnoreCase(parts[1])) {
            // Authorization Check: Only owning patient or admin
            if (currentRole == Role.PATIENT && !currentUserId.equals(apt.getPatientId())) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "You cannot reschedule another patient's appointment.");
                return;
            }
            if (currentRole == Role.DOCTOR) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Doctors cannot reschedule appointments directly.");
                return;
            }

            String newDate = body.get("date").getAsString();
            String newDateIsoStr = body.has("dateIso") ? body.get("dateIso").getAsString() : "2026-10-15";
            String newTime = body.get("time").getAsString();
            Date dateIso = Date.valueOf(newDateIsoStr);

            boolean updated = appointmentDAO.reschedule(appointmentId, newDate, dateIso, newTime);
            if (updated) {
                ServletUtils.sendSuccess(response, null, "Appointment rescheduled successfully");
            } else {
                ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to reschedule");
            }
            return;
        }

        // Status update action: /api/appointments/{id}/status or body { status: ... }
        if (body.has("status")) {
            // Authorization Check: Only assigned doctor or admin
            if (currentRole == Role.DOCTOR && !currentUserId.equals(apt.getDoctorId())) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "You cannot update status for an appointment assigned to another doctor.");
                return;
            }
            if (currentRole == Role.PATIENT) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Patients cannot mark consultation status directly.");
                return;
            }

            AppointmentStatus status = AppointmentStatus.fromString(body.get("status").getAsString());
            boolean updated = appointmentDAO.updateStatus(appointmentId, status);
            if (updated) {
                ServletUtils.sendSuccess(response, null, "Appointment status updated to " + status);
            } else {
                ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to update status");
            }
            return;
        }

        ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Unrecognized update action");
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String currentUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (pathInfo == null || pathInfo.length() <= 1) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing appointment ID");
            return;
        }

        String appointmentId = pathInfo.substring(1);
        Optional<Appointment> aptOpt = appointmentDAO.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Appointment not found");
            return;
        }
        Appointment apt = aptOpt.get();

        // Ownership Check on Cancellation
        if (currentRole == Role.PATIENT && !currentUserId.equals(apt.getPatientId())) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "You cannot cancel another patient's appointment.");
            return;
        }
        if (currentRole == Role.DOCTOR && !currentUserId.equals(apt.getDoctorId())) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "You cannot cancel another doctor's appointment.");
            return;
        }

        boolean cancelled = appointmentService.cancelAppointment(appointmentId, currentUserId, currentRole != null ? currentRole.name() : "USER");
        if (cancelled) {
            ServletUtils.sendSuccess(response, null, "Appointment cancelled successfully");
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to cancel appointment");
        }
    }
}
