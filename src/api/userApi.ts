import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, SanitizedUserDto } from './apiTypes';

/**
 * User Management API Service interacting with com.medicare.servlet.UserServlet
 */
export const userApi = {
  /**
   * Retrieves all users (Admin privilege required).
   */
  getAllUsers: async (): Promise<ApiResponse<SanitizedUserDto[]>> => {
    return apiClient.get<SanitizedUserDto[]>(API_ENDPOINTS.USERS.BASE);
  },

  /**
   * Retrieves list of registered medical practitioners.
   */
  getDoctors: async (): Promise<ApiResponse<SanitizedUserDto[]>> => {
    return apiClient.get<SanitizedUserDto[]>(API_ENDPOINTS.USERS.DOCTORS);
  },

  /**
   * Retrieves list of registered patients (Doctor/Admin privilege required).
   */
  getPatients: async (): Promise<ApiResponse<SanitizedUserDto[]>> => {
    return apiClient.get<SanitizedUserDto[]>(API_ENDPOINTS.USERS.PATIENTS);
  },

  /**
   * Retrieves specific user details by ID (Self or Admin only).
   */
  getUserById: async (userId: string): Promise<ApiResponse<SanitizedUserDto>> => {
    return apiClient.get<SanitizedUserDto>(API_ENDPOINTS.USERS.BY_ID(userId));
  },

  /**
   * Updates user profile fields with server-side field whitelisting.
   */
  updateUserProfile: async (userId: string, profileData: Partial<SanitizedUserDto>): Promise<ApiResponse<SanitizedUserDto>> => {
    return apiClient.put<SanitizedUserDto>(API_ENDPOINTS.USERS.BY_ID(userId), profileData);
  },

  /**
   * Approves doctor registration (Admin privilege required).
   */
  approveDoctor: async (doctorId: string): Promise<ApiResponse<null>> => {
    return apiClient.put<null>(API_ENDPOINTS.USERS.APPROVE_DOCTOR(doctorId));
  },

  /**
   * Rejects doctor registration (Admin privilege required).
   */
  rejectDoctor: async (doctorId: string): Promise<ApiResponse<null>> => {
    return apiClient.put<null>(API_ENDPOINTS.USERS.REJECT_DOCTOR(doctorId));
  },

  /**
   * Deletes a user account (Admin privilege required).
   */
  deleteUser: async (userId: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(API_ENDPOINTS.USERS.BY_ID(userId));
  },
};
