-- =====================================================================
-- MediCare Canonical Seed Data (Hardened with PBKDF2 Password Hashes)
-- Mirrors exact application state and preserves MC-20261001-98721
-- =====================================================================

USE medicare_db;

-- 1. Seed Users (Patients, Doctors, Admins)
INSERT INTO users (
    id, name, email, phone, password_hash, role, status, avatar_url, dob, gender, address,
    emergency_contact, emergency_relation, specialization, qualification, experience, hospital,
    consultation_fee, approval_status, rating, reviews_count
) VALUES
-- Patients
('p-1', 'John Doe', 'john.doe@example.com', '+91 98765 43210', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'PATIENT', 'ACTIVE', 
 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200', '15 May 1990', 'Male', '124 Healthcare Avenue, New Delhi, India', 
 '+91 98765 43219', 'Spouse', NULL, NULL, 0, NULL, 0.00, NULL, 5.00, 1),

('p-abhi', 'abhi', 'abhi@example.com', '+91 98765 43299', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'PATIENT', 'ACTIVE',
 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200', '12 Aug 1996', 'Male', 'Sector 14, Gurugram, India',
 '+91 98765 43290', 'Parent', NULL, NULL, 0, NULL, 0.00, NULL, 5.00, 1),

-- Doctors
('d-1', 'Dr. Ananya Sharma', 'ananya.sharma@medicare.com', '+91 98765 43211', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'DOCTOR', 'ACTIVE',
 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200', '24 Mar 1982', 'Female', 'Apollo Hospitals, New Delhi',
 NULL, NULL, 'Cardiologist', 'MBBS, MD (Cardiology)', 14, 'Apollo Hospitals', 800.00, 'APPROVED', 4.90, 128),

('d-2', 'Dr. Rohan Mehta', 'rohan.mehta@medicare.com', '+91 98765 43212', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'DOCTOR', 'ACTIVE',
 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', '19 Sep 1985', 'Male', 'Max Super Speciality Hospital, Saket',
 NULL, NULL, 'General Physician', 'MBBS, DNB (Internal Medicine)', 10, 'Max Super Speciality', 500.00, 'APPROVED', 4.80, 95),

('d-3', 'Dr. Priya Gupta', 'priya.gupta@medicare.com', '+91 98765 43213', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'DOCTOR', 'ACTIVE',
 'https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200', '08 Jul 1988', 'Female', 'Fortis Escorts Hospital, New Delhi',
 NULL, NULL, 'Dermatologist', 'MBBS, MD (Dermatology)', 8, 'Fortis Escorts Hospital', 600.00, 'APPROVED', 4.95, 110),

('d-4', 'Dr. Amit Patel', 'amit.patel@medicare.com', '+91 98765 43214', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'DOCTOR', 'ACTIVE',
 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', '14 Feb 1980', 'Male', 'Manipal Hospitals, Dwarka',
 NULL, NULL, 'General Physician', 'MBBS, MD', 15, 'Manipal Hospitals', 550.00, 'APPROVED', 4.75, 84),

('d-5', 'Dr. Vikram Malhotra', 'vikram.malhotra@medicare.com', '+91 98765 43215', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'DOCTOR', 'ACTIVE',
 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', '30 Nov 1978', 'Male', 'AIIMS Medical Center, New Delhi',
 NULL, NULL, 'Orthopedics', 'MBBS, MS (Orthopedics)', 18, 'AIIMS New Delhi', 900.00, 'APPROVED', 4.90, 142),

('d-6', 'Dr. Rajesh Khanna', 'rajesh.khanna@medicare.com', '+91 98765 43216', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'DOCTOR', 'ACTIVE',
 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200', '11 Jan 1983', 'Male', 'Medanta The Medicity, Gurugram',
 NULL, NULL, 'Orthopedics', 'MBBS, MS (Orthopedics)', 12, 'Medanta The Medicity', 850.00, 'APPROVED', 4.85, 67),

