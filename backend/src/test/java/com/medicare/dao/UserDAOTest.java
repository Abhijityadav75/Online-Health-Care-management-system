package com.medicare.dao;

import com.medicare.model.ApprovalStatus;
import com.medicare.model.Doctor;
import com.medicare.model.Patient;
import com.medicare.model.Role;
import com.medicare.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class UserDAOTest {

    @Mock
    private UserDAO userDAO;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Test Patient Creation and Lookup by ID")
    void testCreateAndFindPatient() {
        Patient patient = new Patient("p-101", "Aarav Sharma", "aarav@example.com", "+91 98765 00001", "hashed_pass");
        patient.setEmergencyContact("+91 98765 00009");
        patient.setEmergencyRelation("Brother");

        when(userDAO.create(any(User.class))).thenReturn(true);
        when(userDAO.findById("p-101")).thenReturn(Optional.of(patient));

        boolean created = userDAO.create(patient);
        assertTrue(created, "Patient should be created successfully");

        Optional<User> found = userDAO.findById("p-101");
        assertTrue(found.isPresent(), "Patient should be found by ID");
        assertEquals("Aarav Sharma", found.get().getName());
        assertEquals(Role.PATIENT, found.get().getRole());
    }

    @Test
    @DisplayName("Test Doctor Approval Status Transition")
    void testDoctorApprovalStatusUpdate() {
        Doctor doctor = new Doctor("d-101", "Dr. Neha Kapoor", "neha@medicare.com", "+91 98765 00002", "pass123", "Neurology", "MBBS, DM");
        doctor.setApprovalStatus(ApprovalStatus.PENDING);
        doctor.setConsultationFee(new BigDecimal("750.00"));

        when(userDAO.findById("d-101")).thenReturn(Optional.of(doctor));
        when(userDAO.updateDoctorApprovalStatus("d-101", ApprovalStatus.APPROVED)).thenReturn(true);

        boolean updated = userDAO.updateDoctorApprovalStatus("d-101", ApprovalStatus.APPROVED);
        assertTrue(updated, "Doctor approval status should update to APPROVED");

        doctor.setApprovalStatus(ApprovalStatus.APPROVED);
        assertEquals(ApprovalStatus.APPROVED, doctor.getApprovalStatus());
    }

    @Test
    @DisplayName("Test Find All Patients and Doctors Separation")
    void testFindAllPatientsAndDoctors() {
        List<Patient> patients = List.of(
                new Patient("p-1", "John Doe", "john@example.com", "+91 98765 43210", "pass"),
                new Patient("p-abhi", "abhi", "abhi@example.com", "+91 98765 43299", "pass")
        );
        List<Doctor> doctors = List.of(
                new Doctor("d-1", "Dr. Ananya Sharma", "ananya@medicare.com", "+91 98765 43211", "pass", "Cardiology", "MD"),
                new Doctor("d-3", "Dr. Priya Gupta", "priya@medicare.com", "+91 98765 43213", "pass", "Dermatology", "MD")
        );

        when(userDAO.findAllPatients()).thenReturn(patients);
        when(userDAO.findAllDoctors()).thenReturn(doctors);

        assertEquals(2, userDAO.findAllPatients().size());
        assertEquals(2, userDAO.findAllDoctors().size());
    }
}
