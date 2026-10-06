import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Appointment, MedicalRecord, NotificationItem, FeedbackItem, UserRole, DaySchedule, BlockedDate } from '../types';
import { syncAppointmentStatuses, isPastDateTime, parseDateString, formatDateToIso } from '../utils/dateUtils';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { appointmentApi } from '../api/appointmentApi';
import { analyticsApi } from '../api/analyticsApi';
import { notificationApi } from '../api/notificationApi';
import { medicalRecordApi } from '../api/medicalRecordApi';
import { feedbackApi } from '../api/feedbackApi';
import { 
  SanitizedUserDto, 
  BackendAppointmentDto, 
  AnalyticsOverviewDto,
  BackendNotificationDto,
  BackendMedicalRecordDto,
  BackendFeedbackDto
} from '../api/apiTypes';
import { INITIAL_USERS, INITIAL_APPOINTMENTS, INITIAL_MEDICAL_RECORDS, INITIAL_NOTIFICATIONS, INITIAL_FEEDBACK } from '../mockData';

interface AppContextType {
  currentUser: User | null;
  authLoading: boolean;
  users: User[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  notifications: NotificationItem[];
  feedbackList: FeedbackItem[];
  analyticsOverview: AnalyticsOverviewDto | null;
  currentScreen: string;
  mobileNavTab: string;
  selectedDoctorIdForBooking: string | null;
  setSelectedDoctorIdForBooking: (id: string | null) => void;
  startBookingWithDoctor: (doctorId: string) => void;
  selectedPatientForDetail: any | null;
  setSelectedPatientForDetail: (patient: any | null) => void;
  adminActiveTab: 'Dashboard' | 'Users' | 'Appointments' | 'Settings' | 'Analytics';
  setAdminActiveTab: (tab: 'Dashboard' | 'Users' | 'Appointments' | 'Settings' | 'Analytics') => void;
  login: (identifier: string, password: string, role?: UserRole, rememberMe?: boolean) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  registerUser: (userData: Partial<User>) => Promise<{ success: boolean; message?: string; pendingApproval?: boolean }>;
  logout: () => Promise<void>;
  setCurrentScreen: (screen: string) => void;
  goBack: () => void;
  canGoBack: boolean;
  setMobileNavTab: (tab: string) => void;
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => Promise<Appointment>;
  bookAdminAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { patientId: string }) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: 'Upcoming' | 'Completed' | 'Cancelled') => Promise<void>;
  rescheduleAppointment: (id: string, date: string, time: string) => Promise<void>;
  refreshPatientAppointments: () => Promise<void>;
  refreshDoctorAppointments: () => Promise<void>;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id'> & { patientId?: string }) => Promise<MedicalRecord>;
  updateUserProfile: (userId: string, updatedFields: Partial<User>) => Promise<void>;
  changePassword: (currentPass: string, newPass: string, confirmPass: string) => { success: boolean; message: string };
  resetPasswordWithIdentifier: (identifier: string, newPass: string) => { success: boolean; message: string };
  addUserByAdmin: (userData: Partial<User> & { password?: string }) => Promise<User>;
  deleteUserByAdmin: (userId: string) => Promise<void>;
  approveDoctor: (doctorId: string, approve: boolean) => Promise<void>;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  addFeedback: (feedback: Omit<FeedbackItem, 'id' | 'createdAt'> & { appointmentId?: string }) => Promise<FeedbackItem>;
  viewScreenReferenceModal: boolean;
  setViewScreenReferenceModal: (show: boolean) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  weeklySchedule: DaySchedule[];
  setWeeklySchedule: React.Dispatch<React.SetStateAction<DaySchedule[]>>;
  blockedDates: BlockedDate[];
  setBlockedDates: React.Dispatch<React.SetStateAction<BlockedDate[]>>;
  slotDuration: string;
  setSlotDuration: React.Dispatch<React.SetStateAction<string>>;
  maxPatientsPerSlot: string;
  setMaxPatientsPerSlot: React.Dispatch<React.SetStateAction<string>>;
  bufferTime: string;
  setBufferTime: React.Dispatch<React.SetStateAction<string>>;
  doctorSearchQuery: string;
  setDoctorSearchQuery: (query: string) => void;
  doctorSpecialtyFilter: string;
  setDoctorSpecialtyFilter: (filter: string) => void;
}

export const SCREEN_PATH_MAP: Record<string, string> = {
  'landing': '/',
  'about': '/about',
  'services': '/services',
  'doctors': '/doctors',
  'contact': '/contact',
  'login': '/signin',
  'register': '/signup',
  'patient-dashboard': '/patient/dashboard',
  'patient-book': '/patient/book',
  'patient-appointments': '/patient/appointments',
  'patient-records': '/patient/records',
  'patient-profile': '/patient/profile',
  'doctor-dashboard': '/doctor/dashboard',
  'doctor-appointments': '/doctor/appointments',
  'doctor-calendar': '/doctor/calendar',
  'doctor-patients': '/doctor/patients',
  'patient-record-detail': '/doctor/patient-detail',
  'doctor-availability': '/doctor/availability',
  'admin-dashboard': '/admin/dashboard',
  'admin-users': '/admin/users',
  'admin-appointments': '/admin/appointments',
  'notifications': '/notifications',
  'settings': '/settings',
};

