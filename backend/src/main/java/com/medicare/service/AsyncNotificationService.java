package com.medicare.service;

import com.medicare.dao.NotificationDAO;
import com.medicare.dao.NotificationDAOImpl;
import com.medicare.model.Notification;
import com.medicare.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Concurrency Service demonstrating legitimate backend Java Threads and ThreadPool execution.
 * Offloads audit logging, email/SMS notification simulation, and secondary alert dispatch
 * to a managed background thread pool after the primary database transaction commits.
 */
public class AsyncNotificationService {
    private static final AsyncNotificationService INSTANCE = new AsyncNotificationService();
    private final ExecutorService executorService;
    private final NotificationDAO notificationDAO;

    private AsyncNotificationService() {
        this.notificationDAO = new NotificationDAOImpl();
        this.executorService = Executors.newFixedThreadPool(4, new ThreadFactory() {
            private final AtomicInteger threadNumber = new AtomicInteger(1);
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r, "MediCare-AsyncWorker-" + threadNumber.getAndIncrement());
                thread.setDaemon(true);
                return thread;
            }
        });
    }

    public static AsyncNotificationService getInstance() {
        return INSTANCE;
    }

    /**
     * Dispatches an asynchronous notification and records an audit log in the background.
     */
    public void dispatchAsyncNotification(Notification notification, String eventType, String performedBy, String details) {
        executorService.submit(() -> {
            try {
                // 1. Process asynchronous notification insert if not already saved in main transaction
                if (notification != null) {
                    notificationDAO.create(notification);
                }

                // 2. Record async audit trail in database
                logAuditEvent(eventType, notification != null ? notification.getId() : "SYSTEM", performedBy, details);

                System.out.printf("[%s] Asynchronously processed event '%s' for user '%s'%n",
                        Thread.currentThread().getName(), eventType, notification != null ? notification.getUserId() : "N/A");
            } catch (Exception e) {
                System.err.printf("[%s] Error in background task execution: %s%n",
                        Thread.currentThread().getName(), e.getMessage());
            }
        });
    }

    private void logAuditEvent(String eventType, String entityId, String performedBy, String details) {
        String sql = "INSERT INTO audit_logs (event_type, entity_id, performed_by, details) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, eventType);
            stmt.setString(2, entityId);
            stmt.setString(3, performedBy);
            stmt.setString(4, details);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Failed to insert audit log asynchronously: " + e.getMessage());
        }
    }

    public void shutdown() {
        executorService.shutdown();
    }
}
