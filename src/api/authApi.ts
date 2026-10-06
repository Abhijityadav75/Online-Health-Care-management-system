import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, AuthSessionResponse, LoginRequest, RegisterRequest } from './apiTypes';

/**
 * Authentication API Service interacting with com.medicare.servlet.AuthServlet
 */
export const authApi = {
  /**
   * Authenticates user credentials and establishes server-side HttpSession.
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthSessionResponse>> => {
    return apiClient.post<AuthSessionResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  /**
   * Registers a new Patient or Doctor (pending admin approval).
   */
  register: async (payload: RegisterRequest): Promise<ApiResponse<{ user: AuthSessionResponse['user']; pendingApproval: boolean }>> => {
    return apiClient.post<{ user: AuthSessionResponse['user']; pendingApproval: boolean }>(API_ENDPOINTS.AUTH.REGISTER, payload);
  },

  /**
   * Invalidates active HttpSession and clears session cookie.
   */
  logout: async (): Promise<ApiResponse<null>> => {
    return apiClient.post<null>(API_ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * Rehydrates authenticated user profile from active session cookie.
   */
  getSession: async (): Promise<ApiResponse<AuthSessionResponse>> => {
    return apiClient.get<AuthSessionResponse>(API_ENDPOINTS.AUTH.SESSION);
  },
};
