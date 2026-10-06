package com.medicare.model;

/**
 * Enumeration representing Doctor credential verification statuses.
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED;

    public static ApprovalStatus fromString(String statusStr) {
        if (statusStr == null) return null;
        try {
            return ApprovalStatus.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