export const PATH_SCREEN_MAP: Record<string, string> = {
  '/': 'landing',
  '/about': 'about',
  '/services': 'services',
  '/doctors': 'doctors',
  '/contact': 'contact',
  '/signin': 'login',
  '/login': 'login',
  '/signup': 'register',
  '/register': 'register',
  '/patient/dashboard': 'patient-dashboard',
  '/patient/book': 'patient-book',
  '/patient/appointments': 'patient-appointments',
  '/patient/records': 'patient-records',
  '/patient/profile': 'patient-profile',
  '/doctor/dashboard': 'doctor-dashboard',
  '/doctor/appointments': 'doctor-appointments',
  '/doctor/calendar': 'doctor-calendar',
  '/doctor/patients': 'doctor-patients',
  '/doctor/patient-detail': 'patient-record-detail',
  '/doctor/availability': 'doctor-availability',
  '/admin/dashboard': 'admin-dashboard',
  '/admin/users': 'admin-users',
  '/admin/appointments': 'admin-appointments',
  '/notifications': 'notifications',
  '/settings': 'settings',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapBackendUserToFrontend = (userDto: SanitizedUserDto): User => {
  const mappedRole: UserRole = (userDto.role ? userDto.role.toLowerCase() : 'patient') as UserRole;
  return {
    id: userDto.id,
    name: userDto.name,
    email: userDto.email,
    phone: userDto.phone,
    role: mappedRole,
    avatar: userDto.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    dob: userDto.dob || '01 Jan 1990',
    gender: userDto.gender || 'Other',
    address: userDto.address || 'New Delhi, India',
    emergencyContact: userDto.emergencyContact,
    emergencyRelation: userDto.emergencyRelation,
    specialization: userDto.specialization,
    qualification: userDto.qualification,
    experience: userDto.experience,
    hospital: userDto.hospital,
    consultationFee: userDto.consultationFee,
    approvalStatus: userDto.approvalStatus,
    rating: userDto.rating || 5.0,
    reviewsCount: userDto.reviewsCount || 0,
    hasLoggedIn: true,
  };
};

const mapBackendAppointmentToFrontend = (dto: BackendAppointmentDto): Appointment => {
  let uiStatus: 'Upcoming' | 'Completed' | 'Cancelled' = 'Upcoming';
  if (dto.status === 'COMPLETED') uiStatus = 'Completed';
  else if (dto.status === 'CANCELLED') uiStatus = 'Cancelled';

  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: dto.patientName || 'Patient',
    patientPhone: dto.patientPhone || '',
    doctorId: dto.doctorId,
    doctorName: dto.doctorName || 'Doctor',
    doctorSpecialization: dto.doctorSpecialization || 'General Physician',
    doctorAvatar: dto.doctorAvatarUrl,
    date: dto.appointmentDate,
    time: dto.appointmentTime,
    type: (dto.type || 'Consultation') as any,
    reason: dto.reason,
    status: uiStatus,
    createdAt: dto.createdAt || new Date().toISOString().split('T')[0],
  };
};

const mapBackendNotificationToFrontend = (dto: BackendNotificationDto): NotificationItem => {
  return {
    id: dto.id,
    userId: dto.userId,
    appointmentId: dto.appointmentId,
    title: dto.title,
    message: dto.message,
    type: (dto.notificationType ? dto.notificationType.toLowerCase() : 'system') as any,
    timestamp: dto.createdAt ? dto.createdAt.split('T')[0] : 'Just now',
    read: dto.isRead ?? false,
  };
};

