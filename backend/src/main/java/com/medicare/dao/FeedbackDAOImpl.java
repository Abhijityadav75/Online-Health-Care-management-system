package com.medicare.dao;

import com.medicare.exception.DatabaseException;
import com.medicare.model.Feedback;
import com.medicare.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * JDBC Implementation of FeedbackDAO with explicit appointment_id foreign key mapping.
 */
public class FeedbackDAOImpl implements FeedbackDAO {

    @Override
    public List<Feedback> findAll() {
        List<Feedback> list = new ArrayList<>();
        String sql = "SELECT f.*, p.name AS patient_name FROM feedback f " +
                "JOIN users p ON f.patient_id = p.id ORDER BY f.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToFeedback(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding all feedback records", e);
        }
        return list;
    }

    @Override
    public List<Feedback> findByDoctorId(String doctorId) {
        List<Feedback> list = new ArrayList<>();
        String sql = "SELECT f.*, p.name AS patient_name FROM feedback f " +
                "JOIN users p ON f.patient_id = p.id WHERE f.doctor_id = ? ORDER BY f.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, doctorId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToFeedback(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding feedback for doctor: " + doctorId, e);
        }
        return list;
    }

    @Override
    public List<Feedback> findByPatientId(String patientId) {
        List<Feedback> list = new ArrayList<>();
        String sql = "SELECT f.*, p.name AS patient_name FROM feedback f " +
                "JOIN users p ON f.patient_id = p.id WHERE f.patient_id = ? ORDER BY f.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, patientId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToFeedback(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding feedback for patient: " + patientId, e);
        }
        return list;
    }

    @Override
    public boolean hasFeedbackForAppointment(String appointmentId) {
        if (appointmentId == null || appointmentId.trim().isEmpty()) {
            return false;
        }
        String sql = "SELECT COUNT(*) FROM feedback WHERE appointment_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, appointmentId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error checking duplicate feedback for appointment: " + appointmentId, e);
        }
        return false;
    }

    @Override
    public boolean create(Feedback feedback) {
        String sql = "INSERT INTO feedback (id, patient_id, doctor_id, appointment_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, feedback.getId());
            stmt.setString(2, feedback.getPatientId());
            stmt.setString(3, feedback.getDoctorId());
            stmt.setString(4, feedback.getAppointmentId());
            stmt.setInt(5, feedback.getRating());
            stmt.setString(6, feedback.getComment());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error creating feedback: " + feedback.getId(), e);
        }
    }

    @Override
    public double getAverageRatingForDoctor(String doctorId) {
        String sql = "SELECT AVG(rating) FROM feedback WHERE doctor_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, doctorId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getDouble(1);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error computing average rating for doctor: " + doctorId, e);
        }
        return 5.0;
    }

    private Feedback mapResultSetToFeedback(ResultSet rs) throws SQLException {
        Feedback fb = new Feedback();
        fb.setId(rs.getString("id"));
        fb.setPatientId(rs.getString("patient_id"));
        fb.setPatientName(rs.getString("patient_name"));
        fb.setDoctorId(rs.getString("doctor_id"));
        fb.setAppointmentId(rs.getString("appointment_id"));
        fb.setRating(rs.getInt("rating"));
        fb.setComment(rs.getString("comment"));
        fb.setCreatedAt(rs.getTimestamp("created_at"));
        return fb;
    }
}
