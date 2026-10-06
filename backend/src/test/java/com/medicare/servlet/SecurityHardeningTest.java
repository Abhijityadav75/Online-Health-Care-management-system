package com.medicare.servlet;

import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.FeedbackDAO;
import com.medicare.dao.MedicalRecordDAO;
import com.medicare.dao.NotificationDAO;
import com.medicare.dao.UserDAO;
import com.medicare.filter.CORSFilter;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.ApprovalStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Feedback;
import com.medicare.model.Patient;
import com.medicare.model.Role;
import com.medicare.model.User;
import com.medicare.service.AppointmentService;
import com.medicare.service.AsyncNotificationService;
import com.medicare.util.PasswordUtils;
import com.medicare.util.ServletUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.BufferedReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.sql.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class SecurityHardeningTest {

    @Mock private UserDAO userDAO;
    @Mock private AppointmentDAO appointmentDAO;
    @Mock private NotificationDAO notificationDAO;
    @Mock private MedicalRecordDAO medicalRecordDAO;
    @Mock private FeedbackDAO feedbackDAO;
    @Mock private AsyncNotificationService asyncService;

    @Mock private HttpServletRequest request;
    @Mock private HttpServletResponse response;
    @Mock private HttpSession session;
    @Mock private FilterChain filterChain;

    private AuthServlet authServlet;
    private AppointmentServlet appointmentServlet;
    private UserServlet userServlet;
    private NotificationServlet notificationServlet;
    private MedicalRecordServlet medicalRecordServlet;
    private FeedbackServlet feedbackServlet;
    private CORSFilter corsFilter;
    private StringWriter responseWriter;

    private Appointment canonicalAppointment;
    private Appointment completedAppointment;
    private Appointment cancelledAppointment;
    private Appointment otherPatientCompletedApt;
    private Doctor doctorPriya;
    private Patient patientAbhi;

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        AppointmentService appointmentService = new AppointmentService(appointmentDAO, notificationDAO, asyncService);
        authServlet = new AuthServlet(userDAO);
        appointmentServlet = new AppointmentServlet(appointmentService, appointmentDAO, userDAO);
        userServlet = new UserServlet(userDAO, notificationDAO);
        notificationServlet = new NotificationServlet(notificationDAO);
        medicalRecordServlet = new MedicalRecordServlet(medicalRecordDAO, notificationDAO, appointmentDAO);
        feedbackServlet = new FeedbackServlet(feedbackDAO, appointmentDAO);
        corsFilter = new CORSFilter();

        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        String hashedPass = PasswordUtils.hashPassword("password123");
        patientAbhi = new Patient("p-abhi", "abhi", "abhi@example.com", "+91 98765 43299", hashedPass);
        doctorPriya = new Doctor("d-3", "Dr. Priya Gupta", "priya@medicare.com", "+91 98765 43213", hashedPass, "Dermatology", "MD");
        doctorPriya.setApprovalStatus(ApprovalStatus.APPROVED);

        canonicalAppointment = new Appointment("MC-20261001-98721", "p-abhi", "d-3", "01 Oct 2026", Date.valueOf("2026-10-01"), "10:30 AM", "Routine health checkup");
        canonicalAppointment.setStatus(AppointmentStatus.UPCOMING);

        completedAppointment = new Appointment("apt-comp-1", "p-abhi", "d-3", "15 Sep 2026", Date.valueOf("2026-09-15"), "10:30 AM", "Followup");
        completedAppointment.setStatus(AppointmentStatus.COMPLETED);

        cancelledAppointment = new Appointment("apt-canc-1", "p-abhi", "d-3", "20 Aug 2026", Date.valueOf("2026-08-20"), "10:30 AM", "Cancelled Checkup");
        cancelledAppointment.setStatus(AppointmentStatus.CANCELLED);

        otherPatientCompletedApt = new Appointment("apt-other-comp", "p-other", "d-3", "10 Sep 2026", Date.valueOf("2026-09-10"), "11:00 AM", "Other Checkup");
        otherPatientCompletedApt.setStatus(AppointmentStatus.COMPLETED);
    }

    @Test
    @DisplayName("1. Admin Cannot Submit Feedback (Patient-Only Enforcement -> HTTP 403)")
    void testAdminCannotSubmitFeedback() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("a-1");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.ADMIN);
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{\"doctorId\":\"d-3\",\"appointmentId\":\"apt-comp-1\",\"rating\":5,\"comment\":\"Admin review\"}")));

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(feedbackDAO, never()).create(any());
        assertTrue(responseWriter.toString().contains("Only registered patients are permitted to submit consultation feedback"));
    }

    @Test
    @DisplayName("2. Doctor Cannot Submit Feedback (Patient-Only Enforcement -> HTTP 403)")
    void testDoctorCannotSubmitFeedback() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.DOCTOR);
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{\"doctorId\":\"d-1\",\"appointmentId\":\"apt-comp-1\",\"rating\":5,\"comment\":\"Doc review\"}")));

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(feedbackDAO, never()).create(any());
        assertTrue(responseWriter.toString().contains("Only registered patients are permitted to submit consultation feedback"));
    }

    @Test
    @DisplayName("3. Patient Cannot Submit Feedback Using Another Patient's AppointmentId -> HTTP 403")
    void testPatientCannotSubmitFeedbackForOtherPatientAppointment() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        String payload = "{\"doctorId\":\"d-3\",\"appointmentId\":\"apt-other-comp\",\"rating\":5,\"comment\":\"Tampered review\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(payload)));
        when(appointmentDAO.findById("apt-other-comp")).thenReturn(Optional.of(otherPatientCompletedApt));

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(feedbackDAO, never()).create(any());
        assertTrue(responseWriter.toString().contains("belonging to another patient"));
    }

    @Test
    @DisplayName("4. Patient Cannot Submit Feedback Using Another Doctor's AppointmentId -> HTTP 403")
    void testPatientCannotSubmitFeedbackForWrongDoctor() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        // apt-comp-1 is with doctor d-3, but payload specifies d-99
        String payload = "{\"doctorId\":\"d-99\",\"appointmentId\":\"apt-comp-1\",\"rating\":5,\"comment\":\"Wrong doc review\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(payload)));
        when(appointmentDAO.findById("apt-comp-1")).thenReturn(Optional.of(completedAppointment));

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(feedbackDAO, never()).create(any());
        assertTrue(responseWriter.toString().contains("not conducted with this doctor"));
    }

    @Test
    @DisplayName("5. Patient Cannot Submit Feedback for UPCOMING Appointment -> HTTP 403")
    void testPatientCannotSubmitFeedbackForUpcomingAppointment() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        String payload = "{\"doctorId\":\"d-3\",\"appointmentId\":\"MC-20261001-98721\",\"rating\":5,\"comment\":\"Premature review\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(payload)));
        when(appointmentDAO.findById("MC-20261001-98721")).thenReturn(Optional.of(canonicalAppointment));

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(feedbackDAO, never()).create(any());
        assertTrue(responseWriter.toString().contains("Feedback can only be submitted for completed consultations"));
    }

    @Test
    @DisplayName("6. Patient Cannot Submit Feedback for CANCELLED Appointment -> HTTP 403")
    void testPatientCannotSubmitFeedbackForCancelledAppointment() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        String payload = "{\"doctorId\":\"d-3\",\"appointmentId\":\"apt-canc-1\",\"rating\":1,\"comment\":\"Cancelled review\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(payload)));
        when(appointmentDAO.findById("apt-canc-1")).thenReturn(Optional.of(cancelledAppointment));

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(feedbackDAO, never()).create(any());
        assertTrue(responseWriter.toString().contains("Feedback can only be submitted for completed consultations"));
    }

    @Test
    @DisplayName("7. Patient Can Submit Feedback for Their Own COMPLETED Appointment -> HTTP 201")
    void testPatientCanSubmitFeedbackForOwnCompletedAppointment() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        String payload = "{\"doctorId\":\"d-3\",\"appointmentId\":\"apt-comp-1\",\"rating\":5,\"comment\":\"Excellent consultation\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(payload)));
        when(appointmentDAO.findById("apt-comp-1")).thenReturn(Optional.of(completedAppointment));
        when(feedbackDAO.hasFeedbackForAppointment("apt-comp-1")).thenReturn(false);
        when(feedbackDAO.create(any())).thenReturn(true);

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_CREATED);
        verify(feedbackDAO).create(argThat(fb -> "apt-comp-1".equals(fb.getAppointmentId()) && "p-abhi".equals(fb.getPatientId())));
        assertTrue(responseWriter.toString().contains("Your feedback has been submitted"));
    }

    @Test
    @DisplayName("8. Duplicate Feedback for the Same Appointment Returns HTTP 409 Conflict")
    void testDuplicateFeedbackReturnsConflict() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        String payload = "{\"doctorId\":\"d-3\",\"appointmentId\":\"apt-comp-1\",\"rating\":5,\"comment\":\"Duplicate review\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(payload)));
        when(appointmentDAO.findById("apt-comp-1")).thenReturn(Optional.of(completedAppointment));
        when(feedbackDAO.hasFeedbackForAppointment("apt-comp-1")).thenReturn(true);

        feedbackServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_CONFLICT);
        verify(feedbackDAO, never()).create(any());
        assertTrue(responseWriter.toString().contains("Feedback has already been submitted for consultation 'apt-comp-1'"));
    }

    @Test
    @DisplayName("9. Doctor Cannot Access Medical Records Through UPCOMING Appointment (COMPLETED Required) -> HTTP 403")
    void testDoctorCannotAccessRecordsThroughUpcomingAppointment() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.DOCTOR);
        when(request.getParameter("patientId")).thenReturn("p-abhi");
        // Only UPCOMING appointment exists
        when(appointmentDAO.findByDoctorId("d-3")).thenReturn(List.of(canonicalAppointment));

        medicalRecordServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(medicalRecordDAO, never()).findByPatientId("p-abhi");
        assertTrue(responseWriter.toString().contains("requires a completed clinical consultation"));
    }

    @Test
    @DisplayName("10. Doctor Cannot Access Medical Records Through CANCELLED Appointment -> HTTP 403")
    void testDoctorCannotAccessRecordsThroughCancelledAppointment() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.DOCTOR);
        when(request.getParameter("patientId")).thenReturn("p-abhi");
        // Only CANCELLED appointment exists
        when(appointmentDAO.findByDoctorId("d-3")).thenReturn(List.of(cancelledAppointment));

        medicalRecordServlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(medicalRecordDAO, never()).findByPatientId("p-abhi");
        assertTrue(responseWriter.toString().contains("Upcoming or cancelled appointments do not authorize access"));
    }

    @Test
    @DisplayName("11. Plaintext Stored Password Rejected (Strict PBKDF2)")
    void testPlaintextStoredPasswordRejected() throws Exception {
        Patient legacyUser = new Patient("p-legacy", "Legacy User", "legacy@medicare.com", "+91 90000 11111", "plaintext_pass");
        when(request.getPathInfo()).thenReturn("/login");
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{\"email\":\"legacy@medicare.com\",\"password\":\"plaintext_pass\"}")));
        when(userDAO.findByEmail("legacy@medicare.com")).thenReturn(Optional.of(legacyUser));

        authServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    @DisplayName("12. Canonical Appointment MC-20261001-98721 Cross-Role Integrity")
    void testCanonicalAppointmentIntegrity() throws Exception {
        when(appointmentDAO.findById("MC-20261001-98721")).thenReturn(Optional.of(canonicalAppointment));
        when(request.getPathInfo()).thenReturn("/MC-20261001-98721");

        // Patient abhi
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-abhi");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        appointmentServlet.doGet(request, response);
        assertTrue(responseWriter.toString().contains("MC-20261001-98721"));
    }
}
