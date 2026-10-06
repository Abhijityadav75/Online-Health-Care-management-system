package com.medicare.dao;

import com.medicare.exception.AppointmentException;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.Notification;
import com.medicare.service.AppointmentService;
import com.medicare.service.AsyncNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.sql.Connection;
import java.sql.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class TransactionHandlingTest {

    @Mock
    private AppointmentDAO appointmentDAO;

    @Mock
    private NotificationDAO notificationDAO;

    @Mock
    private AsyncNotificationService asyncNotificationService;

    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        this.appointmentService = new AppointmentService(appointmentDAO, notificationDAO, asyncNotificationService);
    }

    @Test
    @DisplayName("Transaction Rollback when Slot is Already Booked")
    void testRollbackOnSlotConflict() {
        Appointment newApt = new Appointment(
                "MC-20261001-99999",
                "p-1",
                "d-3",
                "01 Oct 2026",
                Date.valueOf("2026-10-01"),
                "10:30 AM",
                "Duplicate slot attempt"
        );

        // Simulate slot already booked (isSlotAvailable returns false)
        when(appointmentDAO.isSlotAvailable(eq("d-3"), eq(Date.valueOf("2026-10-01")), eq("10:30 AM"), any()))
                .thenReturn(false);

        AppointmentException thrown = assertThrows(
                AppointmentException.class,
                () -> appointmentService.bookAppointmentWithTransaction(newApt, "John Doe"),
                "Expected booking to fail due to slot conflict"
        );

        assertTrue(thrown.getMessage().contains("already booked"), "Exception message should indicate slot conflict");

        // Verify that create was NEVER executed because pre-check failed
        verify(appointmentDAO, never()).createWithConnection(any(), any());
        verify(notificationDAO, never()).createWithConnection(any(), any());
    }
}
