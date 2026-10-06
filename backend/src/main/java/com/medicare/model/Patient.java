package com.medicare.model;

/**
 * Domain model representing a Patient with specific emergency contact fields.
 */
public class Patient extends User {
    private static final long serialVersionUID = 1L;

    private String emergencyContact;
    private String emergencyRelation;

    public Patient() {
        super();
        this.role = Role.PATIENT;
    }

    public Patient(String id, String name, String email, String phone, String passwordHash) {
        super(id, name, email, phone, passwordHash, Role.PATIENT);
    }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getEmergencyRelation() { return emergencyRelation; }
    public void setEmergencyRelation(String emergencyRelation) { this.emergencyRelation = emergencyRelation; }
}
