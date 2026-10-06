import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import {
  ApiResponse,
  BackendAppointmentDto,
  BookAppointmentRequest,
  BookAdminAppointmentRequest,
  RescheduleAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from './apiTypes';

/**
 * Appointment Scheduling API Service interacting with com.medicare.servlet.AppointmentServlet
 */
export const appointmentApi = {
  /**
   * Retrieves appointments according to authenticated session role.
   */
  getAppointments: async (): Promise<ApiResponse<BackendAppointmentDto[]>> => {
    return apiClient.get<BackendAppointmentDto[]>(API_ENDPOINTS.APPOINTMENTS.BASE);
  },

  /**
   * Retrieves patient-specific appointments.
   */
  getPatientAppointments: async (): Promise<ApiResponse<BackendAppointmentDto[]>> => {
    return apiClient.get<BackendAppointmentDto[]>(API_ENDPOINTS.APPOINTMENTS.PATIENT);
  },

  /**
   * Retrieves doctor-specific appointments.
   */
  getDoctorAppointments: async (): Promise<ApiResponse<BackendAppointmentDto[]>> => {
    return apiClient.get<BackendAppointmentDto[]>(API_ENDPOINTS.APPOINTMENTS.DOCTOR);
  },

  /**
   * Retrieves all appointments across the system (Admin only).
   */
  getAdminAppointments: async (): Promise<ApiResponse<BackendAppointmentDto[]>> => {
    return apiClient.get<BackendAppointmentDto[]>(API_ENDPOINTS.APPOINTMENTS.ADMIN);
  },

  /**
   * Retrieves single appointment details by ID (with ownership authorization).
   */
  getAppointmentById: async (id: string): Promise<ApiResponse<BackendAppointmentDto>> => {
    return apiClient.get<BackendAppointmentDto>(API_ENDPOINTS.APPOINTMENTS.BY_ID(id));
  },

  /**
   * Schedules a new appointment via transactional slot booking.
   */
  bookAppointment: async (appointmentData: BookAppointmentRequest): Promise<ApiResponse<BackendAppointmentDto>> => {
    return apiClient.post<BackendAppointmentDto>(API_ENDPOINTS.APPOINTMENTS.BASE, appointmentData);
  },

  /**
   * Schedules a new appointment on behalf of a patient (Admin privilege required).
   */
  bookAdminAppointment: async (appointmentData: BookAdminAppointmentRequest): Promise<ApiResponse<BackendAppointmentDto>> => {
    return apiClient.post<BackendAppointmentDto>(API_ENDPOINTS.APPOINTMENTS.BASE, appointmentData);
  },

  /**
   * Reschedules an existing appointment (Patient or Admin only).
   */
  rescheduleAppointment: async (id: string, rescheduleData: RescheduleAppointmentRequest): Promise<ApiResponse<null>> => {
    return apiClient.put<null>(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), rescheduleData);
  },

  /**
   * Updates consultation status (Doctor or Admin only).
   */
  updateAppointmentStatus: async (id: string, statusData: UpdateAppointmentStatusRequest): Promise<ApiResponse<null>> => {
    return apiClient.put<null>(API_ENDPOINTS.APPOINTMENTS.STATUS(id), statusData);
  },

  /**
   * Cancels an appointment.
   */
  cancelAppointment: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(API_ENDPOINTS.APPOINTMENTS.BY_ID(id));
  },
};
