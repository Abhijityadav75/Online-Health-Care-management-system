package com.medicare.servlet;

import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.UserDAO;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.Role;
import com.medicare.service.AppointmentService;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AppointmentServletTest {

    @Mock
    private AppointmentService appointmentService;

    @Mock
    private AppointmentDAO appointmentDAO;

    @Mock
    private UserDAO userDAO;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpSession session;

    private AppointmentServlet appointmentServlet;
    private StringWriter responseWriter;

    private Appointment canonicalAppointment;

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        appointmentServlet = new AppointmentServlet(appointmentService, appointmentDAO, userDAO);
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
        canonicalAppointment.setStatus(AppointmentStatus.UPCOMING);
    }

    @Test
    @DisplayName("5. Unauthenticated Request - Returns HTTP 401")
    void testUnauthenticatedRequestBlocked() throws Exception {
        when(request.getSession(false)).thenReturn(null);

        appointmentServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        assertTrue(responseWriter.toString().contains("Authentication required"));
    }

    @Test
    @DisplayName("6. Patient Appointment Retrieval - Returns Patient's Canonical Appointment")
    void testPatientAppointmentRetrieval() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        when(request.getPathInfo()).thenReturn("/patient");
        when(appointmentService.getAppointmentsForPatient("p-abhi")).thenReturn(List.of(canonicalAppointment));

        appointmentServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(responseWriter.toString().contains("MC-20261001-98721"));
        assertTrue(responseWriter.toString().contains("Dr. Priya Gupta"));
    }

    @Test
    @DisplayName("7. Doctor Appointment Retrieval - Returns Doctor Priya's Canonical Appointment")
    void testDoctorAppointmentRetrieval() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.DOCTOR);
        when(request.getPathInfo()).thenReturn("/doctor");
        when(appointmentService.getAppointmentsForDoctor("d-3")).thenReturn(List.of(canonicalAppointment));

        appointmentServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(responseWriter.toString().contains("MC-20261001-98721"));
        assertTrue(responseWriter.toString().contains("abhi"));
    }

    @Test
    @DisplayName("8. Admin Appointment Retrieval - Returns All Appointments")
    void testAdminAppointmentRetrieval() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("a-1");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.ADMIN);
        when(request.getPathInfo()).thenReturn("/admin");
        when(appointmentService.getAllAppointments()).thenReturn(List.of(canonicalAppointment));

        appointmentServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(responseWriter.toString().contains("MC-20261001-98721"));
    }

    @Test
    @DisplayName("9. Forbidden Patient to Admin Endpoint Access - Returns HTTP 403")
    void testPatientBlockedFromAdminRoute() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        when(request.getPathInfo()).thenReturn("/admin");

        appointmentServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        assertTrue(responseWriter.toString().contains("Admin role required"));
    }
}
