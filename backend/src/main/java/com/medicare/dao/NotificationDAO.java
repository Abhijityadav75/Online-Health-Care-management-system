package com.medicare.dao;

import com.medicare.model.Notification;
import java.sql.Connection;
import java.util.List;

/**
 * Data Access Object interface for Notification entities with strict user-level isolation.
 */
public interface NotificationDAO {
    List<Notification> findByUserId(String userId);
    boolean create(Notification notification);
    boolean createWithConnection(Notification notification, Connection conn);
    boolean markAsRead(String id, String userId);
    boolean markAllAsRead(String userId);
}
