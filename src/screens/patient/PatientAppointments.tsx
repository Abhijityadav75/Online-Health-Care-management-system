import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { appointmentApi } from '../../api/appointmentApi';
import { Calendar, Clock, MapPin, XCircle, RefreshCw, CheckCircle2, Plus, AlertCircle, Info, Stethoscope, CalendarDays, ArrowLeft } from 'lucide-react';
import { 
  getTodayIsoString, 
  getInitialBookingDate, 
  formatDateForDisplay, 
  isPastDate, 
  isTimeSlotPast, 
  getFirstAvailableSlot
} from '../../utils/dateUtils';

export const PatientAppointments: React.FC = () => {
  const { 
    currentUser, 
    users, 
    appointments, 
    refreshPatientAppointments, 
    setCurrentScreen,
    goBack,
    startBookingWithDoctor
  } = useApp();

  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Cancelled'>('Upcoming');
  
  // Modals state
  const [detailsAppointmentId, setDetailsAppointmentId] = useState<string | null>(null);
  const [cancelConfirmAppointmentId, setCancelConfirmAppointmentId] = useState<string | null>(null);
  const [rescheduleModalId, setRescheduleModalId] = useState<string | null>(null);
  const [doctorProfileModalId, setDoctorProfileModalId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const initialReschedule = getInitialBookingDate();
  const [newDateIso, setNewDateIso] = useState(initialReschedule.iso);
  const [newDate, setNewDate] = useState(initialReschedule.display);
  const [newTime, setNewTime] = useState('11:00 AM');
  const [rescheduleError, setRescheduleError] = useState('');

  const rescheduleSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const userAppointments = appointments.filter(a => !currentUser || a.patientId === currentUser.id);

  const upcomingCount = userAppointments.filter(a => a.status === 'Upcoming').length;
  const pastCount = userAppointments.filter(a => a.status === 'Completed').length;
  const cancelledCount = userAppointments.filter(a => a.status === 'Cancelled').length;

  const filteredAppointments = userAppointments.filter(a => {
    if (activeTab === 'Upcoming') return a.status === 'Upcoming';
    if (activeTab === 'Past') return a.status === 'Completed';
    if (activeTab === 'Cancelled') return a.status === 'Cancelled';
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRescheduleDateChange = (isoDate: string) => {
    if (!isoDate) return;
    if (isPastDate(isoDate)) {
      setRescheduleError('Cannot select a past date on the calendar.');
      return;
    }
    setRescheduleError('');
    setNewDateIso(isoDate);
    setNewDate(formatDateForDisplay(isoDate));

    if (isTimeSlotPast(isoDate, newTime)) {
      const next = getFirstAvailableSlot(isoDate, rescheduleSlots);
      if (next) {
        setNewTime(next);
      }
    }
  };

  const handleCancelSubmit = async (id: string) => {
    try {
      const res = await appointmentApi.cancelAppointment(id);
      if (!res.success) {
        throw new Error(res.message || 'Failed to cancel appointment');
      }
      setCancelConfirmAppointmentId(null);
      setDetailsAppointmentId(null);
      await refreshPatientAppointments();
      showToast('Appointment cancelled successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel appointment.');
    }
  };

  const handleRescheduleSubmit = async (id: string) => {
    if (isPastDate(newDateIso)) {
      setRescheduleError('Cannot reschedule to a past date.');
      showToast('Cannot reschedule to a past date.');
      return;
    }
    if (isTimeSlotPast(newDateIso, newTime)) {
      setRescheduleError('The selected time slot has already passed for this date.');
      showToast('Cannot reschedule to a past time slot.');
      return;
    }
    setRescheduleError('');
    try {
      const res = await appointmentApi.rescheduleAppointment(id, {
        date: newDate,
        dateIso: newDateIso,
        time: newTime,
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to reschedule appointment');
      }
      setRescheduleModalId(null);
      setDetailsAppointmentId(null);
      await refreshPatientAppointments();
      showToast('Appointment rescheduled successfully.');
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule.');
      showToast(err.message || 'Failed to reschedule.');
    }
  };

  const selectedAppointment = appointments.find(a => a.id === detailsAppointmentId || a.id === cancelConfirmAppointmentId);
  const selectedDoctor = users.find(u => u.name === selectedAppointment?.doctorName);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={goBack}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs flex items-center justify-center cursor-pointer shrink-0"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Appointments</h2>
            <p className="text-sm text-slate-600 mt-1">View, manage, reschedule or cancel upcoming and past appointments.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setCurrentScreen('patient-book')}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('Upcoming')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'Upcoming' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          Upcoming ({upcomingCount})
        </button>
        <button
          onClick={() => setActiveTab('Past')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'Past' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          Past ({pastCount})
        </button>
        <button
          onClick={() => setActiveTab('Cancelled')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'Cancelled' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">No {activeTab.toLowerCase()} appointments found.</h4>
            <p className="text-xs text-slate-500">Book a consultation with registered doctors anytime.</p>
            <button
              onClick={() => setCurrentScreen('patient-book')}
              className="mt-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Book Now
            </button>
          </div>
        ) : (
          filteredAppointments.map(apt => (
            <div key={apt.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition">
              <div className="flex items-start space-x-4">
                <img
                  src={apt.doctorAvatar || "https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200"}
                  alt={apt.doctorName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-base">{apt.doctorName}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${apt.status === 'Upcoming' ? 'bg-emerald-100 text-emerald-800' : apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {apt.status === 'Cancelled' ? 'CANCELLED' : apt.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-blue-600">{apt.doctorSpecialization}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center space-x-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 mr-1" />
                      {apt.date}
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600 mr-1" />
                      {apt.time}
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{apt.type}</span>
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100">
                    <span className="font-bold text-slate-700">Reason:</span> {apt.reason}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const doc = users.find(u => u.name === apt.doctorName || u.id === apt.doctorId);
                    setDoctorProfileModalId(doc ? doc.id : 'd-1');
                  }}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Doctor Profile
                </button>
                
                <button
                  onClick={() => setDetailsAppointmentId(apt.id)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  View Details
                </button>

                {apt.status === 'Upcoming' && (
                  <>
                    <button
                      onClick={() => setRescheduleModalId(apt.id)}
                      className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                    <button
                      onClick={() => setCancelConfirmAppointmentId(apt.id)}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}

                {(apt.status === 'Cancelled' || apt.status === 'Completed') && (
                  <button
                    onClick={() => {
                      const doc = users.find(u => u.name === apt.doctorName || u.id === apt.doctorId);
                      if (doc) {
                        startBookingWithDoctor(doc.id);
                      } else {
                        setCurrentScreen('patient-book');
                      }
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Book Again
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
      {detailsAppointmentId && (() => {
        const apt = appointments.find(a => a.id === detailsAppointmentId);
        if (!apt) return null;
        const docObj = users.find(u => u.name === apt.doctorName || u.id === apt.doctorId);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">Appointment Details</h3>
                    <p className="text-xs text-slate-500">ID: {apt.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailsAppointmentId(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <img src={apt.doctorAvatar || "https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200"} alt={apt.doctorName} className="w-14 h-14 rounded-xl object-cover border" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{apt.doctorName}</h4>
                    <p className="text-xs font-semibold text-blue-600">{apt.doctorSpecialization}</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${apt.status === 'Upcoming' ? 'bg-emerald-100 text-emerald-800' : apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Appointment Date</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{apt.date}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Appointment Time</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{apt.time}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Appointment Format</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{apt.type}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Consultation Fee</span>
                    <p className="font-bold text-emerald-600 text-sm mt-0.5">₹ {docObj?.consultationFee || 700}</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Reason / Symptoms</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">{apt.reason}</p>
                </div>

                {/* Visual Status Tracker */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Tracking</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${apt.status === 'Upcoming' ? 'bg-emerald-100 text-emerald-800' : apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                      {apt.status}
                    </span>
                  </div>
                  {apt.status === 'Cancelled' ? (
                    <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs font-bold">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>This consultation was cancelled. You may select a doctor to book again.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="space-y-1">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-xs">✓</div>
                        <span className="text-[10px] font-extrabold text-slate-800 block">1. Confirmed</span>
                        <span className="text-[9px] text-emerald-600 font-bold block">Slot Reserved</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${apt.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white animate-pulse'}`}>
                          {apt.status === 'Completed' ? '✓' : '2'}
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-800 block">2. In-Clinic Visit</span>
                        <span className="text-[9px] text-blue-600 font-bold block">{apt.status === 'Completed' ? 'Attended' : 'Scheduled'}</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${apt.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {apt.status === 'Completed' ? '✓' : '3'}
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-800 block">3. Completed</span>
                        <span className={`text-[9px] font-bold block ${apt.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {apt.status === 'Completed' ? 'Record Filed' : 'Pending Visit'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setDetailsAppointmentId(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setDetailsAppointmentId(null);
                      setDoctorProfileModalId(docObj ? docObj.id : 'd-1');
                    }}
                    className="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Doctor Profile
                  </button>
                  {apt.status === 'Upcoming' && (
                    <>
                      <button
                        onClick={() => {
                          setDetailsAppointmentId(null);
                          setRescheduleModalId(apt.id);
                        }}
                        className="px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => {
                          setDetailsAppointmentId(null);
                          setCancelConfirmAppointmentId(apt.id);
                        }}
                        className="px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DOCTOR PROFILE MODAL */}
      {doctorProfileModalId && (() => {
        const doc = users.find(u => u.id === doctorProfileModalId) || users.find(u => u.role === 'doctor');
        if (!doc) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">Doctor Profile</h3>
                    <p className="text-xs text-slate-500">{doc.specialization}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDoctorProfileModalId(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <img src={doc.avatar || "https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200"} alt={doc.name} className="w-20 h-20 rounded-2xl object-cover border shadow-sm" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-base">{doc.name}</h4>
                    <p className="text-xs font-semibold text-blue-600">{doc.specialization}</p>
                    <p className="text-xs text-slate-500">{doc.qualification || 'MBBS, MD'} • {doc.experience || 8}+ yrs exp.</p>
                    <p className="text-xs text-slate-500">{doc.hospital || 'MediCare Clinic, New Delhi'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Consultation Fee</span>
                    <p className="font-bold text-emerald-600 text-sm mt-0.5">₹ {doc.consultationFee || 700}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Languages</span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">English, Hindi</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Consultation Modes</span>
                    <p className="font-bold text-slate-800 text-xs mt-0.5">In-clinic Consultations</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">About Doctor</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                    {doc.name} is a {doc.specialization} with {doc.experience || 8} years of clinical experience.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setDoctorProfileModalId(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const docId = doc.id;
                    setDoctorProfileModalId(null);
                    startBookingWithDoctor(docId);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelConfirmAppointmentId && (() => {
        const apt = appointments.find(a => a.id === cancelConfirmAppointmentId);
        if (!apt) return null;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-3 text-red-600">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">Cancel Appointment?</h3>
                  <p className="text-xs text-slate-500">Are you sure you want to cancel this appointment?</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Doctor:</span>
                  <span className="font-bold text-slate-900">{apt.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Date:</span>
                  <span className="font-bold text-slate-900">{apt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Time:</span>
                  <span className="font-bold text-slate-900">{apt.time}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCancelConfirmAppointmentId(null)}
                  className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={() => handleCancelSubmit(apt.id)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reschedule Modal */}
      {rescheduleModalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-lg text-slate-900">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500">Select a new date and time slot. Past dates and times are disabled.</p>

            {rescheduleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    <span>New Date (Calendar)</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Today or Future</span>
                </label>
                <input
                  type="date"
                  min={getTodayIsoString()}
                  value={newDateIso}
                  onChange={(e) => handleRescheduleDateChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                />
                <div className="text-[11px] text-blue-600 font-bold mt-1">
                  Selected: {newDate}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>New Time Slot</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Past times disabled</span>
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  {rescheduleSlots.map(slot => {
                    const isPast = isTimeSlotPast(newDateIso, slot);
                    return (
                      <option key={slot} value={slot} disabled={isPast}>
                        {slot} {isPast ? ' • (Past Time Slot)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setRescheduleModalId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRescheduleSubmit(rescheduleModalId)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
