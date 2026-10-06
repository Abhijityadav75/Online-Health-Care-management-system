import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, AnalyticsOverviewDto } from './apiTypes';

/**
 * System Analytics API Service interacting with com.medicare.servlet.AnalyticsServlet
 */
export const analyticsApi = {
  /**
   * Retrieves dynamic system metrics and department load percentages (Admin only).
   */
  getOverview: async (): Promise<ApiResponse<AnalyticsOverviewDto>> => {
    return apiClient.get<AnalyticsOverviewDto>(API_ENDPOINTS.ANALYTICS.OVERVIEW);
  },
};
