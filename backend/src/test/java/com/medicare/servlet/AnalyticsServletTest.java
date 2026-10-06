package com.medicare.servlet;

import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.FeedbackDAO;
import com.medicare.dao.UserDAO;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Patient;
import com.medicare.model.Role;
import com.medicare.model.User;
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

public class AnalyticsServletTest {

    @Mock
    private AppointmentDAO appointmentDAO;

    @Mock
    private UserDAO userDAO;

    @Mock
    private FeedbackDAO feedbackDAO;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpSession session;

    private AnalyticsServlet analyticsServlet;
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        analyticsServlet = new AnalyticsServlet(appointmentDAO, userDAO, feedbackDAO);
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    @DisplayName("14. Dynamic Database Analytics Calculation for Admin")
    void testDynamicAnalyticsCalculation() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.ADMIN);

        Appointment apt1 = new Appointment("MC-20261001-98721", "p-abhi", "d-3", "01 Oct 2026", Date.valueOf("2026-10-01"), "10:30 AM", "Checkup");
        apt1.setStatus(AppointmentStatus.UPCOMING);
        apt1.setDoctorSpecialization("Dermatologist");

        Appointment apt2 = new Appointment("apt-3", "p-1", "d-3", "02 Sep 2026", Date.valueOf("2026-09-02"), "02:00 PM", "Follow-up");
        apt2.setStatus(AppointmentStatus.COMPLETED);
        apt2.setDoctorSpecialization("Dermatologist");

        Doctor doc3 = new Doctor("d-3", "Dr. Priya Gupta", "priya@medicare.com", "+91 98765 43213", "pass", "Dermatology", "MD");
        Patient p1 = new Patient("p-1", "John Doe", "john@example.com", "+91 98765 43210", "pass");
        Patient pAbhi = new Patient("p-abhi", "abhi", "abhi@example.com", "+91 98765 43299", "pass");

        when(appointmentDAO.findAll()).thenReturn(List.of(apt1, apt2));
        when(userDAO.findAll()).thenReturn(List.of(doc3, p1, pAbhi));
        when(userDAO.findAllDoctors()).thenReturn(List.of(doc3));

        analyticsServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        String json = responseWriter.toString();
        assertTrue(json.contains("\"totalAppointments\":2"));
        assertTrue(json.contains("\"completedConsultations\":1"));
        assertTrue(json.contains("\"upcomingAppointments\":1"));
        assertTrue(json.contains("Dermatology"));
    }
}
