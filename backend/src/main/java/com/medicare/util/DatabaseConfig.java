package com.medicare.util;

import com.medicare.exception.DatabaseException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Loads database configuration from classpath db.properties or environment variables.
 * Ensures database credentials are never hard-coded in Java source files.
 */
public class DatabaseConfig {
    private static final Properties properties = new Properties();

    static {
        loadConfiguration();
    }

    private static void loadConfiguration() {
        try (InputStream input = DatabaseConfig.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (IOException e) {
            throw new DatabaseException("Failed to load database configuration properties", e);
        }
    }

    public static String getDriver() {
        return System.getenv("DB_DRIVER") != null ? System.getenv("DB_DRIVER") : properties.getProperty("db.driver", "com.mysql.cj.jdbc.Driver");
    }

    public static String getUrl() {
        return System.getenv("DB_URL") != null ? System.getenv("DB_URL") : properties.getProperty("db.url", "jdbc:mysql://localhost:3306/medicare_db?useSSL=false&serverTimezone=UTC");
    }

    public static String getUsername() {
        return System.getenv("DB_USER") != null ? System.getenv("DB_USER") : properties.getProperty("db.username", "root");
    }

    public static String getPassword() {
        return System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : properties.getProperty("db.password", "root123");
    }
}
