package com.medicare.dao;

import com.medicare.model.Feedback;
import java.util.List;

/**
 * Data Access Object interface for Feedback entities.
 */
public interface FeedbackDAO {
    List<Feedback> findAll();
    List<Feedback> findByDoctorId(String doctorId);
    List<Feedback> findByPatientId(String patientId);
    boolean hasFeedbackForAppointment(String appointmentId);
    boolean create(Feedback feedback);
    double getAverageRatingForDoctor(String doctorId);
}
