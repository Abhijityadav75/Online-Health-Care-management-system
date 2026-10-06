package com.medicare.dao;

import com.medicare.exception.DatabaseException;
import com.medicare.model.Admin;
import com.medicare.model.ApprovalStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Patient;
import com.medicare.model.Role;
import com.medicare.model.User;
import com.medicare.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * JDBC Implementation of UserDAO using PreparedStatement and parameterized queries.
 */
public class UserDAOImpl implements UserDAO {

    @Override
    public Optional<User> findById(String id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding user by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding user by email: " + email, e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> findByPhone(String phone) {
        String sql = "SELECT * FROM users WHERE phone = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, phone.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error finding user by phone: " + phone, e);
        }
        return Optional.empty();
    }

    @Override
    public List<User> findAll() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT * FROM users ORDER BY created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(mapResultSetToUser(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error retrieving all users", e);
        }
        return list;
    }

    @Override
    public List<Patient> findAllPatients() {
        List<Patient> list = new ArrayList<>();
        String sql = "SELECT * FROM users WHERE role = 'PATIENT' ORDER BY name ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add((Patient) mapResultSetToUser(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error retrieving patients", e);
        }
        return list;
    }

    @Override
    public List<Doctor> findAllDoctors() {
        List<Doctor> list = new ArrayList<>();
        String sql = "SELECT * FROM users WHERE role = 'DOCTOR' ORDER BY name ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add((Doctor) mapResultSetToUser(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error retrieving doctors", e);
        }
        return list;
    }

    @Override
    public List<Doctor> findDoctorsByApprovalStatus(ApprovalStatus status) {
        List<Doctor> list = new ArrayList<>();
        String sql = "SELECT * FROM users WHERE role = 'DOCTOR' AND approval_status = ? ORDER BY name ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status.name());
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add((Doctor) mapResultSetToUser(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Error retrieving doctors by approval status: " + status, e);
        }
        return list;
    }

    @Override
    public boolean create(User user) {
        String sql = "INSERT INTO users (id, name, email, phone, password_hash, role, status, avatar_url, dob, gender, address, " +
                "emergency_contact, emergency_relation, specialization, qualification, experience, hospital, consultation_fee, approval_status, rating, reviews_count) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            setStatementParameters(stmt, user);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error creating user: " + user.getEmail(), e);
        }
    }

    @Override
    public boolean update(User user) {
        String sql = "UPDATE users SET name = ?, email = ?, phone = ?, avatar_url = ?, dob = ?, gender = ?, address = ?, " +
                "emergency_contact = ?, emergency_relation = ?, specialization = ?, qualification = ?, experience = ?, hospital = ?, " +
                "consultation_fee = ?, status = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, user.getName());
            stmt.setString(2, user.getEmail());
            stmt.setString(3, user.getPhone());
            stmt.setString(4, user.getAvatarUrl());
            stmt.setString(5, user.getDob());
            stmt.setString(6, user.getGender());
            stmt.setString(7, user.getAddress());

            if (user instanceof Patient patient) {
                stmt.setString(8, patient.getEmergencyContact());
                stmt.setString(9, patient.getEmergencyRelation());
                stmt.setNull(10, java.sql.Types.VARCHAR);
                stmt.setNull(11, java.sql.Types.VARCHAR);
                stmt.setInt(12, 0);
                stmt.setNull(13, java.sql.Types.VARCHAR);
                stmt.setBigDecimal(14, java.math.BigDecimal.ZERO);
            } else if (user instanceof Doctor doctor) {
                stmt.setNull(8, java.sql.Types.VARCHAR);
                stmt.setNull(9, java.sql.Types.VARCHAR);
                stmt.setString(10, doctor.getSpecialization());
                stmt.setString(11, doctor.getQualification());
                stmt.setInt(12, doctor.getExperience());
                stmt.setString(13, doctor.getHospital());
                stmt.setBigDecimal(14, doctor.getConsultationFee());
            } else {
                stmt.setNull(8, java.sql.Types.VARCHAR);
                stmt.setNull(9, java.sql.Types.VARCHAR);
                stmt.setNull(10, java.sql.Types.VARCHAR);
                stmt.setNull(11, java.sql.Types.VARCHAR);
                stmt.setInt(12, 0);
                stmt.setNull(13, java.sql.Types.VARCHAR);
                stmt.setBigDecimal(14, java.math.BigDecimal.ZERO);
            }

            stmt.setString(15, user.getStatus());
            stmt.setString(16, user.getId());

            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error updating user: " + user.getId(), e);
        }
    }

    @Override
    public boolean delete(String id) {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error deleting user: " + id, e);
        }
    }

    @Override
    public boolean updateDoctorApprovalStatus(String doctorId, ApprovalStatus status) {
        String sql = "UPDATE users SET approval_status = ? WHERE id = ? AND role = 'DOCTOR'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status.name());
            stmt.setString(2, doctorId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Error updating doctor approval status: " + doctorId, e);
        }
    }

    private void setStatementParameters(PreparedStatement stmt, User user) throws SQLException {
        stmt.setString(1, user.getId());
        stmt.setString(2, user.getName());
        stmt.setString(3, user.getEmail());
        stmt.setString(4, user.getPhone());
        stmt.setString(5, user.getPasswordHash());
        stmt.setString(6, user.getRole().name());
        stmt.setString(7, user.getStatus());
        stmt.setString(8, user.getAvatarUrl());
        stmt.setString(9, user.getDob());
        stmt.setString(10, user.getGender());
        stmt.setString(11, user.getAddress());

        if (user instanceof Patient patient) {
            stmt.setString(12, patient.getEmergencyContact());
            stmt.setString(13, patient.getEmergencyRelation());
            stmt.setNull(14, java.sql.Types.VARCHAR);
            stmt.setNull(15, java.sql.Types.VARCHAR);
            stmt.setInt(16, 0);
            stmt.setNull(17, java.sql.Types.VARCHAR);
            stmt.setBigDecimal(18, java.math.BigDecimal.ZERO);
            stmt.setNull(19, java.sql.Types.VARCHAR);
            stmt.setDouble(20, 5.0);
            stmt.setInt(21, 0);
        } else if (user instanceof Doctor doctor) {
            stmt.setNull(12, java.sql.Types.VARCHAR);
            stmt.setNull(13, java.sql.Types.VARCHAR);
            stmt.setString(14, doctor.getSpecialization());
            stmt.setString(15, doctor.getQualification());
            stmt.setInt(16, doctor.getExperience());
            stmt.setString(17, doctor.getHospital());
            stmt.setBigDecimal(18, doctor.getConsultationFee());
            stmt.setString(19, doctor.getApprovalStatus() != null ? doctor.getApprovalStatus().name() : "PENDING");
            stmt.setDouble(20, doctor.getRating());
            stmt.setInt(21, doctor.getReviewsCount());
        } else {
            stmt.setNull(12, java.sql.Types.VARCHAR);
            stmt.setNull(13, java.sql.Types.VARCHAR);
            stmt.setNull(14, java.sql.Types.VARCHAR);
            stmt.setNull(15, java.sql.Types.VARCHAR);
            stmt.setInt(16, 0);
            stmt.setNull(17, java.sql.Types.VARCHAR);
            stmt.setBigDecimal(18, java.math.BigDecimal.ZERO);
            stmt.setNull(19, java.sql.Types.VARCHAR);
            stmt.setDouble(20, 5.0);
            stmt.setInt(21, 0);
        }
    }

    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        Role role = Role.fromString(rs.getString("role"));
        User user;

        if (role == Role.DOCTOR) {
            Doctor doc = new Doctor();
            doc.setSpecialization(rs.getString("specialization"));
            doc.setQualification(rs.getString("qualification"));
            doc.setExperience(rs.getInt("experience"));
            doc.setHospital(rs.getString("hospital"));
            doc.setConsultationFee(rs.getBigDecimal("consultation_fee"));
            doc.setApprovalStatus(ApprovalStatus.fromString(rs.getString("approval_status")));
            doc.setRating(rs.getDouble("rating"));
            doc.setReviewsCount(rs.getInt("reviews_count"));
            user = doc;
        } else if (role == Role.PATIENT) {
            Patient pat = new Patient();
            pat.setEmergencyContact(rs.getString("emergency_contact"));
            pat.setEmergencyRelation(rs.getString("emergency_relation"));
            user = pat;
        } else {
            user = new Admin();
        }

        user.setId(rs.getString("id"));
        user.setName(rs.getString("name"));
        user.setEmail(rs.getString("email"));
        user.setPhone(rs.getString("phone"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setRole(role);
        user.setStatus(rs.getString("status"));
        user.setAvatarUrl(rs.getString("avatar_url"));
        user.setDob(rs.getString("dob"));
        user.setGender(rs.getString("gender"));
        user.setAddress(rs.getString("address"));
        user.setCreatedAt(rs.getTimestamp("created_at"));
        user.setUpdatedAt(rs.getTimestamp("updated_at"));

        return user;
    }
}
