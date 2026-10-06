import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Users, Stethoscope, Shield } from 'lucide-react';

export const ScreenReferenceModal: React.FC = () => {
  const { viewScreenReferenceModal, setViewScreenReferenceModal, setCurrentScreen } = useApp();

  if (!viewScreenReferenceModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600 text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">System Navigation</span>
            <h3 className="font-bold text-lg">MediCare Healthcare Architecture Map</h3>
          </div>
          <button
            onClick={() => setViewScreenReferenceModal(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6 text-xs">
          <p className="text-slate-600 text-center max-w-2xl mx-auto">
            MediCare connects three core user personas (Patients, Doctors, Administrators) with comprehensive real-world healthcare workflows.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Patient Portal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-blue-600 font-bold">
                <Users className="w-4 h-4" />
                <span>Patient Portal</span>
              </div>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Dashboard & Vitals summary</li>
                <li>• Real-world Calendar Booking Wizard</li>
                <li>• Appointment management & Rescheduling</li>
                <li>• Medical Records & Consultation History</li>
                <li>• Profile & Emergency Contact settings</li>
              </ul>
              <button
                onClick={() => { setCurrentScreen('patient-dashboard'); setViewScreenReferenceModal(false); }}
                className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold transition cursor-pointer"
              >
                Go to Patient Portal
              </button>
            </div>

            {/* Doctor Portal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-purple-600 font-bold">
                <Stethoscope className="w-4 h-4" />
                <span>Doctor Portal</span>
              </div>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Daily schedule & queue metrics</li>
                <li>• Appointments with Start Consultation modal</li>
                <li>• Interactive weekly calendar with availability</li>
                <li>• Patient Directory & Full EHR Medical Records</li>
                <li>• Working hours, break times & leave configuration</li>
              </ul>
              <button
                onClick={() => { setCurrentScreen('doctor-dashboard'); setViewScreenReferenceModal(false); }}
                className="w-full py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold transition cursor-pointer"
              >
                Go to Doctor Portal
              </button>
            </div>

            {/* Admin Portal */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold">
                <Shield className="w-4 h-4" />
                <span>Admin Portal</span>
              </div>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Executive dashboard with KPIs & metrics</li>
                <li>• Manage Users (Add, Edit, Delete, Filter)</li>
                <li>• Doctor Credentialing & Approval workflow</li>
                <li>• Hospital-wide Appointment Scheduling</li>
                <li>• Analytics & Reports export</li>
                <li>• System configuration, security & maintenance</li>
              </ul>
              <button
                onClick={() => { setCurrentScreen('admin-dashboard'); setViewScreenReferenceModal(false); }}
                className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition cursor-pointer"
              >
                Go to Admin Portal
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>MediCare Healthcare Platform</span>
          <button
            onClick={() => setViewScreenReferenceModal(false)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
