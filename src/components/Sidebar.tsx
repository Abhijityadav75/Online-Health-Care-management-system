import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, Calendar, FileText, User as UserIcon, Bell, Settings, 
  Users, Stethoscope, FileBarChart, X, Heart, Home, 
  Info, Briefcase, Phone, LogOut, Clock 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser, currentScreen, setCurrentScreen, sidebarOpen, toggleSidebar, logout, adminActiveTab, setAdminActiveTab } = useApp();

  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={toggleSidebar}
      ></div>

      {/* Slide-out Sidebar Drawer from Left to Right */}
      <div className="absolute inset-y-0 left-0 max-w-full flex pr-12 sm:pr-20">
        <div className="w-72 sm:w-80 bg-white shadow-2xl border-r border-slate-200 flex flex-col z-10 h-full animate-in slide-in-from-left duration-300">
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setCurrentScreen(currentUser ? `${currentUser.role}-dashboard` : 'landing'); toggleSidebar(); }}>
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-xl font-extrabold text-slate-900">Medi<span className="text-blue-600">Care</span></span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-white">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-2">
              {!currentUser ? 'Navigation Menu' : currentUser.role === 'patient' ? 'Patient Portal' : currentUser.role === 'doctor' ? 'Doctor Portal' : 'ADMIN PORTAL'}
            </p>

            {!currentUser ? (
              <>
                <button
                  onClick={() => { setCurrentScreen('landing'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                >
                  <Home className="w-4.5 h-4.5 text-blue-600" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('about'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                >
                  <Info className="w-4.5 h-4.5 text-blue-600" />
                  <span>About MediCare</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('services'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                >
                  <Briefcase className="w-4.5 h-4.5 text-blue-600" />
                  <span>Services</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('doctors'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                >
                  <Stethoscope className="w-4.5 h-4.5 text-blue-600" />
                  <span>Doctors</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('contact'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer"
                >
                  <Phone className="w-4.5 h-4.5 text-blue-600" />
                  <span>Contact</span>
                </button>
                <div className="pt-4">
                  <button
                    onClick={() => { setCurrentScreen('login'); toggleSidebar(); }}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer text-center"
                  >
                    Sign In
                  </button>
                </div>
              </>
            ) : currentUser.role === 'patient' ? (
              <>
                <button
                  onClick={() => { setCurrentScreen('patient-dashboard'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'patient-dashboard' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('doctors'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'doctors' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Stethoscope className="w-4.5 h-4.5" />
                  <span>Doctors</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('patient-book'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'patient-book' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>Book Appointment</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('patient-appointments'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'patient-appointments' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>My Appointments</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('patient-records'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'patient-records' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <FileText className="w-4.5 h-4.5" />
                  <span>Medical Records</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('notifications'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'notifications' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Bell className="w-4.5 h-4.5" />
                  <span>Notifications & Feedback</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('patient-profile'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'patient-profile' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <UserIcon className="w-4.5 h-4.5" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('settings'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'settings' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Settings className="w-4.5 h-4.5" />
                  <span>Settings</span>
                </button>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => { logout(); toggleSidebar(); }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : currentUser.role === 'doctor' ? (
              <>
                <button
                  onClick={() => { setCurrentScreen('doctor-dashboard'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'doctor-dashboard' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('doctor-appointments'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'doctor-appointments' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>Appointments</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('doctor-calendar'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'doctor-calendar' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>Calendar</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('doctor-patients'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'doctor-patients' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Users className="w-4.5 h-4.5" />
                  <span>Patients</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('patient-record-detail'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'patient-record-detail' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <FileText className="w-4.5 h-4.5" />
                  <span>Patient Records</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('doctor-availability'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'doctor-availability' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Clock className="w-4.5 h-4.5" />
                  <span>Availability & Slots</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('notifications'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition duration-200 cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  <span>Notifications</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('settings'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition duration-200 cursor-pointer"
                >
                  <Settings className="w-4.5 h-4.5" />
                  <span>Settings</span>
                </button>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => { logout(); toggleSidebar(); }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAdminActiveTab('Dashboard'); setCurrentScreen('admin-dashboard'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'admin-dashboard' && adminActiveTab === 'Dashboard' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                  <span>System Overview</span>
                </button>
                <button
                  onClick={() => { setAdminActiveTab('Users'); setCurrentScreen('admin-users'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'admin-users' || (currentScreen === 'admin-dashboard' && adminActiveTab === 'Users') ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Users className="w-4.5 h-4.5" />
                  <span>Manage Users</span>
                </button>
                <button
                  onClick={() => { setAdminActiveTab('Appointments'); setCurrentScreen('admin-appointments'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'admin-appointments' || (currentScreen === 'admin-dashboard' && adminActiveTab === 'Appointments') ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>Appointments</span>
                </button>
                <button
                  onClick={() => { setAdminActiveTab('Analytics'); setCurrentScreen('admin-dashboard'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'admin-dashboard' && adminActiveTab === 'Analytics' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <FileBarChart className="w-4.5 h-4.5" />
                  <span>Reports & Analytics</span>
                </button>
                <button
                  onClick={() => { setCurrentScreen('settings'); toggleSidebar(); }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer ${currentScreen === 'settings' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                  <Settings className="w-4.5 h-4.5" />
                  <span>System Settings</span>
                </button>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => { logout(); toggleSidebar(); }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
