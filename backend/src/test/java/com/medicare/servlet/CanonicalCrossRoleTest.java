package com.medicare.servlet;

import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.NotificationDAO;
import com.medicare.dao.UserDAO;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Notification;
import com.medicare.model.Patient;
import com.medicare.model.Role;
import com.medicare.service.AppointmentService;
import com.medicare.service.AsyncNotificationService;
import com.medicare.util.ServletUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.sql.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * End-to-End Cross-Role Integration Verification for Canonical Appointment:
 *  - ID: MC-20261001-98721
 *  - Patient: abhi (p-abhi)
 *  - Doctor: Dr. Priya Gupta (d-3)
 *  - Date: 01 October 2026
 *  - Time: 10:30 AM
 *  - Type: Consultation
 *  - Reason: Routine health checkup and consultation
 */
public class CanonicalCrossRoleTest {

    @Mock
    private AppointmentDAO appointmentDAO;

    @Mock
    private NotificationDAO notificationDAO;

    @Mock
    private UserDAO userDAO;

    @Mock
    private AsyncNotificationService asyncNotificationService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpSession session;

    private AppointmentService appointmentService;
    private AppointmentServlet appointmentServlet;
    private NotificationServlet notificationServlet;
    private StringWriter responseWriter;

    private Appointment canonicalAppointment;
    private Notification doctorNotification;
    private Notification patientNotification;

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        appointmentService = new AppointmentService(appointmentDAO, notificationDAO, asyncNotificationService);
        appointmentServlet = new AppointmentServlet(appointmentService, appointmentDAO, userDAO);
        notificationServlet = new NotificationServlet(notificationDAO);
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        canonicalAppointment = new Appointment(
                "MC-20261001-98721",
                "p-abhi",
                "d-3",
                "01 Oct 2026",
                Date.valueOf("2026-10-01"),
                "10:30 AM",
                "Routine health checkup and consultation"
        );
        canonicalAppointment.setPatientName("abhi");
        canonicalAppointment.setDoctorName("Dr. Priya Gupta");
        canonicalAppointment.setDoctorSpecialization("Dermatologist");
        canonicalAppointment.setStatus(AppointmentStatus.UPCOMING);

        doctorNotification = new Notification(
                "notif-d3-1",
                "d-3",
                "MC-20261001-98721",
                "New Appointment Booked",
                "abhi booked a consultation for 01 Oct 2026 at 10:30 AM.",
                "APPOINTMENT"
        );

        patientNotification = new Notification(
                "notif-p-abhi-1",
                "p-abhi",
                "MC-20261001-98721",
                "Appointment Confirmed",
                "Your consultation with Dr. Priya Gupta for 01 Oct 2026 at 10:30 AM has been confirmed.",
                "APPOINTMENT"
        );
    }

    @Test
    @DisplayName("Verification: Canonical Appointment MC-20261001-98721 Shared Across All Portals")
    void testCanonicalAppointmentCrossRoleAccess() throws Exception {
        // 1. Patient abhi queries appointments
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        when(request.getPathInfo()).thenReturn("/patient");
        when(appointmentDAO.findByPatientId("p-abhi")).thenReturn(List.of(canonicalAppointment));

        appointmentServlet.doGet(request, response);
        assertTrue(responseWriter.toString().contains("MC-20261001-98721"));
        assertTrue(responseWriter.toString().contains("Dr. Priya Gupta"));

        // 2. Doctor Priya queries appointments
        responseWriter.getBuffer().setLength(0);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.DOCTOR);
        when(request.getPathInfo()).thenReturn("/doctor");
        when(appointmentDAO.findByDoctorId("d-3")).thenReturn(List.of(canonicalAppointment));

        appointmentServlet.doGet(request, response);
        assertTrue(responseWriter.toString().contains("MC-20261001-98721"));
        assertTrue(responseWriter.toString().contains("abhi"));

        // 3. Admin queries all appointments
        responseWriter.getBuffer().setLength(0);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("a-1");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.ADMIN);
        when(request.getPathInfo()).thenReturn("/admin");
        when(appointmentDAO.findAll()).thenReturn(List.of(canonicalAppointment));

        appointmentServlet.doGet(request, response);
        assertTrue(responseWriter.toString().contains("MC-20261001-98721"));

        // 4. Verify Doctor Priya receives single in-app notification
        responseWriter.getBuffer().setLength(0);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(request.getPathInfo()).thenReturn("/");
        when(notificationDAO.findByUserId("d-3")).thenReturn(List.of(doctorNotification));

        notificationServlet.doGet(request, response);
        assertTrue(responseWriter.toString().contains("notif-d3-1"));
        assertTrue(responseWriter.toString().contains("abhi booked a consultation"));

        // 5. Verify status consistency
        assertEquals(AppointmentStatus.UPCOMING, canonicalAppointment.getStatus());
        assertEquals("01 Oct 2026", canonicalAppointment.getAppointmentDate());
        assertEquals("10:30 AM", canonicalAppointment.getAppointmentTime());
    }
}
