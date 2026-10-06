package com.medicare.filter;

import com.medicare.model.Role;
import com.medicare.util.ServletUtils;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.Set;

/**
 * Jakarta Servlet Filter enforcing server-side session authentication and role-based access control.
 * Protects enterprise API endpoints from unauthenticated and unauthorized access.
 */
@WebFilter(filterName = "AuthFilter", urlPatterns = {"/api/*"})
public class AuthFilter implements Filter {

    // Endpoints that do not require an active session
    private static final Set<String> PUBLIC_PATH_PREFIXES = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/status",
            "/api/public/"
    );

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        // Allow OPTIONS pre-flight checks to proceed unconditionally
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());

        // Check if path is public
        boolean isPublic = PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith);
        if (isPublic) {
            chain.doFilter(req, res);
            return;
        }

        // Validate active session
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute(ServletUtils.SESSION_USER_ID) == null) {
            ServletUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized", "Authentication required to access this resource");
            return;
        }

        Role userRole = ServletUtils.getSessionRole(request);

        // Role Authorization Guard: Admin-only paths
        if (path.startsWith("/api/admin") || path.startsWith("/api/analytics") || path.contains("/approve") || path.contains("/reject")) {
            if (userRole != Role.ADMIN) {
                ServletUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden", "Administrative privileges required");
                return;
            }
        }

        chain.doFilter(req, res);
    }

    @Override
    public void destroy() {}
}
