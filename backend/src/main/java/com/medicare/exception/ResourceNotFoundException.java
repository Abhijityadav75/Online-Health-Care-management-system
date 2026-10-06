package com.medicare.exception;

/**
 * Exception thrown when a requested user, appointment, or record is not found in the database.
 */
public class ResourceNotFoundException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
