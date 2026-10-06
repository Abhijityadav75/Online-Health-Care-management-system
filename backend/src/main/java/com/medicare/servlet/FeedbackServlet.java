package com.medicare.servlet;

import com.google.gson.JsonObject;
import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.AppointmentDAOImpl;
import com.medicare.dao.FeedbackDAO;
import com.medicare.dao.FeedbackDAOImpl;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.Feedback;
import com.medicare.model.Role;
import com.medicare.util.ServletUtils;
import com.medicare.util.ValidationUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Jakarta Servlet managing Patient Feedback with strict patient-only authorization
 * and exact completed appointment verification.
 */
@WebServlet(name = "FeedbackServlet", urlPatterns = {"/api/feedback/*"})
public class FeedbackServlet extends HttpServlet {

    private final FeedbackDAO feedbackDAO;
    private final AppointmentDAO appointmentDAO;

    public FeedbackServlet() {
        this.feedbackDAO = new FeedbackDAOImpl();
        this.appointmentDAO = new AppointmentDAOImpl();
    }

    public FeedbackServlet(FeedbackDAO feedbackDAO, AppointmentDAO appointmentDAO) {
        this.feedbackDAO = feedbackDAO;
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

        String doctorId = request.getParameter("doctorId");
        String patientId = request.getParameter("patientId");

        if (currentRole == Role.PATIENT) {
            // Patients can only retrieve their own feedback submissions
            List<Feedback> list = feedbackDAO.findByPatientId(currentUserId);
            ServletUtils.sendSuccess(response, list, "Your submitted feedback retrieved");
        } else if (currentRole == Role.DOCTOR) {
            // Doctors can only retrieve feedback submitted for themselves
            List<Feedback> list = feedbackDAO.findByDoctorId(currentUserId);
            ServletUtils.sendSuccess(response, list, "Doctor feedback reviews retrieved");
        } else if (currentRole == Role.ADMIN) {
            // Admin queries without hardcoded defaults
            List<Feedback> list;
            if (doctorId != null && !doctorId.trim().isEmpty()) {
                list = feedbackDAO.findByDoctorId(doctorId);
            } else if (patientId != null && !patientId.trim().isEmpty()) {
                list = feedbackDAO.findByPatientId(patientId);
            } else {
                list = feedbackDAO.findAll();
            }
            ServletUtils.sendSuccess(response, list, "Feedback records retrieved");
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Invalid role access");
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

        // Rule 1: Strictly PATIENT-ONLY feedback submission (Admins and Doctors forbidden)
        if (currentRole != Role.PATIENT) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                    "Only registered patients are permitted to submit consultation feedback.");
            return;
        }

        JsonObject body = ServletUtils.parseRequestBody(request, JsonObject.class);
        if (body == null || !body.has("doctorId") || !body.has("rating") || !body.has("appointmentId")) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request",
                    "Missing required feedback parameters: doctorId, rating, appointmentId.");
            return;
        }

        String doctorId = body.get("doctorId").getAsString();
        String appointmentId = body.get("appointmentId").getAsString();
        int rating = body.get("rating").getAsInt();
        String comment = body.has("comment") ? body.get("comment").getAsString() : "";

        if (!ValidationUtils.isValidRating(rating)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request",
                    "Rating must be an integer between 1 and 5");
            return;
        }

        // Rule 2: Validate the EXACT appointment
        Optional<Appointment> aptOpt = appointmentDAO.findById(appointmentId);
        if (aptOpt.isEmpty()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found",
                    "Appointment with ID '" + appointmentId + "' does not exist.");
            return;
        }

        Appointment apt = aptOpt.get();

        // 2a. Verify appointment belongs to calling patient
        if (!currentUserId.equals(apt.getPatientId())) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                    "You cannot submit feedback for an appointment belonging to another patient.");
            return;
        }

        // 2b. Verify appointment was conducted by the submitted doctor
        if (!doctorId.equals(apt.getDoctorId())) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                    "The specified appointment was not conducted with this doctor.");
            return;
        }

        // 2c. Verify appointment is COMPLETED (UPCOMING or CANCELLED disallowed)
        if (apt.getStatus() != AppointmentStatus.COMPLETED) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden",
                    "Feedback can only be submitted for completed consultations. Current status: " + apt.getStatus());
            return;
        }

        // Rule 3: Check duplicate feedback for this exact appointment
        if (feedbackDAO.hasFeedbackForAppointment(appointmentId)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_CONFLICT, "Conflict",
                    "Feedback has already been submitted for consultation '" + appointmentId + "'.");
            return;
        }

        String id = "fb-" + System.currentTimeMillis();
        Feedback feedback = new Feedback(id, currentUserId, doctorId, appointmentId, rating, comment);
        boolean created = feedbackDAO.create(feedback);

        if (created) {
            ServletUtils.sendJsonResponse(
                    response,
                    HttpServletResponse.SC_CREATED,
                    true,
                    "Thank you! Your feedback has been submitted.",
                    feedback,
                    null
            );
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error",
                    "Failed to persist feedback in database");
        }
    }
}
