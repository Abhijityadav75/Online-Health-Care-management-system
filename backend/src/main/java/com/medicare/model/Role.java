package com.medicare.model;

/**
 * Enumeration representing user access control roles.
 */
public enum Role {
    PATIENT,
    DOCTOR,
    ADMIN;

    public static Role fromString(String roleStr) {
        if (roleStr == null) return PATIENT;
        try {
            return Role.valueOf(roleStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PATIENT;
        }
    }
}
