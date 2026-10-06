package com.medicare.exception;

/**
 * Exception thrown when appointment booking, slot reservation, rescheduling, or validation fails.
 */
public class AppointmentException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public AppointmentException(String message) {
        super(message);
    }

    public AppointmentException(String message, Throwable cause) {
        super(message, cause);
    }
}
