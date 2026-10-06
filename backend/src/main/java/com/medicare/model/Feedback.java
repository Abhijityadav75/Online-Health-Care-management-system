package com.medicare.model;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * Domain model representing patient feedback and ratings for medical professionals.
 */
public class Feedback implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String patientId;
    private String patientName;
    private String doctorId;
    private String appointmentId;
    private int rating;
    private String comment;
    private Timestamp createdAt;

    public Feedback() {}

    public Feedback(String id, String patientId, String doctorId, int rating, String comment) {
        this.id = id;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.rating = rating;
        this.comment = comment;
    }

    public Feedback(String id, String patientId, String doctorId, String appointmentId, int rating, String comment) {
        this(id, patientId, doctorId, rating, comment);
        this.appointmentId = appointmentId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
