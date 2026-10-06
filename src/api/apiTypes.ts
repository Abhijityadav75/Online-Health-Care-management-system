/**
 * Typed API interfaces matching the exact Java Jakarta Servlet response schemas and DTOs.
 */

// Universal JSON envelope returned by com.medicare.util.ServletUtils
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Structured error representation
export class ApiError extends Error {
  status: number;
  code?: string;
  error?: string;
  data?: unknown;

  constructor(status: number, message: string, error?: string, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
    this.code = code;
    this.data = data;
  }
}

// -----------------------------------------------------------------------------
// Authentication DTOs (AuthServlet)
// -----------------------------------------------------------------------------

export interface LoginRequest {
  identifier?: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'PATIENT' | 'DOCTOR' | 'patient' | 'doctor';
  specialization?: string;
  qualification?: string;
  consultationFee?: number;
}

export interface AuthSessionResponse {
  user: SanitizedUserDto;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface SanitizedUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  dob?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  hospital?: string;
  consultationFee?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rating?: number;
  reviewsCount?: number;
}

// -----------------------------------------------------------------------------
// Appointment DTOs (AppointmentServlet)
// -----------------------------------------------------------------------------

export interface BackendAppointmentDto {
  id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorAvatarUrl?: string;
  appointmentDate: string;
  appointmentDateIso: string;
  appointmentTime: string;
  type?: string;
  reason: string;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
}

export interface BookAppointmentRequest {
  doctorId: string;
  appointmentDate: string;
  appointmentDateIso?: string;
  appointmentTime: string;
  type?: string;
  reason: string;
  patientId?: string; // Optional: only processed for ADMIN
}

export interface BookAdminAppointmentRequest {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentDateIso?: string;
  appointmentTime: string;
  type?: string;
  reason: string;
}

export interface RescheduleAppointmentRequest {
  date: string;
  dateIso?: string;
  time: string;
}

export interface UpdateAppointmentStatusRequest {
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
}

// -----------------------------------------------------------------------------
// Notification DTOs (NotificationServlet)
// -----------------------------------------------------------------------------

export interface BackendNotificationDto {
  id: string;
  userId: string;
  appointmentId?: string;
  title: string;
  message: string;
  notificationType: 'APPOINTMENT' | 'MEDICAL' | 'SYSTEM' | string;
  isRead: boolean;
  createdAt?: string;
}

// -----------------------------------------------------------------------------
// Medical Record DTOs (MedicalRecordServlet)
// -----------------------------------------------------------------------------

export interface BackendMedicalRecordDto {
  id: string;
  patientId: string;
  doctorId: string;
  recordDate: string;
  recordType: string;
  diagnosis: string;
  treatmentPlan?: string;
  prescriptions?: string;
  createdAt?: string;
}

export interface CreateMedicalRecordRequest {
  patientId: string;
  recordDate?: string;
  recordType?: string;
  diagnosis: string;
  treatmentPlan?: string;
  prescriptions?: string;
}

// -----------------------------------------------------------------------------
// Feedback DTOs (FeedbackServlet)
// -----------------------------------------------------------------------------

export interface BackendFeedbackDto {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  appointmentId?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface SubmitFeedbackRequest {
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment?: string;
}

// -----------------------------------------------------------------------------
// Analytics DTOs (AnalyticsServlet)
// -----------------------------------------------------------------------------

export interface DepartmentStatDto {
  department: string;
  doctorCount: number;
  consultations: number;
  loadPercentage: string;
}

export interface AnalyticsOverviewDto {
  totalAppointments: number;
  completedConsultations: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  standardConsultationDuration: string;
  totalUsers: number;
  patientCount: number;
  doctorCount: number;
  adminCount: number;
  departments: DepartmentStatDto[];
}
