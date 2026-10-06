package com.medicare.model;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * Domain model representing user system, appointment, and medical alerts.
 */
public class Notification implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String userId;
    private String appointmentId;
    private String title;
    private String message;
    private String notificationType; // "APPOINTMENT", "MEDICAL", "SYSTEM"
    private boolean isRead;
    private Timestamp createdAt;

    public Notification() {
        this.isRead = false;
        this.notificationType = "SYSTEM";
    }

    public Notification(String id, String userId, String appointmentId, String title, String message, String notificationType) {
        this();
        this.id = id;
        this.userId = userId;
        this.appointmentId = appointmentId;
        this.title = title;
        this.message = message;
        this.notificationType = notificationType;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
