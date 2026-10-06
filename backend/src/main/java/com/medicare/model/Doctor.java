package com.medicare.model;

import java.math.BigDecimal;

/**
 * Domain model representing a Medical Practitioner / Doctor.
 */
public class Doctor extends User {
    private static final long serialVersionUID = 1L;

    private String specialization;
    private String qualification;
    private int experience;
    private String hospital;
    private BigDecimal consultationFee;
    private ApprovalStatus approvalStatus;
    private double rating;
    private int reviewsCount;

    public Doctor() {
        super();
        this.role = Role.DOCTOR;
        this.approvalStatus = ApprovalStatus.PENDING;
        this.consultationFee = BigDecimal.ZERO;
        this.rating = 5.0;
        this.reviewsCount = 0;
    }

    public Doctor(String id, String name, String email, String phone, String passwordHash, String specialization, String qualification) {
        super(id, name, email, phone, passwordHash, Role.DOCTOR);
        this.specialization = specialization;
        this.qualification = qualification;
        this.approvalStatus = ApprovalStatus.PENDING;
        this.consultationFee = BigDecimal.ZERO;
        this.rating = 5.0;
        this.reviewsCount = 0;
    }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public int getExperience() { return experience; }
    public void setExperience(int experience) { this.experience = experience; }

    public String getHospital() { return hospital; }
    public void setHospital(String hospital) { this.hospital = hospital; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public ApprovalStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getReviewsCount() { return reviewsCount; }
    public void setReviewsCount(int reviewsCount) { this.reviewsCount = reviewsCount; }
}
