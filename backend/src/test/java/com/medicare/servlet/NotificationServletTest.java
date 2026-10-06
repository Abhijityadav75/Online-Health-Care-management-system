package com.medicare.servlet;

import com.medicare.dao.NotificationDAO;
import com.medicare.model.Notification;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class NotificationServletTest {

    @Mock
    private NotificationDAO notificationDAO;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpSession session;

    private NotificationServlet notificationServlet;
    private StringWriter responseWriter;

    @BeforeEach
    void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        notificationServlet = new NotificationServlet(notificationDAO);
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));
    }

    @Test
    @DisplayName("12. Notification Isolation - Returns Only Notifications for Authenticated Doctor Priya")
    void testNotificationUserIsolation() throws Exception {
        Notification docNotif = new Notification("notif-d3-1", "d-3", "MC-20261001-98721", "New Appointment", "abhi booked a consultation", "APPOINTMENT");

        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(notificationDAO.findByUserId("d-3")).thenReturn(List.of(docNotif));

        notificationServlet.doGet(request, response);

        verify(notificationDAO).findByUserId("d-3");
        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(responseWriter.toString().contains("notif-d3-1"));
        assertTrue(responseWriter.toString().contains("abhi booked a consultation"));
    }

    @Test
    @DisplayName("13. Mark All Notifications as Read for Authenticated User")
    void testMarkAllNotificationsRead() throws Exception {
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(ServletUtils.SESSION_USER_ID)).thenReturn("d-3");
        when(request.getPathInfo()).thenReturn("/read-all");
        when(notificationDAO.markAllAsRead("d-3")).thenReturn(true);

        notificationServlet.doPut(request, response);

        verify(notificationDAO).markAllAsRead("d-3");
        verify(response).setStatus(HttpServletResponse.SC_OK);
        assertTrue(responseWriter.toString().contains("All notifications marked as read"));
    }
}
