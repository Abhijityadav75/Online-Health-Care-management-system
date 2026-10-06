package com.medicare.servlet;

import com.google.gson.JsonObject;
import com.medicare.dao.UserDAO;
import com.medicare.dao.UserDAOImpl;
import com.medicare.model.ApprovalStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Patient;
import com.medicare.model.Role;
import com.medicare.model.User;
import com.medicare.util.PasswordUtils;
import com.medicare.util.ServletUtils;
import com.medicare.util.ValidationUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Jakarta Servlet managing user authentication with secure password hashing,
 * admin-registration lockout, and robust session lifecycle control.
 */
@WebServlet(name = "AuthServlet", urlPatterns = {"/api/auth/*"})
public class AuthServlet extends HttpServlet {

    private final UserDAO userDAO;

    public AuthServlet() {
        this.userDAO = new UserDAOImpl();
    }

    public AuthServlet(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if ("/session".equalsIgnoreCase(pathInfo)) {
            handleSessionCheck(request, response);
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Endpoint not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if ("/login".equalsIgnoreCase(pathInfo)) {
            handleLogin(request, response);
        } else if ("/logout".equalsIgnoreCase(pathInfo)) {
            handleLogout(request, response);
        } else if ("/register".equalsIgnoreCase(pathInfo)) {
            handleRegister(request, response);
        } else {
            ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Endpoint not found");
        }
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonObject body = ServletUtils.parseRequestBody(request, JsonObject.class);
        if (body == null || (!body.has("identifier") && !body.has("email") && !body.has("phone")) || !body.has("password")) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing identifier/email and password");
            return;
        }

        String identifier = body.has("identifier") ? body.get("identifier").getAsString().trim() :
                body.has("email") ? body.get("email").getAsString().trim() : body.get("phone").getAsString().trim();
        String password = body.get("password").getAsString();

        // 1. Query database by email or phone
        Optional<User> userOpt = identifier.contains("@")
                ? userDAO.findByEmail(identifier)
                : userDAO.findByPhone(identifier);

        if (userOpt.isEmpty()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid Credentials", "No account registered with this email or phone");
            return;
        }

        User user = userOpt.get();

        // 2. Validate password hash securely via PBKDF2
        boolean passwordValid = PasswordUtils.verifyPassword(password, user.getPasswordHash());
        if (!passwordValid) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid Credentials", "Incorrect password");
            return;
        }

        // 3. Validate account status
        if ("SUSPENDED".equalsIgnoreCase(user.getStatus()) || "INACTIVE".equalsIgnoreCase(user.getStatus())) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Account Inactive", "Your account has been deactivated. Please contact support.");
            return;
        }

        // 4. Validate Doctor Approval Status
        if (user instanceof Doctor doctor) {
            if (doctor.getApprovalStatus() == ApprovalStatus.PENDING) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Pending Approval", "Your doctor account registration is pending admin approval. You will receive an alert once approved.");
                return;
            } else if (doctor.getApprovalStatus() == ApprovalStatus.REJECTED) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Registration Rejected", "Your doctor account registration was rejected by the administrator.");
                return;
            }
        }

        // 5. Create real server-side HttpSession (stores ONLY identity attributes)
        HttpSession session = request.getSession(true);
        session.setAttribute(ServletUtils.SESSION_USER_ID, user.getId());
        session.setAttribute(ServletUtils.SESSION_ROLE, user.getRole());

        // 6. Return sanitized user JSON (zero password hashes)
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("user", ServletUtils.sanitizeUser(user));
        responseData.put("role", user.getRole().name());

        ServletUtils.sendSuccess(response, responseData, "Login successful");
    }

    private void handleLogout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        ServletUtils.sendSuccess(response, null, "Logged out successfully");
    }

    private void handleSessionCheck(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String userId = ServletUtils.getSessionUserId(request);
        if (userId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "No active session");
            return;
        }

        Optional<User> userOpt = userDAO.findById(userId);
        if (userOpt.isEmpty()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "User not found");
            return;
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("user", ServletUtils.sanitizeUser(userOpt.get()));
        responseData.put("role", userOpt.get().getRole().name());

        ServletUtils.sendSuccess(response, responseData, "Session active");
    }

    private void handleRegister(HttpServletRequest request, HttpServletResponse response) throws IOException {
        JsonObject body = ServletUtils.parseRequestBody(request, JsonObject.class);
        if (body == null || !body.has("name") || !body.has("email") || !body.has("phone") || !body.has("password")) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Missing required registration parameters");
            return;
        }

        String name = body.get("name").getAsString().trim();
        String email = body.get("email").getAsString().trim();
        String phone = body.get("phone").getAsString().trim();
        String plainPassword = body.get("password").getAsString();
        String roleStr = body.has("role") ? body.get("role").getAsString() : "PATIENT";
        Role role = Role.fromString(roleStr);

        // Security Guard 1: Prohibit public Admin creation
        if (role == Role.ADMIN) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Public administrator registration is prohibited.");
            return;
        }

        // Security Guard 2: Input Format Validation
        if (!ValidationUtils.isValidEmail(email)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Validation Error", "Invalid email address format.");
            return;
        }
        if (!ValidationUtils.isValidPhone(phone)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Validation Error", "Invalid phone number format.");
            return;
        }
        if (!ValidationUtils.isValidPassword(plainPassword)) {
            ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Validation Error", "Password must be at least 6 characters long.");
            return;
        }

        // Check if email already registered
        if (userDAO.findByEmail(email).isPresent()) {
            ServletUtils.sendError(response, HttpServletResponse.SC_CONFLICT, "Conflict", "An account with this email address is already registered.");
            return;
        }

        // Hash password securely before database insertion
        String passwordHash = PasswordUtils.hashPassword(plainPassword);
        String newId = (role == Role.DOCTOR ? "d-" : "p-") + System.currentTimeMillis();
        User newUser;

        if (role == Role.DOCTOR) {
            Doctor doc = new Doctor(newId, name, email, phone, passwordHash,
                    body.has("specialization") ? body.get("specialization").getAsString() : "General Physician",
                    body.has("qualification") ? body.get("qualification").getAsString() : "MBBS");
            doc.setApprovalStatus(ApprovalStatus.PENDING);
            newUser = doc;
        } else {
            newUser = new Patient(newId, name, email, phone, passwordHash);
        }

        boolean created = userDAO.create(newUser);
        if (!created) {
            ServletUtils.sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server Error", "Failed to register user in database.");
            return;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("user", ServletUtils.sanitizeUser(newUser));
        result.put("pendingApproval", role == Role.DOCTOR);

        ServletUtils.sendJsonResponse(
                response,
                HttpServletResponse.SC_CREATED,
                true,
                role == Role.DOCTOR ? "Doctor registration submitted for Admin verification." : "Registration successful.",
                result,
                null
        );
    }
}
