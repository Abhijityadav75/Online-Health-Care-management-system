package com.medicare.dao;

import com.medicare.exception.DatabaseException;
import com.medicare.model.MedicalRecord;
import com.medicare.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Implementation of MedicalRecordDAO.
 */
public class MedicalRecordDAOImpl implements MedicalRecordDAO {

    @Override
    public Optional<MedicalRecord> findById(String id) {
        String sql = "SELECT m.*, d.name AS doctor_name FROM medical_records m " +
                "JOIN users d ON m.doctor_id = d.id WHERE m.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToRecord(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding medical record: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public List<MedicalRecord> findByPatientId(String patientId) {
        List<MedicalRecord> list = new ArrayList<>();
        String sql = "SELECT m.*, d.name AS doctor_name FROM medical_records m " +
                "JOIN users d ON m.doctor_id = d.id WHERE m.patient_id = ? ORDER BY m.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, patientId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToRecord(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding medical records for patient: " + patientId, e);
        }
        return list;
    }

    @Override
    public List<MedicalRecord> findByDoctorId(String doctorId) {
        List<MedicalRecord> list = new ArrayList<>();
        String sql = "SELECT m.*, d.name AS doctor_name FROM medical_records m " +
                "JOIN users d ON m.doctor_id = d.id WHERE m.doctor_id = ? ORDER BY m.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, doctorId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToRecord(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding medical records for doctor: " + doctorId, e);
        }
        return list;
    }

    @Override
    public boolean create(MedicalRecord record) {
        String sql = "INSERT INTO medical_records (id, patient_id, doctor_id, record_date, record_type, diagnosis, treatment_plan, prescriptions) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, record.getId());
            stmt.setString(2, record.getPatientId());
            stmt.setString(3, record.getDoctorId());
            stmt.setString(4, record.getRecordDate());
            stmt.setString(5, record.getRecordType());
            stmt.setString(6, record.getDiagnosis());
            stmt.setString(7, record.getTreatmentPlan());
            stmt.setString(8, record.getPrescriptions());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error inserting medical record: " + record.getId(), e);
        }
    }

    @Override
    public boolean delete(String id) {
        String sql = "DELETE FROM medical_records WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error deleting medical record: " + id, e);
        }
    }

    private MedicalRecord mapResultSetToRecord(ResultSet rs) throws SQLException {
        MedicalRecord rec = new MedicalRecord();
        rec.setId(rs.getString("id"));
        rec.setPatientId(rs.getString("patient_id"));
        rec.setDoctorId(rs.getString("doctor_id"));
        rec.setDoctorName(rs.getString("doctor_name"));
        rec.setRecordDate(rs.getString("record_date"));
        rec.setRecordType(rs.getString("record_type"));
        rec.setDiagnosis(rs.getString("diagnosis"));
        rec.setTreatmentPlan(rs.getString("treatment_plan"));
        rec.setPrescriptions(rs.getString("prescriptions"));
        rec.setCreatedAt(rs.getTimestamp("created_at"));
        return rec;
    }
}
