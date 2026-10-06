import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Lock, Stethoscope, CheckCircle2, Users, Heart, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8 lg:px-12">
      <div className="w-full space-y-12 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Healthcare Management System Project</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">MediCare</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            MediCare is an online healthcare management system project designed to demonstrate a structured, role-based platform connecting patients, medical doctors, and administrators with appointment booking, clinical consultation workflows, and medical records management.
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Our Mission</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              To demonstrate an efficient, accessible, and transparent digital healthcare platform that simplifies appointment booking, prevents scheduling conflicts with calendar validation, and enables clear communication between patients and practitioners.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">Our Vision</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              To build a cohesive software model for healthcare management where digital self-service tools empower patients, doctors retain complete control over working schedules, and administrators maintain operational visibility.
            </p>
          </div>
        </div>

        {/* What MediCare Provides: Patient, Doctor, Administrator */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900">Role-Based System Architecture</h2>
            <p className="text-slate-600 text-sm mt-2">Tailored interfaces and workflows designed for each key user role.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Patient Portal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Search doctors by name or specialty, book upcoming slots with real-world calendar validation, reschedule or cancel visits, and view medical records.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Doctor Portal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manage weekly consultation hours, break times, and date leaves, view upcoming patient queues, and record clinical consultation notes.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Administrator Portal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verify and approve doctor registration requests, manage user accounts, oversee hospital appointment volume, and monitor platform health.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Access Control Explanation (Neutral Project Language) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-2xl">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">System Security</span>
            <h3 className="text-3xl font-extrabold tracking-tight">Security & Access Control Architecture</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              MediCare implements strict Role-Based Access Control (RBAC) to maintain separation of concerns. Patient records are accessible only to the authenticated patient and authorized attending physicians, doctor schedule modifications require verified doctor sessions, and administrative privileges are isolated.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Role-Based Access Control (RBAC)</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Client & Session State Validation</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Doctor Application Verification</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Past Date & Slot Collision Protection</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 text-center space-y-4 max-w-xs w-full">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-lg">Protected Access</h4>
              <p className="text-xs text-slate-300">Protected user sessions and role validation ensure patient privacy throughout the application.</p>
              <button
                onClick={() => setCurrentScreen('login')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 transition cursor-pointer"
              >
                Sign In / Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
