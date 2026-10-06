package com.medicare.servlet;

import com.medicare.dao.NotificationDAO;
import com.medicare.dao.NotificationDAOImpl;
import com.medicare.model.Notification;
import com.medicare.util.ServletUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Jakarta Servlet managing user notifications with strict user-isolation.
 */
@WebServlet(name = "NotificationServlet", urlPatterns = {"/api/notifications/*"})
public class NotificationServlet extends HttpServlet {

    private final NotificationDAO notificationDAO;

    public NotificationServlet() {
        this.notificationDAO = new NotificationDAOImpl();
    }

    public NotificationServlet(NotificationDAO notificationDAO) {
        this.notificationDAO = notificationDAO;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String currentUserId = ServletUtils.getSessionUserId(request);
        if (currentUserId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required");
            return;
        }

        List<Notification> userNotifications = notificationDAO.findByUserId(currentUserId);
        ServletUtils.sendSuccess(response, userNotifications, "Notifications retrieved");
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        String currentUserId = ServletUtils.getSessionUserId(request);
        if (currentUserId == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required");
            return;
        }

        if ("/read-all".equalsIgnoreCase(pathInfo)) {
            boolean updated = notificationDAO.markAllAsRead(currentUserId);
            ServletUtils.sendSuccess(response, null, "All notifications marked as read");
            return;
        }

        if (pathInfo != null && pathInfo.length() > 1) {
            String[] parts = pathInfo.substring(1).split("/");
            String notifId = parts[0];
            // Security: Enforce that only the owning user can mark their notification read
            boolean updated = notificationDAO.markAsRead(notifId, currentUserId);
            if (updated) {
                ServletUtils.sendSuccess(response, null, "Notification marked as read");
            } else {
                ServletUtils.sendError(response, HttpServletResponse.SC_NOT_FOUND, "Not Found", "Notification not found or does not belong to you.");
            }
            return;
        }

        ServletUtils.sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Bad Request", "Invalid notification action");
    }
}