-- Administrator
('a-1', 'Admin User', 'admin@medicare.local', '+91 90000 00000', 'dGVzdFNhbHQxMjM0NTY3OA==:1dwNwvnZLf7+9Rb6gFnWJB+I7VOZ9xlPKAdRs6jpNjI=', 'ADMIN', 'ACTIVE',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', '01 Jan 1980', 'Other', 'MediCare HQ, New Delhi',
 NULL, NULL, NULL, NULL, 0, NULL, 0.00, NULL, 5.00, 0);

-- =====================================================================
-- 2. Seed Appointments (PRESERVING CANONICAL MC-20261001-98721)
-- =====================================================================
INSERT INTO appointments (
    id, patient_id, doctor_id, appointment_date, appointment_date_iso, appointment_time, type, reason, status
) VALUES
('MC-20261001-98721', 'p-abhi', 'd-3', '01 Oct 2026', '2026-10-01', '10:30 AM', 'Consultation', 'Routine health checkup and consultation', 'UPCOMING'),
('apt-1', 'p-1', 'd-1', '05 Oct 2026', '2026-10-05', '10:30 AM', 'In-clinic', 'Routine cardiac checkup & blood pressure review', 'UPCOMING'),
('apt-2', 'p-1', 'd-2', '12 Oct 2026', '2026-10-12', '10:00 AM', 'In-clinic', 'Fever and seasonal flu consultation', 'UPCOMING'),
('apt-3', 'p-1', 'd-3', '02 Sep 2026', '2026-09-02', '02:00 PM', 'In-clinic', 'Skin allergy and rash checkup', 'COMPLETED'),
('apt-4', 'p-1', 'd-4', '18 Oct 2026', '2026-10-18', '11:00 AM', 'In-clinic', 'General health wellness follow-up', 'UPCOMING'),
('apt-5', 'p-1', 'd-2', '24 Oct 2026', '2026-10-24', '04:00 PM', 'In-clinic', 'Diabetes routine screening', 'UPCOMING');

-- =====================================================================
-- 3. Seed Medical Records
-- =====================================================================
INSERT INTO medical_records (
    id, patient_id, doctor_id, record_date, record_type, diagnosis, treatment_plan, prescriptions
) VALUES
('rec-1', 'p-1', 'd-1', '15 Sep 2026', 'Prescription', 'Mild Essential Hypertension', 'Low sodium diet, daily 30-min walk, follow up in 3 months', 'Amlodipine 5mg OD, Telmisartan 40mg OD'),
('rec-2', 'p-1', 'd-3', '02 Sep 2026', 'Lab Report', 'Contact Dermatitis (Resolved)', 'Topical barrier repair cream, avoid allergen contact', 'Hydrocortisone 1% Cream BD, Cetirizine 10mg HS');

-- =====================================================================
-- 4. Seed Notifications
-- =====================================================================
INSERT INTO notifications (
    id, user_id, appointment_id, title, message, notification_type, is_read
) VALUES
('notif-d3-1', 'd-3', 'MC-20261001-98721', 'New Appointment Booked', 'abhi booked a consultation for 01 Oct 2026 at 10:30 AM.', 'APPOINTMENT', FALSE),
('notif-1', 'p-1', 'apt-1', 'Appointment Confirmed', 'Your appointment with Dr. Ananya Sharma has been confirmed for 05 Oct 2026 at 10:30 AM.', 'APPOINTMENT', FALSE),
('notif-2', 'p-1', 'apt-2', 'Appointment Notice', 'Notice: You have an upcoming consultation with Dr. Rohan Mehta scheduled on your portal.', 'APPOINTMENT', FALSE),
('notif-3', 'p-1', NULL, 'New Medical Record', 'Dr. Ananya Sharma has added a new consultation record to your profile.', 'MEDICAL', TRUE);

-- =====================================================================
-- 5. Seed Feedback (Linked with appointment_id = 'apt-3')
-- =====================================================================
INSERT INTO feedback (
    id, patient_id, doctor_id, appointment_id, rating, comment, created_at
) VALUES
('fb-1', 'p-1', 'd-1', 'apt-3', 5, 'Dr. Ananya Sharma is very polite, professional, and thorough with explanations.', '2026-09-02 14:30:00');
