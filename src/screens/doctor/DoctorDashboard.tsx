import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { formatDoctorName, isTodayDate, formatDateForDisplay, getTodayIsoString } from '../../utils/dateUtils';
import { Calendar, Clock, CheckCircle2, Stethoscope, TrendingUp, MoreVertical, Building2, ShieldCheck } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { currentUser, appointments, users, addMedicalRecord, updateAppointmentStatus, setCurrentScreen } = useApp();
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [activeAptId, setActiveAptId] = useState<string | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('Clinical evaluation completed. Vitals stable. Rest recommended for 3 days.');
  const [diagnosis, setDiagnosis] = useState('Viral flu / seasonal infection');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const currentDoctorId = currentUser?.id;
  const doctorAppointments = currentDoctorId ? appointments.filter(apt => apt.doctorId === currentDoctorId) : [];

  const todayAppointments = doctorAppointments.filter(apt => isTodayDate(apt.date));
  const upcomingAppointmentsList = doctorAppointments.filter(apt => !isTodayDate(apt.date) && (apt.status === 'Upcoming' || apt.status === 'Pending'));

  const scheduleItems = todayAppointments.map((apt) => {
    const patientUser = users.find(u => u.id === apt.patientId || u.name.toLowerCase() === apt.patientName.toLowerCase());
    return {
      id: apt.id,
      appointment: apt,
      time: apt.time,
      date: apt.date,
      name: apt.patientName,
      age: patientUser?.dob ? `${Math.max(18, new Date().getFullYear() - parseInt(patientUser.dob.slice(-4) || '1995'))} yrs` : '31 yrs',
      type: `${apt.type || 'Consultation'} • ${apt.reason || 'Checkup'}`,
      status: apt.status,
      avatar: patientUser?.avatar || (apt.patientName.toLowerCase().includes('john') ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150')
    };
  });

  const upcomingItems = upcomingAppointmentsList.map((apt) => {
    const patientUser = users.find(u => u.id === apt.patientId || u.name.toLowerCase() === apt.patientName.toLowerCase());
    return {
      id: apt.id,
      appointment: apt,
      time: `${apt.date} • ${apt.time}`,
      name: apt.patientName,
      age: patientUser?.dob ? `${Math.max(18, new Date().getFullYear() - parseInt(patientUser.dob.slice(-4) || '1995'))} yrs` : '31 yrs',
      type: apt.reason || 'General Consultation',
      tag: apt.type || 'In-clinic',
      avatar: patientUser?.avatar || (apt.patientName.toLowerCase().includes('john') ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150')
    };
  });

  const handleStartConsultation = (aptId: string) => {
    setActiveAptId(aptId);
    setShowConsultModal(true);
  };

  const handleSaveConsultation = async () => {
    if (!activeAptId || !currentUser) return;
    const apt = appointments.find(a => a.id === activeAptId);
    if (!apt) return;

    try {
      await addMedicalRecord({
        patientId: apt.patientId,
        date: '28 Sep 2026',
        type: 'Consultation',
        doctorName: currentUser.name,
        description: diagnosis || 'Clinical Consultation',
        details: clinicalNotes || 'Clinical examination conducted. Vitals recorded.'
      });
      await updateAppointmentStatus(activeAptId, 'Completed');
      setShowConsultModal(false);
      showToast('Consultation completed and clinical record saved successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to complete consultation.');
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 min-h-screen">
      {/* Top Header Bar */}
      <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-xs">Registered Physician</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Hello, {currentUser ? formatDoctorName(currentUser.name) : 'Dr. Priya Gupta'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            {currentUser?.specialization || 'Dermatologist'} • MediCare Clinic & Medical Center
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end relative z-10">
          <div className="flex items-center space-x-2.5 px-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{formatDateForDisplay(getTodayIsoString())}</span>
          </div>
          <div className="flex items-center space-x-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl text-xs font-bold text-blue-700 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>MediCare Clinic</span>
          </div>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div onClick={() => setCurrentScreen('doctor-appointments')} className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md transition duration-300 flex items-center space-x-4 group cursor-pointer">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-purple-500/20 group-hover:scale-105 transition duration-300">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{doctorAppointments.length}</span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Total Appointments</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md transition duration-300 flex items-center space-x-4 group">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition duration-300">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {doctorAppointments.filter(a => a.status === 'Upcoming' || a.status === 'Pending').length}
            </span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Active / Upcoming</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md transition duration-300 flex items-center space-x-4 group">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition duration-300">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {doctorAppointments.filter(a => a.status === 'Completed').length}
            </span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Completed</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 hover:shadow-md transition duration-300 flex items-center space-x-4 group">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition duration-300">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {doctorAppointments.length > 0 ? `${Math.round((doctorAppointments.filter(a => a.status === 'Completed').length / doctorAppointments.length) * 100)}%` : '0%'}
            </span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Completion Rate</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Today's Schedule */}
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Today's Schedule</span>
            </h3>
            <button onClick={() => setCurrentScreen('doctor-calendar')} className="text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl transition">
              View Calendar
            </button>
          </div>

          <div className="space-y-3">
            {scheduleItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold text-xs">No appointments scheduled for today.</div>
            ) : (
              scheduleItems.map((item, idx) => (
                <div key={item.id || idx} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 flex items-center justify-between hover:bg-white hover:shadow-sm hover:border-blue-200 transition duration-200">
                  <div className="flex items-center space-x-3.5">
                    <div className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      <div>{item.time}</div>
                      {item.date && <div className="text-[9px] font-semibold opacity-80">{item.date}</div>}
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <img src={item.avatar} alt={item.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{item.name} <span className="text-[10px] font-bold text-slate-400">({item.age})</span></h4>
                        <p className="text-[11px] font-medium text-slate-500 truncate max-w-[160px]">{item.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                      {item.status}
                    </span>
                    <button onClick={() => handleStartConsultation(item.id)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" title="Start Consultation">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Upcoming Appointments */}
        <div className="lg:col-span-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Upcoming Appointments</span>
            </h3>
            <button onClick={() => setCurrentScreen('doctor-appointments')} className="text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl transition">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {upcomingItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 font-bold text-xs">No upcoming appointments found.</div>
            ) : (
              upcomingItems.map((item, idx) => (
                <div key={item.id || idx} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 flex items-center justify-between hover:bg-white hover:shadow-sm hover:border-purple-200 transition duration-200">
                  <div className="flex items-center space-x-3">
                    <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{item.name} <span className="text-[10px] font-bold text-slate-400">({item.age})</span></h4>
                      <p className="text-[11px] font-medium text-slate-500">{item.time}</p>
                      <p className="text-[10px] text-slate-400">{item.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1.5">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {item.tag}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => { setActiveAptId(item.id); setShowConsultModal(true); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Start Consultation & Medical Notes Modal */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-lg text-slate-900">Consultation & Clinical Notes</h3>
            <p className="text-xs text-slate-500">Record clinical assessment and consultation notes for the patient record.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Diagnosis / Summary</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes & Recommendations</label>
                <textarea
                  rows={4}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => setShowConsultModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConsultation}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-blue-700 transition"
              >
                Save Record & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
