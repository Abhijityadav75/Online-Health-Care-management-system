import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, Stethoscope, Calendar, FileBarChart, CheckCircle2, Shield, Settings,
  Search, Plus, Trash2, Edit3, X, Download, Bell, Moon, Database, UserCheck,
  Activity, CalendarDays, ChevronRight, Eye, LayoutDashboard,
  TrendingUp, Award, Clock, Copy, AlertCircle
} from 'lucide-react';
import { User, Appointment } from '../../types';
import { 
  getTodayIsoString, 
  formatDateForDisplay, 
  isPastDate, 
  isTimeSlotPast,
  getInitialBookingDate,
  formatDoctorName 
} from '../../utils/dateUtils';

interface AdminDashboardProps {
  initialTab?: 'Dashboard' | 'Users' | 'Appointments' | 'Settings' | 'Analytics';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab }) => {
  const { 
    currentUser, 
    users, 
    appointments, 
    approveDoctor, 
    updateUserProfile, 
    updateAppointmentStatus, 
    rescheduleAppointment,
    bookAppointment,
    bookAdminAppointment,
    adminActiveTab, 
    setAdminActiveTab, 
    addUserByAdmin, 
    deleteUserByAdmin, 
    setCurrentScreen,
    feedbackList,
    slotDuration,
    analyticsOverview
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'Dashboard' | 'Users' | 'Appointments' | 'Settings' | 'Analytics'>(
    () => initialTab || adminActiveTab || 'Dashboard'
  );

  React.useEffect(() => {
    if (initialTab) {
      setActiveAdminTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (adminActiveTab) {
      setActiveAdminTab(adminActiveTab);
    }
  }, [adminActiveTab]);

  const handleTabSwitch = (tab: 'Dashboard' | 'Users' | 'Appointments' | 'Settings' | 'Analytics') => {
    setActiveAdminTab(tab);
    setAdminActiveTab(tab);
    if (tab === 'Dashboard') {
      setCurrentScreen('admin-dashboard');
    } else if (tab === 'Users') {
      setCurrentScreen('admin-users');
    } else if (tab === 'Appointments') {
      setCurrentScreen('admin-appointments');
    } else if (tab === 'Settings') {
      setCurrentScreen('settings');
    }
  };

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [aptSubTab, setAptSubTab] = useState<'All' | 'Upcoming' | 'Completed' | 'Cancelled'>('All');
  const [aptSearch, setAptSearch] = useState('');

  const [settingsSidebarTab, setSettingsSidebarTab] = useState<
    'General Settings' | 'Appointment Settings' | 'Notification Settings' | 'User Management' | 'Security & Access' | 'Appearance' | 'Backup & Data' | 'System Logs'
  >('General Settings');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [newUserPhone, setNewUserPhone] = useState('+91 98765 43210');

  const [viewUserObj, setViewUserObj] = useState<User | null>(null);
  const [editUserObj, setEditUserObj] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [deleteConfirmationUser, setDeleteConfirmationUser] = useState<User | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
  const patients = uniqueUsers.filter(u => u.role === 'patient');
  const doctors = uniqueUsers.filter(u => u.role === 'doctor');
  const admins = uniqueUsers.filter(u => u.role === 'admin');
  const pendingDoctors = doctors.filter(d => d.approvalStatus === 'PENDING');

  const [schedPatientId, setSchedPatientId] = useState(patients[0]?.id || '');
  const [schedDoctorId, setSchedDoctorId] = useState(doctors[0]?.id || '');
  
  const initialAdminBooking = getInitialBookingDate();
  const [schedDateIso, setSchedDateIso] = useState(initialAdminBooking.iso);
  const [schedDate, setSchedDate] = useState(initialAdminBooking.display);
  const [schedTime, setSchedTime] = useState('10:00 AM');

  // Export report modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReportContent, setExportReportContent] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  const [systemName, setSystemName] = useState('MediCare - Online Healthcare Management System');
  const [systemEmail, setSystemEmail] = useState('support@medicare.local');
  const [contactNumber, setContactNumber] = useState('+91 98765 43210');
  const [address, setAddress] = useState('New Delhi, India');
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Authoritative analytics consumed exclusively from AnalyticsServlet via analyticsOverview
  const totalAppointments = analyticsOverview?.totalAppointments;
  const completedConsultations = analyticsOverview?.completedConsultations;
  const upcomingAppointments = analyticsOverview?.upcomingAppointments;
  const cancelledAppointments = analyticsOverview?.cancelledAppointments;
  const totalUsers = analyticsOverview?.totalUsers;
  const patientCount = analyticsOverview?.patientCount;
  const doctorCount = analyticsOverview?.doctorCount;
  const adminCount = analyticsOverview?.adminCount;

  const validRatings = (feedbackList || []).filter(f => typeof f.rating === 'number' && f.rating > 0);
  const averagePatientRatingDisplay = validRatings.length > 0
    ? `${(validRatings.reduce((sum, f) => sum + f.rating, 0) / validRatings.length).toFixed(1)} / 5.0`
    : 'No ratings yet';

  const standardConsultationDuration = analyticsOverview?.standardConsultationDuration || slotDuration || '20 mins';

  const departmentAnalytics = analyticsOverview?.departments ? analyticsOverview.departments.map(d => ({
    dept: d.department,
    doctors: d.doctorCount,
    consultations: d.consultations,
    load: d.loadPercentage,
    color: d.department.toLowerCase().includes('cardio') ? 'bg-rose-500' :
           d.department.toLowerCase().includes('derma') ? 'bg-purple-500' :
           d.department.toLowerCase().includes('ortho') ? 'bg-emerald-500' : 'bg-blue-600'
  })) : null;

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    try {
      await addUserByAdmin({
        name: newUserName,
        email: newUserEmail,
        phone: newUserPhone,
        role: newUserRole,
        password: newUserPassword,
        specialization: newUserRole === 'doctor' ? 'Cardiology' : undefined
      });
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      showToast(`User account "${newUserName}" (${newUserRole}) created successfully!`);
    } catch (err: any) {
      showToast(`Error creating user: ${err.message || 'Failed'}`);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserObj) return;
    try {
      await updateUserProfile(editUserObj.id, { name: editName, email: editEmail });
      setEditUserObj(null);
      showToast(`User account "${editName}" updated successfully!`);
    } catch (err: any) {
      showToast(`Error updating profile: ${err.message || 'Failed'}`);
    }
  };

  const handleDeleteUser = (u: User) => {
    setDeleteConfirmationUser(u);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPastDate(schedDateIso) || isTimeSlotPast(schedDateIso, schedTime)) {
      showToast('Error: Cannot schedule an appointment for a past date or time.');
      return;
    }
    const patObj = patients.find(p => p.id === schedPatientId) || patients[0];
    const docObj = doctors.find(d => d.id === schedDoctorId) || doctors[0];
    if (!patObj || !docObj) {
      showToast('Error: Please select a valid patient and doctor.');
      return;
    }

    try {
      await bookAdminAppointment({
        patientId: patObj.id,
        patientName: patObj.name,
        patientPhone: patObj.phone || '+91 98765 43210',
        doctorId: docObj.id,
        doctorName: docObj.name,
        doctorSpecialization: docObj.specialization || 'Cardiology',
        date: schedDate,
        time: schedTime,
        type: 'In-clinic',
        reason: 'Scheduled by Administrator'
      });
      setShowScheduleModal(false);
      showToast(`Appointment scheduled for ${patObj.name} with ${docObj.name} on ${schedDate} at ${schedTime}.`);
    } catch (err: any) {
      showToast(`Error booking appointment: ${err.message || 'Failed'}`);
    }
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;
    if (isPastDate(schedDateIso) || isTimeSlotPast(schedDateIso, schedTime)) {
      showToast('Error: Cannot reschedule an appointment to a past date or time.');
      return;
    }
    rescheduleAppointment(selectedApt.id, schedDate, schedTime);
    setShowRescheduleModal(false);
    showToast(`Appointment rescheduled to ${schedDate} at ${schedTime}.`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('System configuration settings saved successfully!');
  };

  const handleDownloadReport = () => {
    const approvedDocs = doctors.filter(d => d.approvalStatus === 'APPROVED' || !d.approvalStatus);
    const pendingDocs = doctors.filter(d => d.approvalStatus === 'PENDING');

    const reportData = `MediCare Analytics Report

Generated Date: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

User Statistics
- Total Users: ${totalUsers ?? 'Analytics unavailable'}
- Patients: ${patientCount ?? 'Analytics unavailable'}
- Doctors: ${doctorCount ?? 'Analytics unavailable'}
- Admins: ${adminCount ?? 'Analytics unavailable'}

Appointment Statistics
- Total Appointments: ${totalAppointments ?? 'Analytics unavailable'}
- Upcoming Appointments: ${upcomingAppointments ?? 'Analytics unavailable'}
- Completed Consultations: ${completedConsultations ?? 'Analytics unavailable'}
- Cancelled Appointments: ${cancelledAppointments ?? 'Analytics unavailable'}

Doctor Statistics
- Approved Doctors: ${approvedDocs.length}
- Pending Doctors: ${pendingDocs.length}

Department Statistics
${departmentAnalytics ? departmentAnalytics.map(d => `- ${d.dept}: ${d.consultations} consultations (${d.doctors} doctors)`).join('\n') : 'Department analytics unavailable'}`;

    setExportReportContent(reportData);
    setShowExportModal(true);
    setCopiedReport(false);

    try {
      const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MediCare_Analytics_Report.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.warn('Direct file download fallback initialized', e);
    }

    showToast('Analytics report generated successfully!');
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 min-h-screen relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeAdminTab === 'Dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/85">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                Hello, {currentUser?.name || 'Admin'}! Here is a summary of the healthcare management system.
              </p>
            </div>
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => handleTabSwitch('Users')}
                className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Manage Users</span>
              </button>
              <div className="flex items-center space-x-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Mon, 28 Sep 2026</span>
              </div>
            </div>
          </div>

          {/* 6 Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div onClick={() => { setRoleFilter('All Roles'); handleTabSwitch('Users'); }} className="bg-white/95 p-5 rounded-3xl shadow-xs border border-slate-200/85 space-y-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
                <span className="text-2xl font-extrabold text-slate-900">{totalUsers ?? '—'}</span>
                <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">Manage Users →</span>
              </div>
            </div>

            <div onClick={() => { setRoleFilter('Patient'); handleTabSwitch('Users'); }} className="bg-white/95 p-5 rounded-3xl shadow-xs border border-slate-200/85 space-y-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patients</span>
                <span className="text-2xl font-extrabold text-slate-900">{patientCount ?? '—'}</span>
                <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">View Patients →</span>
              </div>
            </div>

            <div onClick={() => { setRoleFilter('Doctor'); handleTabSwitch('Users'); }} className="bg-white/95 p-5 rounded-3xl shadow-xs border border-slate-200/85 space-y-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doctors</span>
                <span className="text-2xl font-extrabold text-slate-900">{doctorCount ?? '—'}</span>
                <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">{pendingDoctors.length} pending</span>
              </div>
            </div>

            <div onClick={() => handleTabSwitch('Appointments')} className="bg-white/95 p-5 rounded-3xl shadow-xs border border-slate-200/85 space-y-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Appointments</span>
                <span className="text-2xl font-extrabold text-slate-900">{totalAppointments ?? '—'}</span>
                <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">Live Bookings</span>
              </div>
            </div>

            <div className="bg-white/95 p-5 rounded-3xl shadow-xs border border-slate-200/85 space-y-3">
              <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admins</span>
                <span className="text-2xl font-extrabold text-slate-900">{adminCount ?? '—'}</span>
                <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">Secure Access</span>
              </div>
            </div>

            <div className="bg-white/95 p-5 rounded-3xl shadow-xs border border-slate-200/85 space-y-3">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Status</span>
                <span className="text-2xl font-extrabold text-slate-900">Active</span>
                <span className="block text-[11px] font-bold text-emerald-600 mt-0.5">Operational</span>
              </div>
            </div>
          </div>

          {/* Pending Doctor Approvals Banner (if any pending) */}
          {pendingDoctors.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-amber-950">Pending Doctor Verification ({pendingDoctors.length})</h4>
                    <p className="text-xs text-amber-800">New doctor registration applications requiring administrative approval before access is granted.</p>
                  </div>
                </div>
                <button
                  onClick={() => { setRoleFilter('Doctor'); setStatusFilter('Pending'); handleTabSwitch('Users'); }}
                  className="text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  View All in Users Table →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {pendingDoctors.map(doc => (
                  <div key={doc.id} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center space-x-3">
                      <img src={doc.avatar || "https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200"} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-extrabold text-slate-900 truncate">{doc.name}</h5>
                        <p className="text-[11px] text-blue-600 font-bold">{doc.specialization || 'Cardiology'}</p>
                        <p className="text-[10px] text-slate-400">{doc.qualification || 'MBBS'} • {doc.experience || 5} yrs exp</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => { approveDoctor(doc.id, true); showToast(`${doc.name} approved successfully!`); }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => { approveDoctor(doc.id, false); showToast(`${doc.name} registration rejected.`); }}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 2: Charts and Registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Appointments Overview */}
            <div className="lg:col-span-5 bg-white/95 p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/85 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Appointments Overview</h3>
                  <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-500 mt-1">
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span><span>Total</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span>Completed</span></span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 items-end h-40 px-2 relative z-10 pt-4 border-b border-slate-100">
                {[
                  { day: '22 Sep', hTotal: '55%', hComp: '40%' },
                  { day: '23 Sep', hTotal: '65%', hComp: '45%' },
                  { day: '24 Sep', hTotal: '75%', hComp: '50%' },
                  { day: '25 Sep', hTotal: '80%', hComp: '55%' },
                  { day: '26 Sep', hTotal: '90%', hComp: '70%' },
                  { day: '27 Sep', hTotal: '95%', hComp: '65%' },
                  { day: '28 Sep', hTotal: '90%', hComp: '65%' }
                ].map((pt, i) => (
                  <div key={i} className="flex flex-col items-center space-y-2 h-full justify-end group">
                    <div className="w-full relative h-full flex items-end justify-center">
                      <div style={{ height: pt.hTotal }} className="w-2.5 bg-blue-600 rounded-full"></div>
                      <div style={{ height: pt.hComp }} className="w-2.5 bg-emerald-500 rounded-full absolute bottom-0 opacity-80"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{pt.day.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Distribution */}
            <div className="lg:col-span-3 bg-white/95 p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/85 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">User Distribution</h3>
              </div>
              <div className="text-center py-2 relative">
                <div className="w-32 h-32 rounded-full border-8 border-blue-600 border-t-cyan-400 border-r-indigo-500 border-b-purple-500 mx-auto flex items-center justify-center shadow-inner">
                  <div>
                    <span className="block text-2xl font-extrabold text-slate-900">{totalUsers ?? '—'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>Patients</span><span className="text-slate-500">{patientCount ?? '—'}</span></div>
                <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>Doctors</span><span className="text-slate-500">{doctorCount ?? '—'}</span></div>
                <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>Admins</span><span className="text-slate-500">{adminCount ?? '—'}</span></div>
              </div>
            </div>

            {/* Recent Registrations */}
            <div className="lg:col-span-4 bg-white/95 p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/85 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">Recent Users</h3>
                <button onClick={() => handleTabSwitch('Users')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-3">
                {users.slice(0, 5).map((u, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 transition rounded-2xl border border-slate-100 flex items-center justify-between text-xs cursor-pointer" onClick={() => setViewUserObj(u)}>
                    <div className="flex items-center space-x-3">
                      <img src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} alt="" className="w-8 h-8 rounded-xl object-cover border" />
                      <div>
                        <span className="font-extrabold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-500 capitalize">{u.role}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeAdminTab === 'Users' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/85">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Manage Users</h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">View, add, edit and manage all system users and their roles.</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-500/20 transition flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New User</span>
            </button>
          </div>

          {/* User Filter & Search */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
                  <option>All Roles</option>
                  <option>Doctor</option>
                  <option>Patient</option>
                  <option>Admin</option>
                </select>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Pending Approval</option>
                  <option>Rejected</option>
                </select>
                <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
                  <option>All Departments</option>
                  <option>Cardiology</option>
                  <option>Dermatology</option>
                  <option>Orthopedics</option>
                  <option>General Medicine</option>
                </select>
              </div>
            </div>

            {/* Users Table with Dedicated STATUS Column */}
            {(() => {
              const filteredUsers = uniqueUsers.filter(u => {
                if (roleFilter !== 'All Roles' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
                if (statusFilter === 'Active') {
                  if (u.role === 'doctor' && u.approvalStatus && u.approvalStatus !== 'APPROVED') return false;
                }
                if (statusFilter === 'Pending Approval' || statusFilter === 'Pending') {
                  if (u.approvalStatus !== 'PENDING') return false;
                }
                if (statusFilter === 'Rejected') {
                  if (u.approvalStatus !== 'REJECTED') return false;
                }
                if (deptFilter !== 'All Departments') {
                  if (u.role === 'doctor') {
                    const spec = u.specialization || 'Cardiology';
                    if (!spec.toLowerCase().includes(deptFilter.toLowerCase())) return false;
                  } else {
                    return false;
                  }
                }
                if (userSearch.trim()) {
                  const q = userSearch.toLowerCase();
                  const matchName = u.name?.toLowerCase().includes(q);
                  const matchEmail = u.email?.toLowerCase().includes(q);
                  const matchPhone = u.phone?.toLowerCase().includes(q);
                  const matchSpec = u.specialization?.toLowerCase().includes(q);
                  return matchName || matchEmail || matchPhone || matchSpec;
                }
                return true;
              });

              const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-12">#</th>
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Specialization</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4">STATUS</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                            No users match the selected search or filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((u, idx) => {
                          const isDoctor = u.role === 'doctor';
                          const statusLabel = isDoctor
                            ? (u.approvalStatus === 'PENDING' ? 'PENDING APPROVAL' : u.approvalStatus === 'REJECTED' ? 'REJECTED' : 'ACTIVE')
                            : 'ACTIVE';

                          const statusBadgeClass = statusLabel === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : statusLabel === 'PENDING APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 font-black'
                            : 'bg-rose-50 text-rose-700 border-rose-200 font-black';

                          return (
                            <tr key={`${u.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                              <td className="py-4 px-4 font-bold text-slate-400">{(currentPage - 1) * pageSize + idx + 1}</td>
                              <td className="py-4 px-4 font-extrabold text-slate-900 flex items-center space-x-2.5">
                                <img src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} alt="" className="w-8 h-8 rounded-xl object-cover border shrink-0" />
                                <span className="hover:text-blue-600 cursor-pointer truncate" onClick={() => setViewUserObj(u)}>{u.name}</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${u.role === 'doctor' ? 'bg-blue-50 text-blue-700 border border-blue-200' : u.role === 'patient' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-slate-700 font-semibold text-xs">
                                {u.role === 'doctor' ? (u.specialization || 'Cardiologist') : '—'}
                              </td>
                              <td className="py-4 px-4 text-slate-600 text-xs">
                                <div className="text-slate-800 font-medium">{u.email}</div>
                                <div className="text-[11px] text-slate-400">{u.phone || '+91 98765 43210'}</div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusBadgeClass}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                                {u.role === 'doctor' && u.approvalStatus === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => { approveDoctor(u.id, true); showToast(`${formatDoctorName(u.name)} approved and activated!`); }}
                                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-2xs"
                                      title="Approve Doctor"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => { approveDoctor(u.id, false); showToast(`${formatDoctorName(u.name)} registration rejected.`); }}
                                      className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 cursor-pointer"
                                      title="Reject Doctor"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {u.role === 'doctor' && u.approvalStatus === 'REJECTED' && (
                                  <button
                                    onClick={() => { approveDoctor(u.id, true); showToast(`${formatDoctorName(u.name)} approved and re-activated!`); }}
                                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                                    title="Re-activate Doctor"
                                  >
                                    Re-Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => { setEditUserObj(u); setEditName(u.name); setEditEmail(u.email); setEditRole(u.role); }}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition cursor-pointer inline-block"
                                  title="Edit User"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setViewUserObj(u)}
                                  className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer inline-block"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer inline-block"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* APPOINTMENTS TAB */}
      {activeAdminTab === 'Appointments' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Appointment Management</h3>
              <p className="text-xs text-slate-500 mt-0.5">View, schedule and manage all appointments across doctors</p>
            </div>
            <button
              onClick={() => {
                if (patients.length > 0 && !schedPatientId) setSchedPatientId(patients[0].id);
                if (doctors.length > 0 && !schedDoctorId) setSchedDoctorId(doctors[0].id);
                setShowScheduleModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Appointment</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto">
              {(['All', 'Upcoming', 'Completed', 'Cancelled'] as const).map(sub => (
                <button
                  key={sub}
                  onClick={() => setAptSubTab(sub)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${aptSubTab === sub ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {sub} Appointments
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Appointments Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12">#</th>
                  <th className="py-3.5 px-4">Appointment ID</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4">Type & Reason</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {appointments
                  .filter(a => {
                    if (aptSubTab === 'Upcoming' && a.status !== 'Upcoming') return false;
                    if (aptSubTab === 'Completed' && a.status !== 'Completed') return false;
                    if (aptSubTab === 'Cancelled' && a.status !== 'Cancelled') return false;
                    return a.patientName.toLowerCase().includes(aptSearch.toLowerCase()) || 
                           a.doctorName.toLowerCase().includes(aptSearch.toLowerCase()) ||
                           a.id.toLowerCase().includes(aptSearch.toLowerCase());
                  })
                  .map((apt, idx) => (
                    <tr key={`${apt.id}-${idx}`} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-4 px-4 font-mono font-bold text-xs text-blue-700">{apt.id}</td>
                      <td className="py-4 px-4 font-extrabold text-slate-900">{apt.date} <span className="block text-[10px] text-slate-500">{apt.time}</span></td>
                      <td className="py-4 px-4 font-bold text-slate-800">{apt.patientName}</td>
                      <td className="py-4 px-4 font-semibold text-blue-600">{apt.doctorName}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                          {apt.type}
                        </span>
                        {apt.reason && <span className="block text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5" title={apt.reason}>{apt.reason}</span>}
                      </td>
                      <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${apt.status === 'Upcoming' ? 'bg-emerald-100 text-emerald-800' : apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                          {apt.status}
                        </span>
                        <button onClick={() => { setSelectedApt(apt); setShowRescheduleModal(true); }} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] cursor-pointer">Reschedule</button>
                        <button onClick={() => { updateAppointmentStatus(apt.id, 'Cancelled'); showToast('Appointment cancelled.'); }} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] cursor-pointer">Cancel</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS & REPORTS TAB */}
      {activeAdminTab === 'Analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/85">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileBarChart className="w-7 h-7 text-blue-600" />
                <span>Performance Analytics</span>
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                Overview of system metrics, patient consultations, and department distribution.
              </p>
            </div>
            <button
              onClick={handleDownloadReport}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition flex items-center space-x-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Analytics Report</span>
            </button>
          </div>

          {/* 5 KPI Metric Highlights & Breakdown */}
          {!analyticsOverview ? (
            <div className="bg-white/95 p-8 rounded-3xl border border-slate-200/85 shadow-xs text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900">Analytics unavailable</h3>
              <p className="text-xs font-medium text-slate-500">Could not retrieve system analytics from backend.</p>
            </div>
          ) : (
            <>
              {/* 5 KPI Metric Highlights */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Appointments</span>
                  <p className="text-3xl font-black text-slate-900">{totalAppointments ?? '—'}</p>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{completedConsultations ?? 0} completed • {upcomingAppointments ?? 0} upcoming</span>
                  </span>
                </div>

                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Completed Consultations</span>
                  <p className="text-3xl font-black text-slate-900">{completedConsultations ?? '—'}</p>
                  <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recorded completed visits</span>
                  </span>
                </div>

                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Upcoming Appointments</span>
                  <p className="text-3xl font-black text-slate-900">{upcomingAppointments ?? '—'}</p>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Scheduled upcoming visits</span>
                  </span>
                </div>

                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/85 shadow-xs space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Patient Ratings</span>
                  <p className="text-2xl font-black text-slate-900">{averagePatientRatingDisplay}</p>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>{validRatings.length > 0 ? `${validRatings.length} verified review(s)` : 'Awaiting patient reviews'}</span>
                  </span>
                </div>

                <div className="bg-white/95 p-6 rounded-3xl border border-slate-200/85 shadow-xs space-y-2 col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Standard Duration</span>
                  <p className="text-3xl font-black text-slate-900">{standardConsultationDuration}</p>
                  <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Configured appointment slot</span>
                  </span>
                </div>
              </div>

              {/* Compact Appointment Status Breakdown */}
              <div className="bg-white/95 p-6 sm:p-7 rounded-3xl border border-slate-200/85 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Appointment Status Distribution</h3>
                    <p className="text-xs text-slate-500">Live breakdown of all {totalAppointments ?? 0} appointment records</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    Live appointment data
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                    <span className="block text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Upcoming</span>
                    <span className="text-2xl font-black text-emerald-700">{upcomingAppointments ?? 0}</span>
                  </div>
                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                    <span className="block text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">Completed</span>
                    <span className="text-2xl font-black text-blue-700">{completedConsultations ?? 0}</span>
                  </div>
                  <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl">
                    <span className="block text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">Cancelled</span>
                    <span className="text-2xl font-black text-rose-700">{cancelledAppointments ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Department Performance Breakdown */}
              <div className="bg-white/95 p-6 sm:p-8 rounded-3xl border border-slate-200/85 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">Department Consultation Distribution</h3>
                    <p className="text-xs text-slate-500">Live consultation counts matching real scheduled appointments ({totalAppointments ?? 0} total)</p>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                    Live appointment data
                  </span>
                </div>
                {!departmentAnalytics || departmentAnalytics.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs font-bold text-slate-500">
                    Department analytics unavailable
                  </div>
                ) : (
                  <div className="space-y-4">
                    {departmentAnalytics.map((row, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{row.dept}</span>
                          <span className="text-slate-500 font-semibold">{row.doctors} Registered Doctors • {row.consultations} Consultations ({row.load})</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full rounded-full ${row.color}`} style={{ width: row.load === '0%' ? '2%' : row.load }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeAdminTab === 'Settings' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">System Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage system configurations and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
              {[
                { name: 'General Settings', icon: Settings },
                { name: 'Appointment Settings', icon: Calendar },
                { name: 'Notification Settings', icon: Bell },
                { name: 'User Management', icon: Users },
                { name: 'Security & Access', icon: Shield },
                { name: 'Appearance', icon: Moon },
                { name: 'Backup & Data', icon: Database },
                { name: 'System Logs', icon: FileBarChart }
              ].map((item) => {
                const IconC = item.icon;
                const isActive = settingsSidebarTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setSettingsSidebarTab(item.name as any)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconC className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-75" />
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h4 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">{settingsSidebarTab}</h4>

              {settingsSidebarTab === 'General Settings' ? (
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Name</label>
                    <input
                      type="text"
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">System Email</label>
                    <input
                      type="email"
                      value={systemEmail}
                      onChange={(e) => setSystemEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <div>
                        <span className="block text-xs font-bold text-slate-900">Enable Registration</span>
                        <span className="text-[11px] text-slate-500">Allow new user registration</span>
                      </div>
                      <input type="checkbox" checked={enableRegistration} onChange={() => setEnableRegistration(!enableRegistration)} className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                    </label>
                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <div>
                        <span className="block text-xs font-bold text-slate-900">Maintenance Mode</span>
                        <span className="text-[11px] text-slate-500">Temporarily restrict non-admin access</span>
                      </div>
                      <input type="checkbox" checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer">Save Changes</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 py-8 text-center">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">{settingsSidebarTab} Configuration</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">Manage settings for {settingsSidebarTab.toLowerCase()}. All settings update live in the application.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add New User</h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter secure password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUserObj && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Edit User: {editUserObj.name}</h3>
              <button onClick={() => setEditUserObj(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUserObj(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmationUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-slate-900">Delete Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete the account for <strong className="text-slate-800">{deleteConfirmationUser.name}</strong>? This action is irreversible.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmationUser(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetUser = deleteConfirmationUser;
                  setDeleteConfirmationUser(null);
                  try {
                    await deleteUserByAdmin(targetUser.id);
                    showToast(`User account "${targetUser.name}" deleted.`);
                  } catch (err: any) {
                    showToast(`Error deleting user: ${err.message || 'Failed'}`);
                  }
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {viewUserObj && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <img src={viewUserObj.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} alt="" className="w-12 h-12 rounded-2xl object-cover border" />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{viewUserObj.name}</h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${viewUserObj.role === 'doctor' ? 'bg-blue-50 text-blue-700' : viewUserObj.role === 'patient' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {viewUserObj.role}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewUserObj(null)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Email</span>
                <span className="font-semibold text-slate-800 break-all">{viewUserObj.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                <span className="font-semibold text-slate-800">{viewUserObj.phone || '+91 98765 43210'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Department</span>
                <span className="font-semibold text-slate-800">{viewUserObj.specialization || (viewUserObj.role === 'doctor' ? 'Cardiology' : 'General')}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Account Status</span>
                <span className="font-extrabold text-emerald-600">Active</span>
              </div>
              
              {viewUserObj.role === 'doctor' && (
                <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 col-span-2">
                  <span className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider mb-1">Doctor Security Password</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black tracking-widest text-blue-900 bg-white/80 px-2.5 py-1 rounded-lg border border-blue-100/60 inline-block select-all">
                      {viewUserObj.password || 'password123'}
                    </span>
                    <span className="text-[9px] text-blue-500 font-semibold italic">🔒 View-Only for Administrator</span>
                  </div>
                  <p className="text-[10px] text-blue-400/90 mt-1.5 leading-relaxed font-semibold">Only the doctor can change their password from their portal settings.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewUserObj(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE APPOINTMENT MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Schedule New Appointment</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
                <select
                  value={schedPatientId}
                  onChange={(e) => setSchedPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {patients.length === 0 ? (
                    <option value="">No registered patients available</option>
                  ) : (
                    patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Doctor *</label>
                <select
                  value={schedDoctorId}
                  onChange={(e) => setSchedDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {doctors.length === 0 ? (
                    <option value="">No registered doctors available</option>
                  ) : (
                    doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.specialization || 'Cardiology'}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Date</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Past dates blocked</span>
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIsoString()}
                  value={schedDateIso}
                  onChange={(e) => {
                    const iso = e.target.value;
                    if (!isPastDate(iso)) {
                      setSchedDateIso(iso);
                      setSchedDate(formatDateForDisplay(iso));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Time Slot</span>
                  <span className="text-[10px] text-slate-400 font-bold">Past times blocked</span>
                </label>
                <select
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'].map(t => {
                    const isPast = isTimeSlotPast(schedDateIso, t);
                    return (
                      <option key={t} value={t} disabled={isPast}>
                        {t} {isPast ? ' • (Past Time Slot)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {showRescheduleModal && selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Reschedule Appointment</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>New Date</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Past dates blocked</span>
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIsoString()}
                  value={schedDateIso}
                  onChange={(e) => {
                    const iso = e.target.value;
                    if (!isPastDate(iso)) {
                      setSchedDateIso(iso);
                      setSchedDate(formatDateForDisplay(iso));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>New Time Slot</span>
                  <span className="text-[10px] text-slate-400 font-bold">Past times blocked</span>
                </label>
                <select
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {['09:00 AM', '10:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'].map(t => {
                    const isPast = isTimeSlotPast(schedDateIso, t);
                    return (
                      <option key={t} value={t} disabled={isPast}>
                        {t} {isPast ? ' • (Past Time Slot)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Confirm Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT ANALYTICS REPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-xl w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">MediCare Analytics Report</h3>
                  <p className="text-xs text-slate-500 font-medium">Generated from real-time database records</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 text-emerald-400 p-5 rounded-2xl font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto border border-slate-800 shadow-inner">
              {exportReportContent}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {copiedReport ? '✓ Copied to clipboard!' : 'File downloaded to your device.'}
              </span>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(exportReportContent);
                    setCopiedReport(true);
                    showToast('Report copied to clipboard!');
                    setTimeout(() => setCopiedReport(false), 2500);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedReport ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([exportReportContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'MediCare_Analytics_Report.txt';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    showToast('Report file downloaded!');
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
