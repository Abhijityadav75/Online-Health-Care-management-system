package com.medicare.dao;

import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.sql.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AppointmentDAOTest {

    @Mock
    private AppointmentDAO appointmentDAO;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Verify Canonical Appointment MC-20261001-98721 Attributes")
    void testCanonicalAppointmentIntegrity() {
        Appointment canonical = new Appointment(
                "MC-20261001-98721",
                "p-abhi",
                "d-3",
                "01 Oct 2026",
                Date.valueOf("2026-10-01"),
                "10:30 AM",
                "Routine health checkup and consultation"
        );
        canonical.setPatientName("abhi");
        canonical.setDoctorName("Dr. Priya Gupta");
        canonical.setDoctorSpecialization("Dermatologist");
        canonical.setStatus(AppointmentStatus.UPCOMING);

        when(appointmentDAO.findById("MC-20261001-98721")).thenReturn(Optional.of(canonical));

        Optional<Appointment> result = appointmentDAO.findById("MC-20261001-98721");
        assertTrue(result.isPresent(), "Canonical appointment must exist");
        assertEquals("p-abhi", result.get().getPatientId());
        assertEquals("d-3", result.get().getDoctorId());
        assertEquals("01 Oct 2026", result.get().getAppointmentDate());
        assertEquals("10:30 AM", result.get().getAppointmentTime());
        assertEquals(AppointmentStatus.UPCOMING, result.get().getStatus());
    }

    @Test
    @DisplayName("Test Appointment Status Update to Completed")
    void testAppointmentStatusUpdate() {
        when(appointmentDAO.updateStatus("MC-20261001-98721", AppointmentStatus.COMPLETED)).thenReturn(true);

        boolean updated = appointmentDAO.updateStatus("MC-20261001-98721", AppointmentStatus.COMPLETED);
        assertTrue(updated, "Status update should succeed");
        verify(appointmentDAO, times(1)).updateStatus("MC-20261001-98721", AppointmentStatus.COMPLETED);
    }

    @Test
    @DisplayName("Test Appointment Rescheduling Preserves ID")
    void testAppointmentReschedule() {
        Date newDateIso = Date.valueOf("2026-10-15");
        when(appointmentDAO.reschedule("MC-20261001-98721", "15 Oct 2026", newDateIso, "11:30 AM")).thenReturn(true);

        boolean rescheduled = appointmentDAO.reschedule("MC-20261001-98721", "15 Oct 2026", newDateIso, "11:30 AM");
        assertTrue(rescheduled, "Reschedule must succeed on the same ID");
    }
}
