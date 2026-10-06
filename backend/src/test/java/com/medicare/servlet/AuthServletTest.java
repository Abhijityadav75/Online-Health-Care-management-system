package com.medicare.servlet;

import com.medicare.dao.UserDAO;
import com.medicare.model.ApprovalStatus;
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

import java.io.BufferedReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class AuthServletTest {

    @Mock
    private UserDAO userDAO;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpSession session;

    private AuthServlet authServlet;
    private StringWriter responseWriter;

    private static final String DEMO_PASSWORD_HASH = "dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=";

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        authServlet = new AuthServlet(userDAO);
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    @DisplayName("1. Successful Login - Creates HttpSession and Returns Sanitized User")
    void testSuccessfulLogin() throws Exception {
        Patient patient = new Patient("p-1", "John Doe", "john.doe@example.com", "+91 98765 43210", DEMO_PASSWORD_HASH);
        when(request.getPathInfo()).thenReturn("/login");
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{\"email\":\"john.doe@example.com\",\"password\":\"password123\"}")));
        when(request.getSession(true)).thenReturn(session);
        when(userDAO.findByEmail("john.doe@example.com")).thenReturn(Optional.of(patient));

        authServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        verify(session).setAttribute(ServletUtils.SESSION_USER_ID, "p-1");
        verify(session).setAttribute(ServletUtils.SESSION_ROLE, Role.PATIENT);
        assertTrue(responseWriter.toString().contains("Login successful"));
        assertFalse(responseWriter.toString().contains("password123"), "Password hash must never be returned");
    }

    @Test
    @DisplayName("2. Invalid Login - Wrong Password Returns HTTP 401")
    void testInvalidLoginWrongPassword() throws Exception {
        Patient patient = new Patient("p-1", "John Doe", "john.doe@example.com", "+91 98765 43210", DEMO_PASSWORD_HASH);
        when(request.getPathInfo()).thenReturn("/login");
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{\"email\":\"john.doe@example.com\",\"password\":\"wrong_pass\"}")));
        when(userDAO.findByEmail("john.doe@example.com")).thenReturn(Optional.of(patient));

        authServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        assertTrue(responseWriter.toString().contains("Incorrect password"));
    }

    @Test
    @DisplayName("3. Pending Doctor Login - Returns HTTP 403 Forbidden")
    void testPendingDoctorLoginBlocked() throws Exception {
        Doctor pendingDoctor = new Doctor("d-10", "Dr. New Doc", "new.doc@medicare.com", "+91 98765 00010", DEMO_PASSWORD_HASH, "Cardiology", "MD");
        pendingDoctor.setApprovalStatus(ApprovalStatus.PENDING);

        when(request.getPathInfo()).thenReturn("/login");
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader("{\"email\":\"new.doc@medicare.com\",\"password\":\"password123\"}")));
        when(userDAO.findByEmail("new.doc@medicare.com")).thenReturn(Optional.of(pendingDoctor));

        authServlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        assertTrue(responseWriter.toString().contains("pending admin approval"));
    }

    @Test
    @DisplayName("4. Logout - Invalidates Active HttpSession")
    void testLogoutInvalidatesSession() throws Exception {
        when(request.getPathInfo()).thenReturn("/logout");
        when(request.getSession(false)).thenReturn(session);

        authServlet.doPost(request, response);

        verify(session).invalidate();
        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(responseWriter.toString().contains("Logged out successfully"));
    }
}
