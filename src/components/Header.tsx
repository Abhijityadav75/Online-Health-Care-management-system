import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDoctorName } from '../utils/dateUtils';
import { Activity, Heart, User as UserIcon, LogOut, Settings, LayoutDashboard, Calendar, ChevronDown, Menu, X, Bell, Users } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, logout, currentScreen, setCurrentScreen, sidebarOpen, toggleSidebar, adminActiveTab, setAdminActiveTab, notifications } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);

  const effectiveUserId = currentUser ? currentUser.id : (currentScreen.startsWith('doctor-') ? 'd-3' : null);
  const unreadCount = effectiveUserId
    ? notifications.filter(n => n.userId === effectiveUserId && !n.read).length
    : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs w-full">
      <div className="w-full px-3 sm:px-8 lg:px-16 h-20 flex items-center justify-between">
        {/* Left: 3-Bar Menu Icon & Logo */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          <button
            onClick={toggleSidebar}
            aria-label="Open navigation menu"
            className="p-2 sm:p-2.5 rounded-2xl text-slate-700 hover:bg-slate-100 transition duration-200 cursor-pointer border border-slate-200/60 shadow-2xs shrink-0"
            title="Menu"
          >
            {sidebarOpen ? <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" /> : <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-700" />}
          </button>
          
          <div className="flex items-center space-x-2.5 cursor-pointer group shrink-0" onClick={() => setCurrentScreen(currentUser ? `${currentUser.role}-dashboard` : 'landing')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-md relative group-hover:scale-105 transition duration-200 shrink-0">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white" />
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute text-cyan-200 animate-pulse" />
            </div>
            <div className="hidden xs:block sm:block">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Medi<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Care</span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links (Guest) */}
        {!currentUser && (
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <div className="relative py-2">
              <button onClick={() => setCurrentScreen('landing')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'landing' ? 'text-blue-600 font-extrabold' : ''}`}>Home</button>
              {currentScreen === 'landing' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"></span>}
            </div>
            <div className="relative py-2">
              <button onClick={() => setCurrentScreen('about')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'about' ? 'text-blue-600 font-extrabold' : ''}`}>About</button>
              {currentScreen === 'about' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"></span>}
            </div>
            <div className="relative py-2">
              <button onClick={() => setCurrentScreen('services')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'services' ? 'text-blue-600 font-extrabold' : ''}`}>Services</button>
              {currentScreen === 'services' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"></span>}
            </div>
            <div className="relative py-2">
              <button onClick={() => setCurrentScreen('doctors')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'doctors' ? 'text-blue-600 font-extrabold' : ''}`}>Doctors</button>
              {currentScreen === 'doctors' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"></span>}
            </div>
            <div className="relative py-2">
              <button onClick={() => setCurrentScreen('contact')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'contact' ? 'text-blue-600 font-extrabold' : ''}`}>Contact</button>
              {currentScreen === 'contact' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"></span>}
            </div>
          </nav>
        )}

        {/* Desktop Navigation Links (Patient) */}
        {currentUser?.role === 'patient' && !currentScreen.startsWith('admin-') && (
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
            <button onClick={() => setCurrentScreen('patient-dashboard')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'patient-dashboard' ? 'text-blue-600 font-extrabold' : ''}`}>Dashboard</button>
            <button onClick={() => setCurrentScreen('doctors')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'doctors' ? 'text-blue-600 font-extrabold' : ''}`}>Doctors</button>
            <button onClick={() => setCurrentScreen('patient-book')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'patient-book' ? 'text-blue-600 font-extrabold' : ''}`}>Book Appointment</button>
            <button onClick={() => setCurrentScreen('patient-appointments')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'patient-appointments' ? 'text-blue-600 font-extrabold' : ''}`}>Appointments</button>
            <button onClick={() => setCurrentScreen('patient-records')} className={`hover:text-blue-600 transition cursor-pointer ${currentScreen === 'patient-records' ? 'text-blue-600 font-extrabold' : ''}`}>Medical History</button>
          </nav>
        )}


        {/* Desktop Navigation Links (Admin) */}
        {(currentUser?.role === 'admin' || currentScreen.startsWith('admin-')) && (
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => { setAdminActiveTab('Dashboard'); setCurrentScreen('admin-dashboard'); }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${currentScreen === 'admin-dashboard' && adminActiveTab === 'Dashboard' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>System Overview</span>
            </button>
            <button
              onClick={() => { setAdminActiveTab('Users'); setCurrentScreen('admin-users'); }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${currentScreen === 'admin-users' || (currentScreen === 'admin-dashboard' && adminActiveTab === 'Users') ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Users</span>
            </button>
            <button
              onClick={() => { setAdminActiveTab('Appointments'); setCurrentScreen('admin-appointments'); }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${currentScreen === 'admin-appointments' || (currentScreen === 'admin-dashboard' && adminActiveTab === 'Appointments') ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointments</span>
            </button>
            <button
              onClick={() => { setAdminActiveTab('Analytics'); setCurrentScreen('admin-dashboard'); }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${currentScreen === 'admin-dashboard' && adminActiveTab === 'Analytics' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Analytics & Reports</span>
            </button>
            <button
              onClick={() => { setCurrentScreen('settings'); }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${currentScreen === 'settings' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>
        )}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {(currentUser || currentScreen.startsWith('doctor-')) && (
            <button
              onClick={() => setCurrentScreen('notifications')}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition relative border border-slate-200/80 shadow-2xs cursor-pointer group shrink-0"
              title="Notifications & Feedback"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-600 group-hover:text-blue-600 transition duration-200" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white animate-pulse"></span>
              )}
            </button>
          )}

          {/* Auth Button or User Profile Dropdown */}
          {!currentUser ? (
            <button
              onClick={() => setCurrentScreen('login')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-blue-500/25 transition duration-200 whitespace-nowrap cursor-pointer"
            >
              Sign In
            </button>
          ) : (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 pr-2 sm:pr-3 rounded-2xl hover:bg-slate-100 transition border border-slate-200/80 bg-white shadow-2xs cursor-pointer"
              >
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                  alt={currentUser.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                />
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-extrabold text-slate-900">{currentUser.role === 'doctor' ? formatDoctorName(currentUser.name) : currentUser.name}</span>
                  <span className="block text-[10px] font-bold text-blue-600 capitalize">{currentUser.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
              </button>

              {/* Profile Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-3 w-56 sm:w-60 bg-white rounded-3xl shadow-2xl border border-slate-200/80 py-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-1.5rem)]">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{currentUser.role === 'doctor' ? formatDoctorName(currentUser.name) : currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setCurrentScreen(currentUser.role === 'patient' ? 'patient-profile' : 'settings'); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => { setCurrentScreen('notifications'); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Notifications & Feedback</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => { logout(); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
