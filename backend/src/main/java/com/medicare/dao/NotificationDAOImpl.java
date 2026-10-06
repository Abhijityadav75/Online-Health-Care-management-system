package com.medicare.dao;

import com.medicare.exception.DatabaseException;
import com.medicare.model.Notification;
import com.medicare.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * JDBC Implementation of NotificationDAO with strict ownership verification.
 */
public class NotificationDAOImpl implements NotificationDAO {

    @Override
    public List<Notification> findByUserId(String userId) {
        List<Notification> list = new ArrayList<>();
        String sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToNotification(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding notifications for user: " + userId, e);
        }
        return list;
    }

    @Override
    public boolean create(Notification notification) {
        try (Connection conn = DBConnection.getConnection()) {
            return createWithConnection(notification, conn);
        } catch (SQLException e) {
            throw new DatabaseException("Error creating notification: " + notification.getId(), e);
        }
    }

    @Override
    public boolean createWithConnection(Notification notification, Connection conn) {
        String sql = "INSERT INTO notifications (id, user_id, appointment_id, title, message, notification_type, is_read) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, notification.getId());
            stmt.setString(2, notification.getUserId());
            stmt.setString(3, notification.getAppointmentId());
            stmt.setString(4, notification.getTitle());
            stmt.setString(5, notification.getMessage());
            stmt.setString(6, notification.getNotificationType());
            stmt.setBoolean(7, notification.isRead());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error executing notification insert: " + notification.getId(), e);
        }
    }

    @Override
    public boolean markAsRead(String id, String userId) {
        // Enforce both notification id and authenticated user_id
        String sql = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, id);
            stmt.setString(2, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error marking notification read for user " + userId + ": " + id, e);
        }
    }

    @Override
    public boolean markAllAsRead(String userId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error marking all notifications read for user: " + userId, e);
        }
    }

    private Notification mapResultSetToNotification(ResultSet rs) throws SQLException {
        Notification notif = new Notification();
        notif.setId(rs.getString("id"));
        notif.setUserId(rs.getString("user_id"));
        notif.setAppointmentId(rs.getString("appointment_id"));
        notif.setTitle(rs.getString("title"));
        notif.setMessage(rs.getString("message"));
        notif.setNotificationType(rs.getString("notification_type"));
        notif.setRead(rs.getBoolean("is_read"));
        notif.setCreatedAt(rs.getTimestamp("created_at"));
        return notif;
    }
}