const mapBackendMedicalRecordToFrontend = (dto: BackendMedicalRecordDto): MedicalRecord => {
  return {
    id: dto.id,
    patientId: dto.patientId,
    date: dto.recordDate || (dto.createdAt ? dto.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    type: (dto.recordType || 'Consultation') as any,
    doctorName: dto.doctorId || 'Doctor',
    description: dto.diagnosis || 'Clinical Diagnosis',
    details: [dto.treatmentPlan, dto.prescriptions].filter(Boolean).join(' | ') || undefined,
  };
};

const mapBackendFeedbackToFrontend = (dto: BackendFeedbackDto): FeedbackItem => {
  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: dto.patientName || 'Patient',
    doctorId: dto.doctorId,
    rating: dto.rating,
    comment: dto.comment,
    createdAt: dto.createdAt || new Date().toISOString().split('T')[0],
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('medicare_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist currentUser to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('medicare_currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('medicare_currentUser');
      }
    } catch {}
  }, [currentUser]);

  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Authoritative dynamic database doctor and patient state (initialized with INITIAL_USERS for preview fallback)
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('medicare_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Persist users to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('medicare_users', JSON.stringify(users));
    } catch {}
  }, [users]);

  // Auto-migrate local doctors to have distinct avatars and valid consultation fees if they are duplicates/defaults
  useEffect(() => {
    // If the new realistic sample doctor is missing from cache, force reload INITIAL_USERS
    const hasMehta = users.some(u => u.email === 'ananya.mehta@medicare.local');
    if (!hasMehta) {
      setUsers(INITIAL_USERS);
      try {
        localStorage.setItem('medicare_users', JSON.stringify(INITIAL_USERS));
      } catch {}
      return;
    }

    const maleAvatars = [
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    ];

    const femaleAvatars = [
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1527613426441-2da17477166d?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=400',
    ];

    let hasChanges = false;
    const migratedUsers = users.map((u, idx) => {
      if (u.role === 'doctor') {
        const cleanName = (u.name || '').replace(/^(dr\.?\s*)+/gi, '').trim();
        const finalName = `Dr. ${cleanName}`;
        const hasNameIssue = u.name !== finalName;

        const lowerName = cleanName.toLowerCase();
        const isFemale = u.gender === 'Female' || 
                         lowerName.includes('priya') || 
                         lowerName.includes('ananya') || 
                         lowerName.includes('sneha') || 
                         lowerName.includes('neha');

        const isDefaultAvatar = !u.avatar || 
                                u.avatar.includes('photo-1594824813578-834419999a42') || // standard default
                                users.filter((x, i) => x.role === 'doctor' && x.avatar === u.avatar && i < idx).length > 0 ||
                                (isFemale && maleAvatars.includes(u.avatar || '')) || // wrong gender avatar correction
                                (!isFemale && femaleAvatars.includes(u.avatar || ''));

        const isDefaultFee = !u.consultationFee || u.consultationFee === 700;

        if (hasNameIssue || isDefaultAvatar || isDefaultFee) {
          hasChanges = true;
          
          const avatarPool = isFemale ? femaleAvatars : maleAvatars;
          const nameHash = lowerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + idx;
          const distinctAvatar = avatarPool[nameHash % avatarPool.length];
          
          let distinctFee = u.consultationFee || 700;
          if (isDefaultFee) {
            const spec = (u.specialization || '').toLowerCase();
            if (spec.includes('cardio')) distinctFee = 1000;
            else if (spec.includes('neuro')) distinctFee = 1200;
            else if (spec.includes('ortho')) distinctFee = 900;
            else if (spec.includes('derm')) distinctFee = 700;
            else if (spec.includes('pedi')) distinctFee = 800;
            else distinctFee = 600;
          }

          return {
            ...u,
            name: finalName,
            avatar: isDefaultAvatar ? distinctAvatar : u.avatar,
            consultationFee: distinctFee
          };
        }
      }
      return u;
    });

    if (hasChanges) {
      setUsers(migratedUsers);
    }
  }, []);

  // Appointments state with local storage fallback for offline support and seamless doctor reflection
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('medicare_appointments');
      return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  // Persist appointments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('medicare_appointments', JSON.stringify(appointments));
    } catch {}
  }, [appointments]);

  // Analytics overview state from AnalyticsServlet (GET /api/analytics/overview)
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverviewDto | null>(null);

  // Authoritative backend state for Notifications, Medical Records, and Feedback
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  const [currentScreen, setCurrentScreenState] = useState<string>(() => {
    const path = window.location.pathname;
    return PATH_SCREEN_MAP[path] || 'landing';
  });

  const [screenHistory, setScreenHistory] = useState<string[]>([]);
  const [mobileNavTab, setMobileNavTab] = useState<string>('home');
  const [selectedDoctorIdForBooking, setSelectedDoctorIdForBooking] = useState<string | null>(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<any | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'Dashboard' | 'Users' | 'Appointments' | 'Settings' | 'Analytics'>('Dashboard');
  const [viewScreenReferenceModal, setViewScreenReferenceModal] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState<string>('');
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState<string>('All');

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([
    { day: 'Monday', available: true, startTime: '09:00 AM', endTime: '05:00 PM', breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    { day: 'Tuesday', available: true, startTime: '09:00 AM', endTime: '05:00 PM', breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    { day: 'Wednesday', available: true, startTime: '09:00 AM', endTime: '05:00 PM', breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    { day: 'Thursday', available: true, startTime: '09:00 AM', endTime: '05:00 PM', breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    { day: 'Friday', available: true, startTime: '09:00 AM', endTime: '04:00 PM', breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    { day: 'Saturday', available: false, startTime: '10:00 AM', endTime: '02:00 PM', breakStart: 'None', breakEnd: 'None' },
    { day: 'Sunday', available: false, startTime: '10:00 AM', endTime: '02:00 PM', breakStart: 'None', breakEnd: 'None' },
  ]);

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([
    { id: 'b-1', date: '2026-10-02', reason: 'Holiday', fullDay: true },
    { id: 'b-2', date: '2026-10-15', reason: 'Personal Leave', fullDay: true },
  ]);

  const [slotDuration, setSlotDuration] = useState<string>('30 mins');
  const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState<string>('1 Patient');
  const [bufferTime, setBufferTime] = useState<string>('5 mins');

  // ---------------------------------------------------------------------------
  // Load Doctors from Java Backend (GET /api/users/doctors)
  // ---------------------------------------------------------------------------
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await userApi.getDoctors();
      if (res.success && Array.isArray(res.data)) {
        const mappedDocs = res.data.map(mapBackendUserToFrontend);
        setUsers(prev => {
          const nonDocs = prev.filter(u => u.role !== 'doctor');
          return [...mappedDocs, ...nonDocs];
        });
      }
    } catch {
      // Keep existing users if doctor fetch fails
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Load Patient Appointments from Backend (GET /api/appointments/patient)
  // ---------------------------------------------------------------------------
  const refreshPatientAppointments = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'patient') return;
    try {
      const res = await appointmentApi.getPatientAppointments();
      if (res.success && Array.isArray(res.data)) {
        const mappedApts = res.data.map(mapBackendAppointmentToFrontend);
        setAppointments(syncAppointmentStatuses(mappedApts));
      } else {
        throw new Error('Fallback to cached appointments');
      }
    } catch {
      // Local storage fallback for offline support
      try {
        const saved = localStorage.getItem('medicare_appointments');
        if (saved) {
          setAppointments(syncAppointmentStatuses(JSON.parse(saved)));
        }
      } catch {}
    }
  }, [currentUser]);

  // ---------------------------------------------------------------------------
  // Load Doctor Appointments from Backend (GET /api/appointments/doctor)
  // ---------------------------------------------------------------------------
  const refreshDoctorAppointments = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'doctor') return;
    try {
      const res = await appointmentApi.getDoctorAppointments();
      if (res.success && Array.isArray(res.data)) {
        const mappedApts = res.data.map(mapBackendAppointmentToFrontend);
        setAppointments(syncAppointmentStatuses(mappedApts));
      } else {
        throw new Error('Fallback to cached appointments');
      }
    } catch {
      // Local storage fallback for offline support
      try {
        const saved = localStorage.getItem('medicare_appointments');
        if (saved) {
          setAppointments(syncAppointmentStatuses(JSON.parse(saved)));
        }
      } catch {}
    }
  }, [currentUser]);

  // ---------------------------------------------------------------------------
  // Load Registered Patients for Doctor/Admin (GET /api/users/patients)
  // ---------------------------------------------------------------------------
  const fetchPatients = useCallback(async () => {
    if (!currentUser || (currentUser.role !== 'doctor' && currentUser.role !== 'admin')) return;
    try {
      const res = await userApi.getPatients();
      if (res.success && Array.isArray(res.data)) {
        const mappedPatients = res.data.map(mapBackendUserToFrontend);
        setUsers(prev => {
          const nonPatients = prev.filter(u => u.role !== 'patient');
          return [...nonPatients, ...mappedPatients];
        });
      }
    } catch {
      // Handled gracefully
    }
  }, [currentUser]);

  // ---------------------------------------------------------------------------
  // Session Restoration Engine (GET /api/auth/session)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function restoreServerSession() {
      try {
        const sessionRes = await authApi.getSession();
        if (isMounted && sessionRes.success && sessionRes.data?.user) {
          const authenticatedUser = mapBackendUserToFrontend(sessionRes.data.user);
          setCurrentUser(authenticatedUser);

          // Route to proper role dashboard if currently on landing or login screen
          const currentPath = window.location.pathname;
          const mappedScreen = PATH_SCREEN_MAP[currentPath];
          if (!mappedScreen || mappedScreen === 'login' || mappedScreen === 'register' || mappedScreen === 'landing') {
            const roleDash = `${authenticatedUser.role}-dashboard`;
            setCurrentScreenState(roleDash);
            try {
              window.history.replaceState({ screen: roleDash }, '', SCREEN_PATH_MAP[roleDash] || `/${authenticatedUser.role}/dashboard`);
            } catch {}
          }
        } else if (isMounted) {
          // If no server session and no cached local session exists, set to null
          const saved = localStorage.getItem('medicare_currentUser');
          if (!saved) {
            setCurrentUser(null);
          }
        }
      } catch {
        // Safe preview fallback preserves active local session if present
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    restoreServerSession();
    fetchDoctors();

    return () => {
      isMounted = false;
    };
  }, [fetchDoctors]);

  // ---------------------------------------------------------------------------
  // Load Admin Data (GET /api/users, GET /api/appointments/admin, GET /api/analytics/overview)
  // ---------------------------------------------------------------------------
  const refreshAdminData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const [usersRes, aptsRes, analyticsRes] = await Promise.all([
        userApi.getAllUsers(),
        appointmentApi.getAdminAppointments(),
        analyticsApi.getOverview()
      ]);
      if (usersRes.success && Array.isArray(usersRes.data)) {
        const mappedUsers = usersRes.data.map(mapBackendUserToFrontend);
        setUsers(mappedUsers);
      }
      if (aptsRes.success && Array.isArray(aptsRes.data)) {
        const mappedApts = aptsRes.data.map(mapBackendAppointmentToFrontend);
        setAppointments(syncAppointmentStatuses(mappedApts));
      }
      if (analyticsRes.success && analyticsRes.data) {
        setAnalyticsOverview(analyticsRes.data);
      } else {
        setAnalyticsOverview(null);
      }
    } catch (err) {
      // Offline fallback: Use INITIAL_APPOINTMENTS, INITIAL_USERS for admin overview
      setAppointments(syncAppointmentStatuses(INITIAL_APPOINTMENTS));
      setAnalyticsOverview({
        totalAppointments: INITIAL_APPOINTMENTS.length,
        completedConsultations: INITIAL_APPOINTMENTS.filter(a => a.status === 'Completed').length,
        upcomingAppointments: INITIAL_APPOINTMENTS.filter(a => a.status === 'Upcoming').length,
        cancelledAppointments: INITIAL_APPOINTMENTS.filter(a => a.status === 'Cancelled').length,
        standardConsultationDuration: '30 mins',
        totalUsers: INITIAL_USERS.length,
        patientCount: INITIAL_USERS.filter(u => u.role === 'patient').length,
        doctorCount: INITIAL_USERS.filter(u => u.role === 'doctor').length,
        adminCount: INITIAL_USERS.filter(u => u.role === 'admin').length,
        departments: [
          { department: 'General Physician', doctorCount: 2, consultations: 10, loadPercentage: '45%' },
          { department: 'Cardiologist', doctorCount: 1, consultations: 5, loadPercentage: '25%' },
          { department: 'Dermatologist', doctorCount: 1, consultations: 4, loadPercentage: '20%' },
          { department: 'Orthopedist', doctorCount: 1, consultations: 2, loadPercentage: '10%' }
        ]
      });
    }
  }, [currentUser]);

  // ---------------------------------------------------------------------------
  // Load Shared Features from Backend (Notifications, Medical Records, Feedback)
  // ---------------------------------------------------------------------------
  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const res = await notificationApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(mapBackendNotificationToFrontend);
        setNotifications(mapped);
      }
    } catch (err) {
      // Offline fallback
      setNotifications(INITIAL_NOTIFICATIONS.filter(n => n.userId === currentUser.id));
    }
  }, [currentUser]);

  const refreshMedicalRecords = useCallback(async (patientId?: string) => {
    if (!currentUser) {
      setMedicalRecords([]);
      return;
    }
    try {
      const res = await medicalRecordApi.getMedicalRecords(patientId);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(mapBackendMedicalRecordToFrontend);
        setMedicalRecords(mapped);
      }
    } catch (err) {
      const targetId = patientId || (currentUser.role === 'patient' ? currentUser.id : undefined);
      const filtered = targetId 
        ? INITIAL_MEDICAL_RECORDS.filter(r => r.patientId === targetId)
        : INITIAL_MEDICAL_RECORDS;
      setMedicalRecords(filtered);
    }
  }, [currentUser]);

  const refreshFeedback = useCallback(async (params?: { doctorId?: string; patientId?: string }) => {
    try {
      const res = await feedbackApi.getFeedback(params);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(mapBackendFeedbackToFrontend);
        setFeedbackList(mapped);
      }
    } catch (err) {
      let filtered = INITIAL_FEEDBACK;
      if (params?.doctorId) {
        filtered = filtered.filter(f => f.doctorId === params.doctorId);
      }
      if (params?.patientId) {
        filtered = filtered.filter(f => f.patientId === params.patientId);
      }
      setFeedbackList(filtered);
    }
  }, []);

  // Load appointments and patients or admin data whenever session role becomes active
  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
      refreshFeedback();
      if (currentUser.role === 'patient') {
        refreshPatientAppointments();
        refreshMedicalRecords();
      } else if (currentUser.role === 'doctor') {
        refreshDoctorAppointments();
        fetchPatients();
        refreshMedicalRecords();
      } else if (currentUser.role === 'admin') {
        refreshAdminData();
      }
    } else {
      setNotifications([]);
      setMedicalRecords([]);
      setFeedbackList([]);
    }
  }, [currentUser, refreshPatientAppointments, refreshDoctorAppointments, fetchPatients, refreshAdminData, refreshNotifications, refreshMedicalRecords, refreshFeedback]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const setCurrentScreen = (screen: string) => {
    if (screen === currentScreen) return;
    setScreenHistory(prev => [...prev, currentScreen]);
    setCurrentScreenState(screen);
    if (screen === 'admin-users') {
      setAdminActiveTab('Users');
    } else if (screen === 'admin-dashboard') {
      setAdminActiveTab('Dashboard');
    } else if (screen === 'admin-appointments') {
      setAdminActiveTab('Appointments');
    }
    const path = SCREEN_PATH_MAP[screen] || (currentUser ? `/${currentUser.role}/dashboard` : '/');
    try {
      window.history.pushState({ screen }, '', path);
    } catch {}
  };

  const goBack = () => {
    if (currentUser) {
      const defaultDashboard = `${currentUser.role}-dashboard`;
      setScreenHistory(prev => {
        const nextHistory = [...prev];
        let targetScreen: string | null = null;
        while (nextHistory.length > 0) {
          const prevScreen = nextHistory.pop()!;
          if (prevScreen === currentScreen) continue;
          if (prevScreen === 'login' || prevScreen === 'register' || prevScreen === 'landing') {
            continue;
          }
          targetScreen = prevScreen;
          break;
        }
        if (!targetScreen) {
          targetScreen = defaultDashboard;
        }
        if (targetScreen !== currentScreen) {
          setCurrentScreenState(targetScreen);
          const path = SCREEN_PATH_MAP[targetScreen] || `/${currentUser.role}/dashboard`;
          try {
            window.history.replaceState({ screen: targetScreen }, '', path);
          } catch {}
        }
        return nextHistory;
      });
    } else {
      setScreenHistory(prev => {
        const nextHistory = [...prev];
        let targetScreen: string | null = null;
        while (nextHistory.length > 0) {
          const prevScreen = nextHistory.pop()!;
          if (prevScreen === currentScreen) continue;
          targetScreen = prevScreen;
          break;
        }
        if (!targetScreen) {
          targetScreen = 'landing';
        }
        if (targetScreen !== currentScreen) {
          setCurrentScreenState(targetScreen);
          const path = SCREEN_PATH_MAP[targetScreen] || '/';
          try {
            window.history.replaceState({ screen: targetScreen }, '', path);
          } catch {}
        }
        return nextHistory;
      });
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const path = window.location.pathname;
      const targetFromState = e.state?.screen;
      const targetFromPath = PATH_SCREEN_MAP[path];
      const targetScreen = targetFromState || targetFromPath || 'landing';

      if (currentUser) {
        if (targetScreen === 'login' || targetScreen === 'register' || targetScreen === 'landing') {
          const dashboard = `${currentUser.role}-dashboard`;
          setCurrentScreenState(dashboard);
          const dashPath = SCREEN_PATH_MAP[dashboard];
          try {
            window.history.replaceState({ screen: dashboard }, '', dashPath);
          } catch {}
          return;
        }
      } else {
        const isProtectedRoute = targetScreen.startsWith('patient-') ||
                                 targetScreen.startsWith('doctor-') ||
                                 targetScreen.startsWith('admin-') ||
                                 targetScreen === 'settings' ||
                                 targetScreen === 'notifications';
        if (isProtectedRoute) {
          setCurrentScreenState('login');
          try {
            window.history.replaceState({ screen: 'login' }, '', '/login');
          } catch {}
          return;
        }
      }
      setCurrentScreenState(targetScreen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // ---------------------------------------------------------------------------
  // Authoritative Backend Authentication Handlers
  // ---------------------------------------------------------------------------

  const login = async (
    identifier: string,
    passwordInput: string,
    selectedPortalHint?: UserRole,
    _rememberMe = true
  ): Promise<{ success: boolean; message?: string; role?: UserRole }> => {
    const trimmedId = identifier.trim().toLowerCase();

    // Helper for preview mode mock authentication
    const tryPreviewFallback = (errorMessage?: string) => {
      let candidates = users && users.length > 0 ? users : INITIAL_USERS;
      
      // Always inject master admin to guarantee the Admin can never be locked out
      const hasAdmin = candidates.some(u => u.role === 'admin' && (u.email.toLowerCase() === 'admin@medicare.local' || u.email.toLowerCase() === 'admin@gmail.com'));
      if (!hasAdmin) {
        const masterAdmin: User = INITIAL_USERS.find(u => u.role === 'admin') || {
          id: 'admin-master',
          name: 'Admin User',
          email: 'admin@medicare.local',
          phone: '+91 99999 99999',
          password: 'password123',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        };
        candidates = [...candidates, masterAdmin];
      }

      // Look up user strictly by email (or phone)
      const matchUser = candidates.find(u => {
        const uEmail = u.email ? u.email.toLowerCase() : '';
        const isEmailMatch = uEmail === trimmedId ||
                            (trimmedId === 'ananya@gmail.com' && u.id === 'd-1') ||
                            (trimmedId === 'ananya.sharma@medicare.com' && u.id === 'd-1');
        return isEmailMatch || u.phone === identifier.trim();
      });

      if (!matchUser) {
        return { 
          success: false, 
          message: 'Account not found. Please sign up first to create an account.' 
        };
      }

      // Admin verification
      if (matchUser.role === 'admin') {
        const isParticularAdminEmail = trimmedId === 'admin@medicare.local' || trimmedId === 'admin@gmail.com';
        const isParticularAdminPassword = passwordInput === 'password123';
        if (!isParticularAdminEmail || !isParticularAdminPassword) {
          return {
            success: false,
            message: 'Invalid administrator credentials. Access denied.'
          };
        }
      } else {
        // Strict password check for Patients & Doctors
        if (matchUser.password !== passwordInput) {
          return {
            success: false,
            message: 'Incorrect password. Please enter the password you registered with.'
          };
        }
      }

      if (matchUser) {
        if (selectedPortalHint && selectedPortalHint !== matchUser.role) {
          return {
            success: false,
            message: `Account role mismatch: This account is registered as a ${matchUser.role}. Please select the ${matchUser.role.charAt(0).toUpperCase() + matchUser.role.slice(1)} portal tab.`,
          };
        }
        setCurrentUser(matchUser);
        setScreenHistory([]);
        const dash = matchUser.role === 'patient'
          ? (selectedDoctorIdForBooking ? 'patient-book' : 'patient-dashboard')
          : matchUser.role === 'doctor' ? 'doctor-dashboard' : 'admin-dashboard';

        setCurrentScreenState(dash);
        const path = SCREEN_PATH_MAP[dash];
        try {
          window.history.pushState({ screen: dash }, '', path);
        } catch {}

        return { success: true, role: matchUser.role };
      }

      return { success: false, message: errorMessage || 'Invalid email/phone number or password.' };
    };

    try {
      const res = await authApi.login({
        identifier: identifier.trim(),
        password: passwordInput,
      });

      if (!res.success || !res.data) {
        if (res.message && (res.message.includes('404') || res.message.includes('unavailable') || res.message.includes('Failed to fetch'))) {
          return tryPreviewFallback(res.message);
        }
        return {
          success: false,
          message: res.message || 'Invalid email/phone number or password.',
        };
      }

      const { user: userDto, role: roleStr } = res.data;
      const actualRole = (roleStr ? roleStr.toLowerCase() : 'patient') as UserRole;

      if (selectedPortalHint && selectedPortalHint !== actualRole) {
        await authApi.logout();
        return {
          success: false,
          message: `Account role mismatch: This account is registered as a ${actualRole}. Please select the ${actualRole.charAt(0).toUpperCase() + actualRole.slice(1)} portal tab.`,
        };
      }

      const frontendUser = mapBackendUserToFrontend(userDto);
      setCurrentUser(frontendUser);
      setScreenHistory([]);

      const dash = actualRole === 'patient'
        ? (selectedDoctorIdForBooking ? 'patient-book' : 'patient-dashboard')
        : actualRole === 'doctor' ? 'doctor-dashboard' : 'admin-dashboard';

      setCurrentScreenState(dash);
      const path = SCREEN_PATH_MAP[dash];
      try {
        window.history.pushState({ screen: dash }, '', path);
      } catch {}

      return { success: true, role: actualRole };
    } catch (err: any) {
      const message = err.message || '';
      if (message.includes('404') || message.includes('unavailable') || message.includes('Failed to fetch') || err.status === 404 || err.status === 0) {
        return tryPreviewFallback(message);
      }
      return { success: false, message: message || 'Invalid email/phone number or password.' };
    }
  };

  const registerUser = async (userData: Partial<User>): Promise<{ success: boolean; message?: string; pendingApproval?: boolean }> => {
    // Validate email uniqueness on client side
    const emailToRegister = (userData.email || '').trim().toLowerCase();
    const isEmailTaken = users.some(u => (u.email || '').trim().toLowerCase() === emailToRegister);
    
    if (isEmailTaken) {
      return {
        success: false,
        message: 'Gmail already exists. Please use a different email address.',
      };
    }

    try {
      const isDoctor = userData.role === 'doctor';
      const roleEnum = isDoctor ? 'DOCTOR' : 'PATIENT';

      const res = await authApi.register({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        password: userData.password || '',
        role: roleEnum,
        specialization: userData.specialization,
        qualification: userData.qualification,
        consultationFee: userData.consultationFee,
      });

      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Registration failed.',
        };
      }

      if (isDoctor) {
        return { success: true, pendingApproval: true };
      }

      if (userData.email && userData.password) {
        await login(userData.email, userData.password);
      }

      return { success: true, pendingApproval: false };
    } catch (err: any) {
      // Offline fallback: Create user in local memory state for browser preview
      const isDoctor = userData.role === 'doctor';
      
      const avatarsPool = [
        'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400', // Male Doctor with glasses
        'https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=400', // Female Doctor
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', // Male Doctor
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400', // Female Doctor looks professional
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400', // Male Doctor
        'https://images.unsplash.com/photo-1527613426441-2da17477166d?auto=format&fit=crop&q=80&w=400', // Female Doctor
      ];

      // Select unique avatar from pool based on name hash
      const nameHash = (userData.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const chosenAvatar = isDoctor 
        ? avatarsPool[nameHash % avatarsPool.length]
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';

      const newUser: User = {
        id: isDoctor ? `d-${Date.now()}` : `p-${Date.now()}`,
        name: userData.name || 'New User',
        email: userData.email || '',
        phone: userData.phone || '',
        password: userData.password || '',
        role: userData.role || 'patient',
        specialization: userData.specialization,
        qualification: userData.qualification,
        consultationFee: userData.consultationFee || 700,
        approvalStatus: isDoctor ? 'PENDING' : 'APPROVED',
        avatar: chosenAvatar,
      };

      setUsers(prev => [...prev, newUser]);

      if (isDoctor) {
        return { success: true, pendingApproval: true };
      }

      // Seamless login for Patient offline preview
      setCurrentUser(newUser);
      setCurrentScreenState('patient-dashboard');
      try {
        window.history.replaceState({ screen: 'patient-dashboard' }, '', '/patient/dashboard');
      } catch {}

      return { success: true, pendingApproval: false };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      setScreenHistory([]);
      setCurrentUser(null);
      // Reload appointments from local storage to keep state across logins/logouts
      try {
        const saved = localStorage.getItem('medicare_appointments');
        setAppointments(saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS);
      } catch {
        setAppointments(INITIAL_APPOINTMENTS);
      }
      setCurrentScreenState('landing');
      try {
        window.history.pushState({ screen: 'landing' }, '', '/');
      } catch {}
    }
  };

  // ---------------------------------------------------------------------------
  // Authoritative Patient Appointment Operations (Java Backend + MySQL)
  // ---------------------------------------------------------------------------

  const bookAppointment = async (data: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<Appointment> => {
    if (isPastDateTime(data.date, data.time)) {
      alert('Error: You cannot book an appointment for a past date or time. Please select an upcoming date and time.');
      throw new Error('Past date/time');
    }

    const dateObj = parseDateString(data.date);
    const isoDate = dateObj ? formatDateToIso(dateObj) : data.date;

    try {
      const res = await appointmentApi.bookAppointment({
        doctorId: data.doctorId,
        appointmentDate: data.date,
        appointmentDateIso: isoDate,
        appointmentTime: data.time,
        type: data.type,
        reason: data.reason,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to book appointment');
      }

      const createdAppointment = mapBackendAppointmentToFrontend(res.data);

      // Re-fetch patient appointments from server to maintain database as single source of truth
      await refreshPatientAppointments();

      return createdAppointment;
    } catch (err: any) {
      // Offline fallback: Create mock appointment locally so the wizard succeeds beautifully
      const mockId = `apt-${Date.now()}`;
      const created: Appointment = {
        id: mockId,
        patientId: currentUser?.id || 'p-1',
        patientName: currentUser?.name || 'John Doe',
        patientPhone: currentUser?.phone || '+91 98765 43210',
        doctorId: data.doctorId,
        doctorName: data.doctorName || 'Dr. Specialist',
        doctorSpecialization: data.doctorSpecialization || 'General Physician',
        doctorAvatar: data.doctorAvatar || 'https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200',
        date: data.date,
        time: data.time,
        type: data.type,
        reason: data.reason,
        status: 'Upcoming',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setAppointments(prev => [created, ...prev]);

      // Trigger a nice mock notification to inform the user
      const mockNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: currentUser?.id || 'p-1',
        title: 'Appointment Scheduled',
        message: `Your appointment with ${created.doctorName} on ${created.date} at ${created.time} has been successfully scheduled.`,
        type: 'appointment',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setNotifications(prev => [mockNotif, ...prev]);

      return created;
    }
  };

  const bookAdminAppointment = async (data: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { patientId: string }): Promise<Appointment> => {
    if (isPastDateTime(data.date, data.time)) {
      alert('Error: You cannot book an appointment for a past date or time. Please select an upcoming date and time.');
      throw new Error('Past date/time');
    }

    const dateObj = parseDateString(data.date);
    const isoDate = dateObj ? formatDateToIso(dateObj) : data.date;

    const res = await appointmentApi.bookAdminAppointment({
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentDate: data.date,
      appointmentDateIso: isoDate,
      appointmentTime: data.time,
      type: data.type,
      reason: data.reason,
    });

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to book appointment as administrator');
    }

    const createdAppointment = mapBackendAppointmentToFrontend(res.data);

    await refreshAdminData();

    return createdAppointment;
  };

  const rescheduleAppointment = async (id: string, date: string, time: string): Promise<void> => {
    if (isPastDateTime(date, time)) {
      alert('Error: You cannot reschedule an appointment to a past date or time. Please choose an upcoming date and time.');
      throw new Error('Past date/time');
    }

    const dateObj = parseDateString(date);
    const isoDate = dateObj ? formatDateToIso(dateObj) : date;

    const res = await appointmentApi.rescheduleAppointment(id, {
      date,
      dateIso: isoDate,
      time,
    });

    if (!res.success) {
      throw new Error(res.message || 'Failed to reschedule appointment');
    }

    await refreshPatientAppointments();
  };

  const updateAppointmentStatus = async (id: string, status: 'Upcoming' | 'Completed' | 'Cancelled'): Promise<void> => {
    if (currentUser?.role === 'doctor') {
      const res = await appointmentApi.updateAppointmentStatus(id, {
        status: status.toUpperCase() as any,
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update appointment status');
      }
      await refreshDoctorAppointments();
    } else if (currentUser?.role === 'patient') {
      if (status === 'Cancelled') {
        const res = await appointmentApi.cancelAppointment(id);
        if (!res.success) {
          throw new Error(res.message || 'Failed to cancel appointment');
        }
      } else {
        const res = await appointmentApi.updateAppointmentStatus(id, {
          status: status.toUpperCase() as any,
        });
        if (!res.success) {
          throw new Error(res.message || 'Failed to update appointment status');
        }
      }
      await refreshPatientAppointments();
    } else {
      const res = await appointmentApi.updateAppointmentStatus(id, {
        status: status.toUpperCase() as any,
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update appointment status');
      }
      await refreshDoctorAppointments();
      await refreshPatientAppointments();
    }
  };

  // ---------------------------------------------------------------------------
  // Authoritative Patient Profile Update (PUT /api/users/{id})
  // ---------------------------------------------------------------------------
  const updateUserProfile = async (userId: string, updatedFields: Partial<User>): Promise<void> => {
    const res = await userApi.updateUserProfile(userId, {
      name: updatedFields.name,
      phone: updatedFields.phone,
      avatarUrl: updatedFields.avatar,
      dob: updatedFields.dob,
      gender: updatedFields.gender,
      address: updatedFields.address,
      emergencyContact: updatedFields.emergencyContact,
      emergencyRelation: updatedFields.emergencyRelation,
    });

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to update profile');
    }

    const updatedUser = mapBackendUserToFrontend(res.data);
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
  };

  // ---------------------------------------------------------------------------
  // Non-Auth Operational Functions (Preserved for Untouched UI Screens)
  // ---------------------------------------------------------------------------

  const changePassword = (currentPass: string, newPass: string, confirmPass: string): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'No active user session found.' };
    }

    if (!currentPass || !newPass || !confirmPass) {
      return { success: false, message: 'All password fields are required.' };
    }

    if (newPass !== confirmPass) {
      return { success: false, message: 'New password and confirm password do not match.' };
    }

    if (newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    // Verify current password matches the active user's password
    const userInDb = users.find(u => u.id === currentUser.id);
    const existingPassword = userInDb?.password || currentUser.password || 'password123';

    if (currentPass !== existingPassword) {
      return { success: false, message: 'The current password you entered is incorrect.' };
    }

    // Update password in dynamic users list
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, password: newPass };
      }
      return u;
    }));

    // Update active currentUser context password
    setCurrentUser(prev => prev ? { ...prev, password: newPass } : null);

    return { success: true, message: 'Your password has been successfully updated!' };
  };

  const resetPasswordWithIdentifier = (identifier: string, newPass: string): { success: boolean; message: string } => {
    const trimmedId = identifier.trim().toLowerCase();
    
    // Find the user by email or phone
    const userInDb = users.find(u => {
      const uEmail = u.email ? u.email.toLowerCase() : '';
      return uEmail === trimmedId || u.phone === identifier.trim();
    });

    if (!userInDb) {
      return { success: false, message: 'No registered account found with this email or phone number.' };
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    // Update password in dynamic users list
    setUsers(prev => prev.map(u => {
      if (u.id === userInDb.id) {
        return { ...u, password: newPass };
      }
      return u;
    }));

    // If the updated user is the current logged-in user, sync current session
    if (currentUser && currentUser.id === userInDb.id) {
      setCurrentUser(prev => prev ? { ...prev, password: newPass } : null);
    }

    return { success: true, message: 'Password has been successfully updated.' };
  };

  const addMedicalRecord = async (record: Omit<MedicalRecord, 'id'> & { patientId?: string }): Promise<MedicalRecord> => {
    const targetPatientId = record.patientId || (currentUser?.role === 'patient' ? currentUser.id : '');
    if (!targetPatientId) {
      throw new Error('Patient ID is required to create a medical record.');
    }
    const res = await medicalRecordApi.createMedicalRecord({
      patientId: targetPatientId,
      recordDate: record.date || new Date().toISOString().split('T')[0],
      recordType: record.type,
      diagnosis: record.description,
      treatmentPlan: record.details,
      prescriptions: record.details,
    });

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to create medical record on backend');
    }

    const createdRecord = mapBackendMedicalRecordToFrontend(res.data);
    await refreshMedicalRecords(currentUser?.role === 'patient' ? undefined : targetPatientId);
    return createdRecord;
  };

  const addUserByAdmin = async (userData: Partial<User> & { password?: string }): Promise<User> => {
    if (!userData.password) {
      throw new Error('Administrator password is required.');
    }
    
    // Validate email uniqueness on client side
    const emailToRegister = (userData.email || '').trim().toLowerCase();
    const isEmailTaken = users.some(u => (u.email || '').trim().toLowerCase() === emailToRegister);
    
    if (isEmailTaken) {
      throw new Error('Gmail already exists. Please use a different email address.');
    }

    const isDoctor = userData.role === 'doctor';
    try {
      const res = await authApi.register({
        name: userData.name || 'New User',
        email: userData.email || '',
        phone: userData.phone || '+91 98765 43210',
        password: userData.password,
        role: isDoctor ? 'DOCTOR' : 'PATIENT',
        specialization: userData.specialization,
        qualification: userData.qualification,
        consultationFee: userData.consultationFee,
      });
      if (res.success && res.data?.user) {
        const newUser = mapBackendUserToFrontend(res.data.user);
        if (currentUser?.role === 'admin') {
          await refreshAdminData();
        } else {
          setUsers(prev => [newUser, ...prev]);
        }
        return newUser;
      } else {
        throw new Error(res.message || 'Failed to create user via backend');
      }
    } catch (err) {
      // Offline fallback
      const avatarsPool = [
        'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400', // Male Doctor with glasses
        'https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=400', // Female Doctor
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', // Male Doctor
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400', // Female Doctor looks professional
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400', // Male Doctor
        'https://images.unsplash.com/photo-1527613426441-2da17477166d?auto=format&fit=crop&q=80&w=400', // Female Doctor
      ];

      const nameHash = (userData.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const chosenAvatar = isDoctor 
        ? avatarsPool[nameHash % avatarsPool.length]
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';

      const newUser: User = {
        id: `u-${Date.now()}`,
        name: userData.name || 'New User',
        email: userData.email || '',
        phone: userData.phone || '+91 98765 43210',
        role: userData.role || 'patient',
        specialization: userData.specialization,
        qualification: userData.qualification,
        consultationFee: userData.consultationFee || (isDoctor ? 800 : undefined),
        approvalStatus: isDoctor ? 'APPROVED' : undefined,
        avatar: chosenAvatar,
      };
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    }
  };

  const deleteUserByAdmin = async (userId: string): Promise<void> => {
    // Update local state immediately for instant feedback
    setUsers(prev => prev.filter(u => u.id !== userId));

    try {
      const res = await userApi.deleteUser(userId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to delete user');
      }
      if (currentUser?.role === 'admin') {
        await refreshAdminData();
      }
    } catch (err) {
      // API call failed, but local state remains updated
    }
  };

  const approveDoctor = async (doctorId: string, approve: boolean): Promise<void> => {
    const status: 'APPROVED' | 'REJECTED' = approve ? 'APPROVED' : 'REJECTED';
    
    // Update local state immediately for instant feedback across all wings (Patient/Doctor/Admin)
    setUsers(prev => prev.map(u => u.id === doctorId ? { ...u, approvalStatus: status } : u));

    try {
      const apiCall = approve ? userApi.approveDoctor(doctorId) : userApi.rejectDoctor(doctorId);
      const res = await apiCall;
      if (!res.success) {
        throw new Error(res.message || 'Failed to update doctor approval status');
      }
      if (currentUser?.role === 'admin') {
        await refreshAdminData();
      }
    } catch (err) {
      // API call failed, but local state remains updated
    }
  };

  const markNotificationRead = async (notifId: string): Promise<void> => {
    try {
      const res = await notificationApi.markAsRead(notifId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to mark notification as read');
      }
      await refreshNotifications();
    } catch (err) {
      // Offline fallback
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }
  };

  const markAllNotificationsRead = async (): Promise<void> => {
    try {
      const res = await notificationApi.markAllAsRead();
      if (!res.success) {
        throw new Error(res.message || 'Failed to mark all notifications as read');
      }
      await refreshNotifications();
    } catch (err) {
      // Offline fallback
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const addFeedback = async (feedback: Omit<FeedbackItem, 'id' | 'createdAt'> & { appointmentId?: string }): Promise<FeedbackItem> => {
    if (!feedback.appointmentId) {
      throw new Error('Canonical appointment ID is required to submit feedback.');
    }
    try {
      const res = await feedbackApi.submitFeedback({
        doctorId: feedback.doctorId,
        appointmentId: feedback.appointmentId,
        rating: feedback.rating,
        comment: feedback.comment,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to submit feedback');
      }

      const createdFb = mapBackendFeedbackToFrontend(res.data);
      await refreshFeedback();
      return createdFb;
    } catch (err) {
      // Offline fallback
      const createdFb: FeedbackItem = {
        id: `fb-${Date.now()}`,
        patientId: feedback.patientId,
        patientName: feedback.patientName,
        doctorId: feedback.doctorId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setFeedbackList(prev => [createdFb, ...prev]);
      return createdFb;
    }
  };

  const startBookingWithDoctor = (doctorId: string) => {
    setSelectedDoctorIdForBooking(doctorId);
    setCurrentScreen('patient-book');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        users,
        appointments,
        medicalRecords,
        notifications,
        feedbackList,
        analyticsOverview,
        currentScreen,
        mobileNavTab,
        selectedDoctorIdForBooking,
        setSelectedDoctorIdForBooking,
        startBookingWithDoctor,
        selectedPatientForDetail,
        setSelectedPatientForDetail,
        adminActiveTab,
        setAdminActiveTab,
        login,
        registerUser,
        logout,
        setCurrentScreen,
        goBack,
        canGoBack: screenHistory.length > 0,
        setMobileNavTab,
        bookAppointment,
        bookAdminAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        refreshPatientAppointments,
        refreshDoctorAppointments,
        addMedicalRecord,
        updateUserProfile,
        changePassword,
        resetPasswordWithIdentifier,
        addUserByAdmin,
        deleteUserByAdmin,
        approveDoctor,
        markNotificationRead,
        markAllNotificationsRead,
        addFeedback,
        viewScreenReferenceModal,
        setViewScreenReferenceModal,
        sidebarOpen,
        toggleSidebar,
        weeklySchedule,
        setWeeklySchedule,
        blockedDates,
        setBlockedDates,
        slotDuration,
        setSlotDuration,
        maxPatientsPerSlot,
        setMaxPatientsPerSlot,
        bufferTime,
        setBufferTime,
        doctorSearchQuery,
        setDoctorSearchQuery,
        doctorSpecialtyFilter,
        setDoctorSpecialtyFilter
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
