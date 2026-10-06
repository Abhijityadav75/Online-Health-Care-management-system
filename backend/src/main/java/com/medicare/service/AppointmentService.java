package com.medicare.service;

import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.AppointmentDAOImpl;
import com.medicare.dao.NotificationDAO;
import com.medicare.dao.NotificationDAOImpl;
import com.medicare.exception.AppointmentException;
import com.medicare.exception.DatabaseException;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.Notification;
import com.medicare.util.DBConnection;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Service orchestrating Appointment business logic with strict ACID transaction boundaries.
 * Demonstrates connection.setAutoCommit(false), connection.commit(), connection.rollback(),
 * and graceful exception propagation.
 */
public class AppointmentService {
    private final AppointmentDAO appointmentDAO;
    private final NotificationDAO notificationDAO;
    private final AsyncNotificationService asyncNotificationService;

    public AppointmentService() {
        this.appointmentDAO = new AppointmentDAOImpl();
        this.notificationDAO = new NotificationDAOImpl();
        this.asyncNotificationService = AsyncNotificationService.getInstance();
    }

    public AppointmentService(AppointmentDAO appointmentDAO, NotificationDAO notificationDAO, AsyncNotificationService asyncService) {
        this.appointmentDAO = appointmentDAO;
        this.notificationDAO = notificationDAO;
        this.asyncNotificationService = asyncService;
    }

    /**
     * Books an appointment with full transaction management.
     * Transaction Steps:
     *  1. Begin Transaction (autoCommit = false)
     *  2. Verify Doctor Slot Availability
     *  3. Insert Appointment Record
     *  4. Insert Doctor In-App Notification Record
     *  5. Commit Transaction
     *  6. Trigger Asynchronous Background Tasks (Email/SMS simulation & audit log)
     * If any step fails -> Rollback Transaction.
     */
    public boolean bookAppointmentWithTransaction(Appointment appointment, String patientName) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // 1. Begin Transaction

            // 2. Check doctor slot availability
            boolean isAvailable = appointmentDAO.isSlotAvailable(
                    appointment.getDoctorId(),
                    appointment.getAppointmentDateIso(),
                    appointment.getAppointmentTime(),
                    conn
            );

            if (!isAvailable) {
                throw new AppointmentException(String.format(
                        "Doctor '%s' is already booked on %s at %s. Please select another slot.",
                        appointment.getDoctorId(), appointment.getAppointmentDate(), appointment.getAppointmentTime()
                ));
            }

            // 3. Insert Appointment Record
            boolean aptCreated = appointmentDAO.createWithConnection(appointment, conn);
            if (!aptCreated) {
                throw new DatabaseException("Failed to persist appointment record in database.");
            }

            // 4. Insert Primary Doctor Notification
            Notification doctorNotification = new Notification(
                    "notif-d-" + System.currentTimeMillis(),
                    appointment.getDoctorId(),
                    appointment.getId(),
                    "New Appointment Booked",
                    String.format("%s booked a consultation for %s at %s.", patientName, appointment.getAppointmentDate(), appointment.getAppointmentTime()),
                    "APPOINTMENT"
            );
            boolean notifCreated = notificationDAO.createWithConnection(doctorNotification, conn);
            if (!notifCreated) {
                throw new DatabaseException("Failed to persist doctor notification record in database.");
            }

            // 5. Commit Transaction
            conn.commit();

            // 6. Trigger Asynchronous Secondary Operations (Thread Pool)
            Notification patientNotification = new Notification(
                    "notif-p-" + System.currentTimeMillis(),
                    appointment.getPatientId(),
                    appointment.getId(),
                    "Appointment Confirmed",
                    String.format("Your consultation for %s at %s has been confirmed.", appointment.getAppointmentDate(), appointment.getAppointmentTime()),
                    "APPOINTMENT"
            );
            asyncNotificationService.dispatchAsyncNotification(
                    patientNotification,
                    "APPOINTMENT_BOOKED",
                    appointment.getPatientId(),
                    "Appointment " + appointment.getId() + " confirmed for " + appointment.getAppointmentDate()
            );

            return true;
        } catch (SQLException | RuntimeException e) {
            DBConnection.rollbackQuietly(conn); // Rollback on any failure
            if (e instanceof AppointmentException || e instanceof DatabaseException) {
                throw e;
            }
            throw new AppointmentException("Transaction failed while booking appointment: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException ignored) {}
            }
        }
    }

    public Optional<Appointment> getAppointmentById(String id) {
        return appointmentDAO.findById(id);
    }

    public List<Appointment> getAppointmentsForPatient(String patientId) {
        return appointmentDAO.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsForDoctor(String doctorId) {
        return appointmentDAO.findByDoctorId(doctorId);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentDAO.findAll();
    }

    public boolean cancelAppointment(String id, String userId, String role) {
        boolean updated = appointmentDAO.updateStatus(id, AppointmentStatus.CANCELLED);
        if (updated) {
            asyncNotificationService.dispatchAsyncNotification(
                    null,
                    "APPOINTMENT_CANCELLED",
                    userId,
                    "Appointment " + id + " cancelled by " + role + " (" + userId + ")"
            );
        }
        return updated;
    }
}
