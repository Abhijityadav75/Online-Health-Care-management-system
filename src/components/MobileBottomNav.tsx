import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Calendar, FileText, User as UserIcon, Users, Settings, MoreHorizontal } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { currentUser, currentScreen, setCurrentScreen, adminActiveTab, setAdminActiveTab, toggleSidebar } = useApp();

  if (currentUser?.role === 'admin' || currentScreen.startsWith('admin-')) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 py-2.5 px-4 flex justify-between items-center shadow-lg">
        <button
          onClick={() => { setAdminActiveTab('Dashboard'); setCurrentScreen('admin-dashboard'); }}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'admin-dashboard' && adminActiveTab === 'Dashboard' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </button>
        <button
          onClick={() => { setAdminActiveTab('Users'); setCurrentScreen('admin-users'); }}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'admin-users' || adminActiveTab === 'Users' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Users</span>
        </button>
        <button
          onClick={() => { setAdminActiveTab('Appointments'); setCurrentScreen('admin-appointments'); }}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'admin-appointments' || adminActiveTab === 'Appointments' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Appointments</span>
        </button>
        <button
          onClick={() => setCurrentScreen('settings')}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'settings' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center space-y-1 text-slate-500"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    );
  }

  if (currentUser?.role === 'doctor') {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 py-2 px-4 flex justify-between items-center shadow-lg">
        <button
          onClick={() => setCurrentScreen('doctor-dashboard')}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'doctor-dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button
          onClick={() => setCurrentScreen('doctor-appointments')}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'doctor-appointments' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Appointments</span>
        </button>
        <button
          onClick={() => setCurrentScreen('doctor-patients')}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'doctor-patients' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Patients</span>
        </button>
        <button
          onClick={() => setCurrentScreen('doctor-calendar')}
          className={`flex flex-col items-center space-y-1 ${currentScreen === 'doctor-calendar' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
        </button>
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center space-y-1 text-slate-500"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'patient') return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 py-2 px-6 flex justify-between items-center shadow-lg">
      <button
        onClick={() => setCurrentScreen('patient-dashboard')}
        className={`flex flex-col items-center space-y-1 ${currentScreen === 'patient-dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Home</span>
      </button>
      <button
        onClick={() => setCurrentScreen('patient-appointments')}
        className={`flex flex-col items-center space-y-1 ${currentScreen === 'patient-appointments' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Appointments</span>
      </button>
      <button
        onClick={() => setCurrentScreen('patient-records')}
        className={`flex flex-col items-center space-y-1 ${currentScreen === 'patient-records' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
      >
        <FileText className="w-5 h-5" />
        <span className="text-[10px] font-semibold">History</span>
      </button>
      <button
        onClick={() => setCurrentScreen('patient-profile')}
        className={`flex flex-col items-center space-y-1 ${currentScreen === 'patient-profile' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px] font-semibold">Profile</span>
      </button>
    </div>
  );
};
