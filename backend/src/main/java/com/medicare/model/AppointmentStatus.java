package com.medicare.model;

/**
 * Enumeration representing the lifecycle states of an appointment.
 */
public enum AppointmentStatus {
    UPCOMING,
    COMPLETED,
    CANCELLED;

    public static AppointmentStatus fromString(String statusStr) {
        if (statusStr == null) return UPCOMING;
        try {
            return AppointmentStatus.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return UPCOMING;
        }
    }
}
