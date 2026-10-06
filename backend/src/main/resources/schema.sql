-- =====================================================================
-- MediCare Enterprise Database Schema (MySQL 8.0+)
-- Normalized with Primary Keys, Foreign Keys, Indexes & Constraints
-- =====================================================================

CREATE DATABASE IF NOT EXISTS medicare_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medicare_db;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    avatar_url VARCHAR(255),
    dob VARCHAR(20),
    gender VARCHAR(20),
    address VARCHAR(255),
    emergency_contact VARCHAR(20),
    emergency_relation VARCHAR(50),
    specialization VARCHAR(100),
    qualification VARCHAR(100),
    experience INT DEFAULT 0,
    hospital VARCHAR(100),
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT NULL,
    rating DECIMAL(3,2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email),
    INDEX idx_doctor_approval (approval_status)
) ENGINE=InnoDB;

-- 2. Table: appointments
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    appointment_date VARCHAR(50) NOT NULL,
    appointment_date_iso DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    type VARCHAR(50) DEFAULT 'Consultation',
    reason TEXT NOT NULL,
    status ENUM('UPCOMING', 'COMPLETED', 'CANCELLED') DEFAULT 'UPCOMING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_apt_patient (patient_id),
    INDEX idx_apt_doctor (doctor_id),
    INDEX idx_apt_status (status),
    INDEX idx_apt_slot (doctor_id, appointment_date_iso, appointment_time)
) ENGINE=InnoDB;

-- 3. Table: medical_records
CREATE TABLE IF NOT EXISTS medical_records (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    record_date VARCHAR(50) NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    treatment_plan TEXT,
    prescriptions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rec_patient (patient_id),
    INDEX idx_rec_doctor (doctor_id)
) ENGINE=InnoDB;

-- 4. Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    appointment_id VARCHAR(50),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'APPOINTMENT',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (user_id, is_read)
) ENGINE=InnoDB;

-- 5. Table: feedback
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    appointment_id VARCHAR(50) UNIQUE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_feedback_doctor (doctor_id),
    INDEX idx_feedback_patient (patient_id),
    INDEX idx_feedback_appointment (appointment_id)
) ENGINE=InnoDB;

-- 6. Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_event (event_type),
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB;
