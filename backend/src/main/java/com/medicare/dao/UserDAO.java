package com.medicare.dao;

import com.medicare.model.ApprovalStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Patient;
import com.medicare.model.User;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object interface for User entities.
 */
public interface UserDAO {
    Optional<User> findById(String id);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    List<User> findAll();
    List<Patient> findAllPatients();
    List<Doctor> findAllDoctors();
    List<Doctor> findDoctorsByApprovalStatus(ApprovalStatus status);
    boolean create(User user);
    boolean update(User user);
    boolean delete(String id);
    boolean updateDoctorApprovalStatus(String doctorId, ApprovalStatus status);
}
