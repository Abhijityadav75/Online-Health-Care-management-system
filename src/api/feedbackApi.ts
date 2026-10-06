import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, BackendFeedbackDto, SubmitFeedbackRequest } from './apiTypes';

/**
 * Feedback and Reviews API Service interacting with com.medicare.servlet.FeedbackServlet
 */
export const feedbackApi = {
  /**
   * Retrieves feedback entries by doctorId or patientId.
   */
  getFeedback: async (params?: { doctorId?: string; patientId?: string }): Promise<ApiResponse<BackendFeedbackDto[]>> => {
    return apiClient.get<BackendFeedbackDto[]>(API_ENDPOINTS.FEEDBACK.BASE, { params });
  },

  /**
   * Submits consultation feedback (Patient only; requires COMPLETED consultation).
   */
  submitFeedback: async (feedbackData: SubmitFeedbackRequest): Promise<ApiResponse<BackendFeedbackDto>> => {
    return apiClient.post<BackendFeedbackDto>(API_ENDPOINTS.FEEDBACK.BASE, feedbackData);
  },
};
