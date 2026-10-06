import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, FileText, Stethoscope, Users, Shield, Bell, ArrowRight } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { setCurrentScreen, currentUser } = useApp();

  const servicesList = [
    {
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      title: 'Appointment Management',
      desc: 'Complete appointment lifecycle: book consultations, view upcoming schedules, manage status, reschedule, or cancel anytime.',
      action: () => setCurrentScreen(currentUser ? 'patient-appointments' : 'login')
    },
    {
      icon: <FileText className="w-6 h-6 text-cyan-600" />,
      title: 'Medical Records',
      desc: 'Centralized repository of clinical notes, consultation summaries, and health history accessible on demand.',
      action: () => setCurrentScreen(currentUser ? 'patient-records' : 'login')
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      title: 'Patient Portal',
      desc: 'Personal health portal to manage profiles, view appointments, track consultation status, and view medical history.',
      action: () => setCurrentScreen(currentUser ? 'patient-dashboard' : 'login')
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-600" />,
      title: 'Doctor Portal & Availability',
      desc: 'Specialist clinical hub to manage working days, break intervals, block dates, review appointment requests, and view patient records.',
      action: () => setCurrentScreen(currentUser ? 'doctor-dashboard' : 'login')
    },
    {
      icon: <Bell className="w-6 h-6 text-amber-600" />,
      title: 'In-App Notifications & Alerts',
      desc: 'Instant alerts for booking confirmations, doctor status changes, schedule reminders, and appointment cancellations.',
      action: () => setCurrentScreen(currentUser ? 'notifications' : 'login')
    },
    {
      icon: <Stethoscope className="w-6 h-6 text-indigo-600" />,
      title: 'Doctor Directory & Booking',
      desc: 'Browse registered medical specialists, inspect experience and consultation fees, and carry your selected doctor directly into booking.',
      action: () => setCurrentScreen('doctors')
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8 lg:px-12">
      <div className="w-full space-y-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <span>Healthcare Management Features</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            Our System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Services</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Discover digital healthcare tools designed to empower patients, streamline clinical workflows for doctors, and manage scheduling.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service, idx) => (
            <div key={idx} className="bg-white p-7 rounded-3xl shadow-md border border-slate-100 flex flex-col justify-between space-y-6 hover:shadow-xl transition group">
              <div className="space-y-4">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition">
                  {service.icon}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{service.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{service.desc}</p>
              </div>
              <button
                onClick={service.action}
                className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 pt-2 cursor-pointer group-hover:translate-x-1 transition"
              >
                <span>Access Service</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-extrabold">Ready to explore MediCare?</h3>
            <p className="text-blue-100 text-xs sm:text-sm">Sign in today to access your personalized dashboard and book appointments.</p>
          </div>
          <button
            onClick={() => setCurrentScreen('login')}
            className="px-8 py-3.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-sm shadow-xl transition whitespace-nowrap cursor-pointer"
          >
            Sign In / Get Started
          </button>
        </div>
      </div>
    </div>
  );
};
