package com.medicare.servlet;

import com.google.gson.JsonObject;
import com.medicare.dao.NotificationDAO;
import com.medicare.dao.NotificationDAOImpl;
import com.medicare.dao.UserDAO;
import com.medicare.dao.UserDAOImpl;
import com.medicare.model.ApprovalStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Notification;
import com.medicare.model.Patient;
import com.medicare.model.Role;
import com.medicare.model.User;
import com.medicare.util.ServletUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Jakarta Servlet managing User CRUD operations with strict profile ownership enforcement.
 */
@WebServlet(name = "UserServlet", urlPatterns = {"/api/users/*"})
public class UserServlet extends HttpServlet {

    private final UserDAO userDAO;
    private final NotificationDAO notificationDAO;

    public UserServlet() {
        this.userDAO = new UserDAOImpl();
        this.notificationDAO = new NotificationDAOImpl();
    }

    public UserServlet(UserDAO userDAO, NotificationDAO notificationDAO) {
        this.userDAO = userDAO;
        this.notificationDAO = notificationDAO;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String sessionUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (sessionUserId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required");
            return;
        }

        if (pathInfo == null || "/".equals(pathInfo)) {
            if (currentRole != Role.ADMIN) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Admin privilege required");
                return;
            }
            List<User> users = userDAO.findAll();
            List<Object> sanitized = users.stream().map(ServletUtils::sanitizeUser).collect(Collectors.toList());
            ServletUtils.sendSuccess(response, sanitized, "All users retrieved");
            return;
        }

        if ("/doctors".equalsIgnoreCase(pathInfo)) {
            List<Doctor> doctors = userDAO.findAllDoctors();
            ServletUtils.sendSuccess(response, doctors, "Doctors retrieved");
            return;
        }

