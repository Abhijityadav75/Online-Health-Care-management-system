import React from 'react';
import { useApp } from '../context/AppContext';
import { Heart, Mail, MapPin, Shield, Clock, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentScreen, currentUser, currentScreen } = useApp();

  if (currentUser) {
    return null;
  }

  const isAuthScreen = 
    currentScreen === 'login' || 
    currentScreen === 'register' ||
    currentScreen === 'signin' ||
    currentScreen === 'signup' ||
    (!currentUser && (
      currentScreen.startsWith('patient-') ||
      currentScreen.startsWith('doctor-') ||
      currentScreen.startsWith('admin-') ||
      currentScreen === 'settings' ||
      currentScreen === 'notifications'
    )) ||
    (typeof window !== 'undefined' && (
      window.location.pathname === '/signin' ||
      window.location.pathname === '/signup'
    ));

  if (isAuthScreen) {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs">
          {/* Col 1: Project Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Medi<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Care</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              MediCare is an online healthcare management system project connecting patients, doctors, and administrators with structured appointment scheduling, consultation management, and medical records.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Role-Based Access (RBAC)</span>
              </span>
              <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Healthcare System Project</span>
              </span>
            </div>
          </div>

          {/* Col 2: Clinical Specialties */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">Specialties</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setCurrentScreen('doctors')} className="hover:text-blue-400 transition cursor-pointer">Cardiology</button></li>
              <li><button onClick={() => setCurrentScreen('doctors')} className="hover:text-blue-400 transition cursor-pointer">General Medicine</button></li>
              <li><button onClick={() => setCurrentScreen('doctors')} className="hover:text-blue-400 transition cursor-pointer">Dermatology</button></li>
              <li><button onClick={() => setCurrentScreen('doctors')} className="hover:text-blue-400 transition cursor-pointer">Orthopedics</button></li>
              <li><button onClick={() => setCurrentScreen('services')} className="hover:text-blue-400 transition cursor-pointer">Follow-up Consultations</button></li>
            </ul>
          </div>

          {/* Col 3: Portals & Navigation */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">Quick Navigation</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><button onClick={() => setCurrentScreen('landing')} className="hover:text-blue-400 transition cursor-pointer">Home</button></li>
              <li><button onClick={() => setCurrentScreen('about')} className="hover:text-blue-400 transition cursor-pointer">About MediCare</button></li>
              <li><button onClick={() => setCurrentScreen('doctors')} className="hover:text-blue-400 transition cursor-pointer">Doctor Directory</button></li>
              <li><button onClick={() => setCurrentScreen('login')} className="hover:text-blue-400 transition cursor-pointer">Patient Portal</button></li>
              <li><button onClick={() => setCurrentScreen('contact')} className="hover:text-blue-400 transition cursor-pointer">Contact & Support</button></li>
            </ul>
          </div>

          {/* Col 4: Contact Center */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">Contact & Project</h4>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>123 Healthcare Avenue, Connaught Place, New Delhi - 110001</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>support@medicare.local</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Digital Portal & Appointment Booking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 MediCare Online Healthcare Management System. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setCurrentScreen('about')}>Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setCurrentScreen('about')}>Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => setCurrentScreen('about')}>System Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
