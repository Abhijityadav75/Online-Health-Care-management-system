import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, BackendNotificationDto } from './apiTypes';

/**
 * Notification API Service interacting with com.medicare.servlet.NotificationServlet
 */
export const notificationApi = {
  /**
   * Retrieves notifications strictly filtered for the authenticated session user.
   */
  getNotifications: async (): Promise<ApiResponse<BackendNotificationDto[]>> => {
    return apiClient.get<BackendNotificationDto[]>(API_ENDPOINTS.NOTIFICATIONS.BASE);
  },

  /**
   * Marks a single notification as read (ownership verified on backend).
   */
  markAsRead: async (notificationId: string): Promise<ApiResponse<null>> => {
    return apiClient.put<null>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
  },

  /**
   * Marks all notifications for the authenticated user as read.
   */
  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    return apiClient.put<null>(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },
};
