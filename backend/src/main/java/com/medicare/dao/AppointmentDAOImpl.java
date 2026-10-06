package com.medicare.dao;

import com.medicare.exception.DatabaseException;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.util.DBConnection;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Implementation of AppointmentDAO with parameterization, slot conflict validation,
 * and support for transactional operations.
 */
public class AppointmentDAOImpl implements AppointmentDAO {

    @Override
    public Optional<Appointment> findById(String id) {
        String sql = "SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization AS doctor_specialization " +
                "FROM appointments a " +
                "JOIN users p ON a.patient_id = p.id " +
                "JOIN users d ON a.doctor_id = d.id " +
                "WHERE a.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToAppointment(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding appointment by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public List<Appointment> findByPatientId(String patientId) {
        List<Appointment> list = new ArrayList<>();
        String sql = "SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization AS doctor_specialization " +
                "FROM appointments a " +
                "JOIN users p ON a.patient_id = p.id " +
                "JOIN users d ON a.doctor_id = d.id " +
                "WHERE a.patient_id = ? ORDER BY a.appointment_date_iso DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, patientId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToAppointment(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding appointments for patient: " + patientId, e);
        }
        return list;
    }

    @Override
    public List<Appointment> findByDoctorId(String doctorId) {
        List<Appointment> list = new ArrayList<>();
        String sql = "SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization AS doctor_specialization " +
                "FROM appointments a " +
                "JOIN users p ON a.patient_id = p.id " +
                "JOIN users d ON a.doctor_id = d.id " +
                "WHERE a.doctor_id = ? ORDER BY a.appointment_date_iso DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, doctorId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToAppointment(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding appointments for doctor: " + doctorId, e);
        }
        return list;
    }

    @Override
    public List<Appointment> findAll() {
        List<Appointment> list = new ArrayList<>();
        String sql = "SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization AS doctor_specialization " +
                "FROM appointments a " +
                "JOIN users p ON a.patient_id = p.id " +
                "JOIN users d ON a.doctor_id = d.id " +
                "ORDER BY a.appointment_date_iso DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToAppointment(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error retrieving all appointments", e);
        }
        return list;
    }

    @Override
    public List<Appointment> findByStatus(AppointmentStatus status) {
        List<Appointment> list = new ArrayList<>();
        String sql = "SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization AS doctor_specialization " +
                "FROM appointments a " +
                "JOIN users p ON a.patient_id = p.id " +
                "JOIN users d ON a.doctor_id = d.id " +
                "WHERE a.status = ? ORDER BY a.appointment_date_iso ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status.name());
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToAppointment(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding appointments by status: " + status, e);
        }
        return list;
    }

    @Override
    public boolean isSlotAvailable(String doctorId, Date dateIso, String time, Connection conn) {
        String sql = "SELECT COUNT(*) FROM appointments " +
                "WHERE doctor_id = ? AND appointment_date_iso = ? AND appointment_time = ? AND status != 'CANCELLED'";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, doctorId);
            stmt.setDate(2, dateIso);
            stmt.setString(3, time);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) == 0;
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error checking slot availability for doctor " + doctorId, e);
        }
        return false;
    }

    @Override
    public boolean create(Appointment appointment) {
        try (Connection conn = DBConnection.getConnection()) {
            return createWithConnection(appointment, conn);
        } catch (SQLException e) {
            throw new DatabaseException("Error creating appointment: " + appointment.getId(), e);
        }
    }

    @Override
    public boolean createWithConnection(Appointment appointment, Connection conn) {
        String sql = "INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_date_iso, appointment_time, type, reason, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, appointment.getId());
            stmt.setString(2, appointment.getPatientId());
            stmt.setString(3, appointment.getDoctorId());
            stmt.setString(4, appointment.getAppointmentDate());
            stmt.setDate(5, appointment.getAppointmentDateIso());
            stmt.setString(6, appointment.getAppointmentTime());
            stmt.setString(7, appointment.getType());
            stmt.setString(8, appointment.getReason());
            stmt.setString(9, appointment.getStatus().name());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error executing appointment insert: " + appointment.getId(), e);
        }
    }

    @Override
    public boolean update(Appointment appointment) {
        String sql = "UPDATE appointments SET appointment_date = ?, appointment_date_iso = ?, appointment_time = ?, " +
                "type = ?, reason = ?, status = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, appointment.getAppointmentDate());
            stmt.setDate(2, appointment.getAppointmentDateIso());
            stmt.setString(3, appointment.getAppointmentTime());
            stmt.setString(4, appointment.getType());
            stmt.setString(5, appointment.getReason());
            stmt.setString(6, appointment.getStatus().name());
            stmt.setString(7, appointment.getId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error updating appointment: " + appointment.getId(), e);
        }
    }

    @Override
    public boolean updateStatus(String id, AppointmentStatus status) {
        String sql = "UPDATE appointments SET status = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status.name());
            stmt.setString(2, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error updating status for appointment: " + id, e);
        }
    }

    @Override
    public boolean reschedule(String id, String date, Date dateIso, String time) {
        String sql = "UPDATE appointments SET appointment_date = ?, appointment_date_iso = ?, appointment_time = ?, status = 'UPCOMING' WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, date);
            stmt.setDate(2, dateIso);
            stmt.setString(3, time);
            stmt.setString(4, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error rescheduling appointment: " + id, e);
        }
    }

    @Override
    public boolean delete(String id) {
        String sql = "DELETE FROM appointments WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error deleting appointment: " + id, e);
        }
    }

    private Appointment mapResultSetToAppointment(ResultSet rs) throws SQLException {
        Appointment a = new Appointment();
        a.setId(rs.getString("id"));
        a.setPatientId(rs.getString("patient_id"));
        a.setDoctorId(rs.getString("doctor_id"));
        a.setPatientName(rs.getString("patient_name"));
        a.setDoctorName(rs.getString("doctor_name"));
        a.setDoctorSpecialization(rs.getString("doctor_specialization"));
        a.setAppointmentDate(rs.getString("appointment_date"));
        a.setAppointmentDateIso(rs.getDate("appointment_date_iso"));
        a.setAppointmentTime(rs.getString("appointment_time"));
        a.setType(rs.getString("type"));
        a.setReason(rs.getString("reason"));
        a.setStatus(AppointmentStatus.fromString(rs.getString("status")));
        a.setCreatedAt(rs.getTimestamp("created_at"));
        a.setUpdatedAt(rs.getTimestamp("updated_at"));
        return a;
    }
}
