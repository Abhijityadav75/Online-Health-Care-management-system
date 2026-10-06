export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  hasLoggedIn?: boolean;
  isFirstLoginSession?: boolean;
  role: UserRole;
  avatar?: string;
  profile_photo?: string;
  dob?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  
  // Patient specific health profile
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  height?: string;
  weight?: string;

  // Doctor specific
  specialization?: string;
  qualification?: string;
  experience?: number;
  hospital?: string;
  consultationFee?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rating?: number;
  reviewsCount?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar?: string;
  date: string;
  time: string;
  type: 'In-clinic' | 'General Consultation' | 'Follow-up' | 'Consultation';
  reason: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Pending';
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'Consultation' | 'Prescription' | 'Lab Report' | 'Clinical Note' | 'Discharge Summary' | 'General Health';
  doctorName: string;
  description: string;
  fileUrl?: string;
  details?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  appointmentId?: string;
  title: string;
  message: string;
  type: 'appointment' | 'medical' | 'system';
  timestamp: string;
  read: boolean;
}

export interface FeedbackItem {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DaySchedule {
  day: string;
  available: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  fullDay: boolean;
}
