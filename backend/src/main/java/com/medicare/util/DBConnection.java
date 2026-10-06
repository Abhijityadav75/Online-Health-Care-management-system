package com.medicare.util;

import com.medicare.exception.DatabaseException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Thread-safe JDBC Connection factory.
 * Manages database driver registration, connection creation, and resource cleanup.
 */
public class DBConnection {

    static {
        try {
            Class.forName(DatabaseConfig.getDriver());
        } catch (ClassNotFoundException e) {
            throw new DatabaseException("MySQL JDBC Driver not found on classpath: " + DatabaseConfig.getDriver(), e);
        }
    }

    private DBConnection() {
        // Prevent instantiation
    }

    /**
     * Obtains a new JDBC Connection.
     * @return active java.sql.Connection
     * @throws DatabaseException if connection fails
     */
    public static Connection getConnection() {
        try {
            return DriverManager.getConnection(
                    DatabaseConfig.getUrl(),
                    DatabaseConfig.getUsername(),
                    DatabaseConfig.getPassword()
            );
        } catch (SQLException e) {
            throw new DatabaseException("Failed to establish database connection to: " + DatabaseConfig.getUrl(), e);
        }
    }

    /**
     * Safely rolls back a transaction if connection is active.
     */
    public static void rollbackQuietly(Connection conn) {
        if (conn != null) {
            try {
                conn.rollback();
            } catch (SQLException e) {
                System.err.println("Warning: Transaction rollback failed: " + e.getMessage());
            }
        }
    }

    /**
     * Safely closes JDBC resources.
     */
    public static void closeQuietly(AutoCloseable... resources) {
        for (AutoCloseable res : resources) {
            if (res != null) {
                try {
                    res.close();
                } catch (Exception ignored) {
                }
            }
        }
    }
}
