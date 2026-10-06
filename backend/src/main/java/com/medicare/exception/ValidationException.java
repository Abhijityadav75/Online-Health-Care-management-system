package com.medicare.exception;

/**
 * Exception thrown when domain validation rules are violated.
 */
public class ValidationException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public ValidationException(String message) {
        super(message);
    }
}
