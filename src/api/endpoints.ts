/**
 * Centralized registry of all existing Java Jakarta Servlet endpoints.
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    SESSION: '/auth/session',
  },
  APPOINTMENTS: {
    BASE: '/appointments',
    PATIENT: '/appointments/patient',
    DOCTOR: '/appointments/doctor',
    ADMIN: '/appointments/admin',
    BY_ID: (id: string) => `/appointments/${id}`,
    RESCHEDULE: (id: string) => `/appointments/${id}/reschedule`,
    STATUS: (id: string) => `/appointments/${id}/status`,
  },
  USERS: {
    BASE: '/users',
    DOCTORS: '/users/doctors',
    PATIENTS: '/users/patients',
    BY_ID: (id: string) => `/users/${id}`,
    APPROVE_DOCTOR: (id: string) => `/users/doctors/${id}/approve`,
    REJECT_DOCTOR: (id: string) => `/users/doctors/${id}/reject`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
  MEDICAL_RECORDS: {
    BASE: '/medical-records',
  },
  FEEDBACK: {
    BASE: '/feedback',
  },
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
  },
} as const;
