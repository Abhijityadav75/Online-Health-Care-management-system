package com.medicare.servlet;

import com.medicare.dao.NotificationDAO;
import com.medicare.dao.UserDAO;
import com.medicare.model.ApprovalStatus;
import com.medicare.model.Role;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class UserServletTest {

    @Mock
    private UserDAO userDAO;

    @Mock
    private NotificationDAO notificationDAO;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpSession session;

    private UserServlet userServlet;
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        userServlet = new UserServlet(userDAO, notificationDAO);
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    @DisplayName("10. Doctor Approval by Admin - Updates DB Status to APPROVED and Sends Notification")
    void testDoctorApprovalByAdmin() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("a-1");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.ADMIN);
        when(request.getPathInfo()).thenReturn("/doctors/d-10/approve");

        when(userDAO.updateDoctorApprovalStatus("d-10", ApprovalStatus.APPROVED)).thenReturn(true);
        when(notificationDAO.create(any())).thenReturn(true);

        userServlet.doPut(request, response);

        verify(userDAO).updateDoctorApprovalStatus("d-10", ApprovalStatus.APPROVED);
        verify(notificationDAO).create(any());
        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(responseWriter.toString().contains("Doctor registration approved successfully"));
    }

    @Test
    @DisplayName("11. Forbidden Doctor Approval by Patient - Returns HTTP 403")
    void testDoctorApprovalForbiddenForPatient() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("p-1");
        when(session.getAttribute(ServletUtils.SESSION_ROLE)).thenReturn(Role.PATIENT);
        when(request.getPathInfo()).thenReturn("/doctors/d-10/approve");

        userServlet.doPut(request, response);

        verify(userDAO, never()).updateDoctorApprovalStatus(anyString(), any());
        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        assertTrue(responseWriter.toString().contains("Only administrators can approve doctor credentials"));
    }
}
