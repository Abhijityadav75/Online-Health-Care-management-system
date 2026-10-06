package com.medicare.dao;

import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import java.sql.Connection;
import java.sql.Date;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object interface for Appointment entities.
 */
public interface AppointmentDAO {
    Optional<Appointment> findById(String id);
    List<Appointment> findByPatientId(String patientId);
    List<Appointment> findByDoctorId(String doctorId);
    List<Appointment> findAll();
    List<Appointment> findByStatus(AppointmentStatus status);
    boolean isSlotAvailable(String doctorId, Date dateIso, String time, Connection conn);
    boolean create(Appointment appointment);
    boolean createWithConnection(Appointment appointment, Connection conn);
    boolean update(Appointment appointment);
    boolean updateStatus(String id, AppointmentStatus status);
    boolean reschedule(String id, String date, Date dateIso, String time);
    boolean delete(String id);
}
