package com.medicare.servlet;

import com.medicare.dao.AppointmentDAO;
import com.medicare.dao.AppointmentDAOImpl;
import com.medicare.dao.FeedbackDAO;
import com.medicare.dao.FeedbackDAOImpl;
import com.medicare.dao.UserDAO;
import com.medicare.dao.UserDAOImpl;
import com.medicare.model.Appointment;
import com.medicare.model.AppointmentStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Role;
import com.medicare.model.User;
import com.medicare.util.ServletUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Jakarta Servlet calculating dynamic system analytics, appointment distributions, and department statistics directly from the database.
 * Maps endpoints:
 *   GET /api/analytics/overview
 */
@WebServlet(name = "AnalyticsServlet", urlPatterns = {"/api/analytics/*"})
public class AnalyticsServlet extends HttpServlet {

    private final AppointmentDAO appointmentDAO;
    private final UserDAO userDAO;
    private final FeedbackDAO feedbackDAO;

    public AnalyticsServlet() {
        this.appointmentDAO = new AppointmentDAOImpl();
        this.userDAO = new UserDAOImpl();
        this.feedbackDAO = new FeedbackDAOImpl();
    }

    public AnalyticsServlet(AppointmentDAO appointmentDAO, UserDAO userDAO, FeedbackDAO feedbackDAO) {
        this.appointmentDAO = appointmentDAO;
        this.userDAO = userDAO;
        this.feedbackDAO = feedbackDAO;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Role currentRole = ServletUtils.getSessionRole(request);
        if (currentRole != Role.ADMIN) {
            ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Administrative privileges required to access system analytics");
            return;
        }

        // 1. Fetch live datasets from database
        List<Appointment> allAppointments = appointmentDAO.findAll();
        List<User> allUsers = userDAO.findAll();
        List<Doctor> allDoctors = userDAO.findAllDoctors();

        int totalAppointments = allAppointments.size();
        long completedConsultations = allAppointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count();
        long upcomingAppointments = allAppointments.stream().filter(a -> a.getStatus() == AppointmentStatus.UPCOMING).count();
        long cancelledAppointments = allAppointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count();

        long patientCount = allUsers.stream().filter(u -> u.getRole() == Role.PATIENT).count();
        long doctorCount = allDoctors.size();
        long adminCount = allUsers.stream().filter(u -> u.getRole() == Role.ADMIN).count();

        // 2. Calculate department distributions dynamically
        String[] departments = {"Cardiology", "General Medicine", "Dermatology", "Orthopedics"};
        List<Map<String, Object>> deptStats = new ArrayList<>();

        for (String dept : departments) {
            long docCount = allDoctors.stream()
                    .filter(d -> d.getSpecialization() != null && d.getSpecialization().toLowerCase().contains(dept.toLowerCase().substring(0, 4)))
                    .count();

            long consultCount = allAppointments.stream()
                    .filter(a -> a.getDoctorSpecialization() != null && a.getDoctorSpecialization().toLowerCase().contains(dept.toLowerCase().substring(0, 4)))
                    .count();

            int load = totalAppointments > 0 ? (int) Math.round(((double) consultCount / totalAppointments) * 100) : 0;

            Map<String, Object> dMap = new HashMap<>();
            dMap.put("department", dept);
            dMap.put("doctorCount", docCount);
            dMap.put("consultations", consultCount);
            dMap.put("loadPercentage", load + "%");
            deptStats.add(dMap);
        }

        Map<String, Object> overview = new HashMap<>();
        overview.put("totalAppointments", totalAppointments);
        overview.put("completedConsultations", completedConsultations);
        overview.put("upcomingAppointments", upcomingAppointments);
        overview.put("cancelledAppointments", cancelledAppointments);
        overview.put("standardConsultationDuration", "20 mins");
        overview.put("totalUsers", allUsers.size());
        overview.put("patientCount", patientCount);
        overview.put("doctorCount", doctorCount);
        overview.put("adminCount", adminCount);
        overview.put("departments", deptStats);

        ServletUtils.sendSuccess(response, overview, "Live analytics computed successfully from database");
    }
}
