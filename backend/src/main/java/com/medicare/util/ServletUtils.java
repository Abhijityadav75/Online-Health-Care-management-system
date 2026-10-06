package com.medicare.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.medicare.model.Role;
import com.medicare.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for Jakarta Servlets handling JSON serialization,
 * request parsing, error mapping, and session authentication extraction.
 */
public class ServletUtils {

    public static final Gson GSON = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd HH:mm:ss")
            .serializeNulls()
            .create();

    public static final String SESSION_USER_ID = "userId";
    public static final String SESSION_ROLE = "role";
    public static final String SESSION_USER = "userObj";

    private ServletUtils() {}

    /**
     * Reads JSON payload from the HttpServletRequest body and converts it to the specified class.
     */
    public static <T> T parseRequestBody(HttpServletRequest request, Class<T> clazz) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        String body = sb.toString().trim();
        if (body.isEmpty()) {
            return null;
        }
        return GSON.fromJson(body, clazz);
    }

    /**
     * Sends a successful JSON response with HTTP 200 OK.
     */
    public static void sendSuccess(HttpServletResponse response, Object data, String message) throws IOException {
        sendJsonResponse(response, HttpServletResponse.SC_OK, true, message, data, null);
    }

    /**
     * Sends a JSON response with a custom HTTP status code.
     */
    public static void sendJsonResponse(HttpServletResponse response, int statusCode, boolean success, String message, Object data, String error) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(statusCode);

        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        if (message != null) result.put("message", message);
        if (data != null) result.put("data", data);
        if (error != null) result.put("error", error);

        try (PrintWriter writer = response.getWriter()) {
            writer.write(GSON.toJson(result));
            writer.flush();
        }
    }

    /**
     * Sends a structured JSON error response.
     */
    public static void sendError(HttpServletResponse response, int statusCode, String error, String message) throws IOException {
        sendJsonResponse(response, statusCode, false, message, null, error);
    }

    /**
     * Retrieves the authenticated user's ID from the current session, or null if unauthenticated.
     */
    public static String getSessionUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object userId = session.getAttribute(SESSION_USER_ID);
            return userId != null ? userId.toString() : null;
        }
        return null;
    }

    /**
     * Retrieves the authenticated user's Role from the current session, or null if unauthenticated.
     */
    public static Role getSessionRole(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object roleObj = session.getAttribute(SESSION_ROLE);
            if (roleObj instanceof Role role) {
                return role;
            } else if (roleObj instanceof String roleStr) {
                return Role.fromString(roleStr);
            }
        }
        return null;
    }

    /**
     * Sanitizes a User model before returning it in an HTTP response (removes password_hash).
     */
    public static Map<String, Object> sanitizeUser(User user) {
        if (user == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("role", user.getRole().name());
        map.put("status", user.getStatus());
        map.put("avatarUrl", user.getAvatarUrl());
        map.put("dob", user.getDob());
        map.put("gender", user.getGender());
        map.put("address", user.getAddress());
        return map;
    }
}
