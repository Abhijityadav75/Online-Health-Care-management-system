package com.medicare.model;

/**
 * Domain model representing a System Administrator.
 */
public class Admin extends User {
    private static final long serialVersionUID = 1L;

    public Admin() {
        super();
        this.role = Role.ADMIN;
    }

    public Admin(String id, String name, String email, String phone, String passwordHash) {
        super(id, name, email, phone, passwordHash, Role.ADMIN);
    }
}