        if ("/patients".equalsIgnoreCase(pathInfo)) {
            if (currentRole != Role.ADMIN && currentRole != Role.DOCTOR) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Admin or Doctor privilege required");
                return;
            }
            List<User> patients = userDAO.findAllPatients().stream().map(p -> (User) p).collect(Collectors.toList());
            List<Object> sanitized = patients.stream().map(ServletUtils::sanitizeUser).collect(Collectors.toList());
            ServletUtils.sendSuccess(response, sanitized, "Patients retrieved");
            return;
        }

        // Profile lookup: /api/users/{id}
        String targetUserId = pathInfo.substring(1);

        // Security Guard: Enforce strict profile ownership for Patient and Doctor
        if (currentRole == Role.PATIENT && !targetUserId.equals(sessionUserId)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Patients are authorized to retrieve only their own profile.");
            return;
        }
        if (currentRole == Role.DOCTOR && !targetUserId.equals(sessionUserId)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Doctors are authorized to retrieve only their own profile.");
            return;
        }

        Optional<User> userOpt = userDAO.findById(targetUserId);
        if (userOpt.isEmpty()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "User not found");
            return;
        }

        ServletUtils.sendSuccess(response, ServletUtils.sanitizeUser(userOpt.get()), "User details retrieved");
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String sessionUserId = ServletUtils.getSessionUserId(request);
        Role currentRole = ServletUtils.getSessionRole(request);

        if (sessionUserId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required");
            return;
        }

        if (pathInfo == null || pathInfo.length() <= 1) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing target user ID");
            return;
        }

        String[] parts = pathInfo.substring(1).split("/");

        // Route: /api/users/doctors/{id}/approve
        if (parts.length >= 3 && "doctors".equalsIgnoreCase(parts[0]) && "approve".equalsIgnoreCase(parts[2])) {
            if (currentRole != Role.ADMIN) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Only administrators can approve doctor credentials");
                return;
            }
            String doctorId = parts[1];
            Optional<User> docOpt = userDAO.findById(doctorId);
            if (docOpt.isEmpty() || !(docOpt.get() instanceof Doctor doctor)) {
                ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Doctor record not found");
                return;
            }

            if (doctor.getApprovalStatus() == ApprovalStatus.APPROVED) {
                ServletUtils.sendSuccess(response, null, "Doctor is already approved.");
                return;
            }

            boolean updated = userDAO.updateDoctorApprovalStatus(doctorId, ApprovalStatus.APPROVED);
            if (updated) {
                Notification notif = new Notification(
                        "notif-appr-" + System.currentTimeMillis(),
                        doctorId,
                        null,
                        "Account Approved",
                        "Your medical practitioner credentials have been verified and approved by the Administrator.",
                        "SYSTEM"
                );
                notificationDAO.create(notif);
                ServletUtils.sendSuccess(response, null, "Doctor registration approved successfully");
            } else {
                ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to update doctor status");
            }
            return;
        }

        // Route: /api/users/doctors/{id}/reject
        if (parts.length >= 3 && "doctors".equalsIgnoreCase(parts[0]) && "reject".equalsIgnoreCase(parts[2])) {
            if (currentRole != Role.ADMIN) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Only administrators can reject doctor credentials");
                return;
            }
            String doctorId = parts[1];
            Optional<User> docOpt = userDAO.findById(doctorId);
            if (docOpt.isEmpty() || !(docOpt.get() instanceof Doctor doctor)) {
                ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Doctor record not found");
                return;
            }

            if (doctor.getApprovalStatus() == ApprovalStatus.REJECTED) {
                ServletUtils.sendSuccess(response, null, "Doctor registration is already rejected.");
                return;
            }

            boolean updated = userDAO.updateDoctorApprovalStatus(doctorId, ApprovalStatus.REJECTED);
            if (updated) {
                Notification notif = new Notification(
                        "notif-rej-" + System.currentTimeMillis(),
                        doctorId,
                        null,
                        "Registration Rejected",
                        "Your medical practitioner registration was rejected by the Administrator.",
                        "SYSTEM"
                );
                notificationDAO.create(notif);
                ServletUtils.sendSuccess(response, null, "Doctor registration rejected");
            } else {
                ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to update doctor status");
            }
            return;
        }

        // Profile update route: /api/users/{id}
        String userId = parts[0];
        if (!userId.equals(sessionUserId) && currentRole != Role.ADMIN) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "You cannot modify another user's profile");
            return;
        }

        JsonObject body = ServletUtils.parseRequestBody(request, JsonObject.class);
        if (body == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing update payload");
            return;
        }

        Optional<User> userOpt = userDAO.findById(userId);
        if (userOpt.isEmpty()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "User not found");
            return;
        }

        User user = userOpt.get();

        if (body.has("name")) user.setName(body.get("name").getAsString());
        if (body.has("phone")) user.setPhone(body.get("phone").getAsString());
        if (body.has("avatarUrl")) user.setAvatarUrl(body.get("avatarUrl").getAsString());
        if (body.has("dob")) user.setDob(body.get("dob").getAsString());
        if (body.has("gender")) user.setGender(body.get("gender").getAsString());
        if (body.has("address")) user.setAddress(body.get("address").getAsString());

        if (user instanceof Patient patient) {
            if (body.has("emergencyContact")) patient.setEmergencyContact(body.get("emergencyContact").getAsString());
            if (body.has("emergencyRelation")) patient.setEmergencyRelation(body.get("emergencyRelation").getAsString());
        } else if (user instanceof Doctor doctor) {
            if (body.has("specialization")) doctor.setSpecialization(body.get("specialization").getAsString());
            if (body.has("qualification")) doctor.setQualification(body.get("qualification").getAsString());
            if (body.has("hospital")) doctor.setHospital(body.get("hospital").getAsString());
        }

        if (currentRole == Role.ADMIN) {
            if (body.has("status")) user.setStatus(body.get("status").getAsString());
        }

        boolean updated = userDAO.update(user);
        if (updated) {
            ServletUtils.sendSuccess(response, ServletUtils.sanitizeUser(user), "User profile updated");
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to update profile");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        Role currentRole = ServletUtils.getSessionRole(request);

        if (currentRole != Role.ADMIN) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Admin privilege required to delete user accounts");
            return;
        }

        if (pathInfo == null || pathInfo.length() <= 1) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing user ID to delete");
            return;
        }

        String userId = pathInfo.substring(1);
        boolean deleted = userDAO.delete(userId);
        if (deleted) {
            ServletUtils.sendSuccess(response, null, "User account deleted successfully");
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "User not found to delete");
        }
    }
}
