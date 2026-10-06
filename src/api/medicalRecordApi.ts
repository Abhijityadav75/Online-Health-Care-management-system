import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { ApiResponse, BackendMedicalRecordDto, CreateMedicalRecordRequest } from './apiTypes';

/**
 * Clinical Medical Records API Service interacting with com.medicare.servlet.MedicalRecordServlet
 */
export const medicalRecordApi = {
  /**
   * Retrieves medical records based on authenticated role and clinical relationship.
   */
  getMedicalRecords: async (patientId?: string): Promise<ApiResponse<BackendMedicalRecordDto[]>> => {
    return apiClient.get<BackendMedicalRecordDto[]>(API_ENDPOINTS.MEDICAL_RECORDS.BASE, {
      params: patientId ? { patientId } : undefined,
    });
  },

  /**
   * Creates a new clinical record and prescription (Doctor or Admin privilege required).
   */
  createMedicalRecord: async (recordData: CreateMedicalRecordRequest): Promise<ApiResponse<BackendMedicalRecordDto>> => {
    return apiClient.post<BackendMedicalRecordDto>(API_ENDPOINTS.MEDICAL_RECORDS.BASE, recordData);
  },
};
