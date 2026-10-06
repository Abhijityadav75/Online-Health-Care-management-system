package com.medicare.dao;

import com.medicare.model.MedicalRecord;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object interface for MedicalRecord entities.
 */
public interface MedicalRecordDAO {
    Optional<MedicalRecord> findById(String id);
    List<MedicalRecord> findByPatientId(String patientId);
    List<MedicalRecord> findByDoctorId(String doctorId);
    boolean create(MedicalRecord record);
    boolean delete(String id);
}
