import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { Calendar as CalendarIcon, Clock, Users, Plus, ChevronLeft, ChevronRight, FileText, X, Download, Eye, Edit3, Trash2, Phone, Mail, ArrowLeft } from 'lucide-react';
import { getTodayIsoString, formatDateForDisplay, formatDateToIso, parseDateString, isPastDate, isTimeSlotPast } from '../../utils/dateUtils';

interface CalendarAppointment {
  id: string;
  timeRange: string;
  rawTime?: string;
  date: string;
  dayIndex: number;
  patientName: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  type: string;
  reason: string;
  status: 'Completed' | 'Upcoming' | 'Cancelled' | 'Waiting' | 'Consulting';
  notes: string;
  attachment?: string;
  avatar: string;
}

export const DoctorCalendarScreen: React.FC = () => {
  const { currentUser, appointments, users, setCurrentScreen, weeklySchedule, setWeeklySchedule, blockedDates, goBack, bookAppointment, updateAppointmentStatus } = useApp();
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month' | 'Agenda'>('Week');
  const [currentWeekLabel, setCurrentWeekLabel] = useState('28 Sep - 4 Oct 2026');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPatientProfileModal, setShowPatientProfileModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);

  // Form states
  const [newPatientName, setNewPatientName] = useState('');
  const [newDateIso, setNewDateIso] = useState(getTodayIsoString());
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newReason, setNewReason] = useState('General Consultation');
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const currentDoctorId = currentUser?.id;
  const isDoctorAppointment = (apt: Appointment) => currentDoctorId ? apt.doctorId === currentDoctorId : false;

  const daysOfWeek = [
    { name: 'Mon', date: '28 Sep', iso: '2026-09-28', dayIndex: 0 },
    { name: 'Tue', date: '29 Sep', iso: '2026-09-29', dayIndex: 1 },
    { name: 'Wed', date: '30 Sep', iso: '2026-09-30', dayIndex: 2 },
    { name: 'Thu', date: '1 Oct', iso: '2026-10-01', dayIndex: 3 },
    { name: 'Fri', date: '2 Oct', iso: '2026-10-02', dayIndex: 4 },
    { name: 'Sat', date: '3 Oct', iso: '2026-10-03', dayIndex: 5 },
    { name: 'Sun', date: '4 Oct', iso: '2026-10-04', dayIndex: 6 }
  ];

  const doctorRealAppointments = appointments.filter(isDoctorAppointment);

  const realCalendarItems: CalendarAppointment[] = doctorRealAppointments.map((apt) => {
    const patientUser = users.find(u => u.id === apt.patientId || u.name.toLowerCase() === apt.patientName.toLowerCase());
    const aptIso = formatDateToIso(apt.date);
    const matchedDay = daysOfWeek.find(d => d.iso === aptIso);
    const dayIdx = matchedDay ? matchedDay.dayIndex : -1;

    return {
      id: apt.id,
      timeRange: `${apt.time} - 30 mins`,
      rawTime: apt.time,
      date: apt.date,
      dayIndex: dayIdx,
      patientName: apt.patientName,
      age: patientUser?.dob ? `${Math.max(18, new Date().getFullYear() - parseInt(patientUser.dob.slice(-4) || '1995'))} yrs` : 'Not available',
      gender: (patientUser?.gender as any) || 'Not available',
      phone: apt.patientPhone || patientUser?.phone || 'Not available',
      email: patientUser?.email || 'Not available',
      type: apt.type === 'Follow-up' ? 'Follow-up' : 'Consultation',
      reason: apt.reason || 'General Consultation',
      status: (apt.status as any) || 'Upcoming',
      notes: 'Consultation appointment scheduled.',
      avatar: patientUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
    };
  });

  const combinedAppointments = realCalendarItems;

  const [selectedApt, setSelectedApt] = useState<CalendarAppointment | null>(combinedAppointments[0] || null);

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const getAppointmentCardColor = (apt: CalendarAppointment) => {
    if (apt.status === 'Completed') {
      return 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100';
    }
    if (apt.status === 'Cancelled') {
      return 'bg-rose-50 border-rose-200 text-rose-950 line-through hover:bg-rose-100';
    }
    switch (apt.type) {
      case 'Consultation':
        return 'bg-blue-50 border-blue-200 text-blue-950 hover:bg-blue-100';
      case 'Follow-up':
        return 'bg-purple-50 border-purple-200 text-purple-950 hover:bg-purple-100';
      case 'New Patient':
        return 'bg-cyan-50 border-cyan-200 text-cyan-950 hover:bg-cyan-100';
      default:
        return 'bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-100';
    }
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'doctor') {
      alert('Unauthorized: Only authenticated doctors can access calendar.');
      return;
    }
    alert('Appointments are booked by patients through the patient portal. Please view and manage your schedule via the calendar.');
    setShowAddModal(false);
  };

  const handleEditAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;
    setShowEditModal(false);
    alert('Appointment details updated successfully!');
  };

  const handleCancelAppointment = (id: string) => {
    updateAppointmentStatus(id, 'Cancelled');
    if (selectedApt && selectedApt.id === id) {
      setSelectedApt(prev => prev ? { ...prev, status: 'Cancelled' } : null);
    }
    alert('Appointment cancelled successfully.');
  };

  const toggleDayAvailability = (index: number) => {
    const updated = [...weeklySchedule];
    updated[index] = { ...updated[index], available: !updated[index].available };
    setWeeklySchedule(updated);
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/80">
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Calendar & Availability
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage your schedule, appointments and update your daily availability status
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => setCurrentScreen('doctor-availability')}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-extrabold transition duration-200 flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Manage Weekly Availability</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition duration-200 flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      {/* View Mode & Date Controls Bar */}
      <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl">
          {(['Day', 'Week', 'Month', 'Agenda'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                if (mode === 'Agenda') {
                  setCurrentWeekLabel('All Scheduled Agenda');
                } else if (mode === 'Day') {
                  setCurrentWeekLabel('Mon, 28 Sep 2026');
                } else if (mode === 'Month') {
                  setCurrentWeekLabel('September 2026');
                } else {
                  setCurrentWeekLabel('28 Sep - 4 Oct 2026');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${viewMode === mode ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center space-x-4 text-[11px] font-bold text-slate-600">
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span>Consultation</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span><span>Follow-up</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-cyan-500"></span><span>New Patient</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>Completed</span></div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
            <button onClick={() => setCurrentWeekLabel('21 Sep - 27 Sep 2026')} className="p-2 hover:bg-white rounded-xl text-slate-600 transition cursor-pointer" title="Previous period">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-slate-900 px-3">{currentWeekLabel}</span>
            <button onClick={() => setCurrentWeekLabel('5 Oct - 11 Oct 2026')} className="p-2 hover:bg-white rounded-xl text-slate-600 transition cursor-pointer" title="Next period">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { setCurrentWeekLabel('28 Sep - 4 Oct 2026'); setViewMode('Week'); }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Calendar Grid / Agenda List + Side Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {viewMode === 'Agenda' ? (
          <div className="lg:col-span-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">Agenda Schedule</h3>
            <div className="space-y-3">
              {combinedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => setSelectedApt(apt)}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition shadow-2xs ${getAppointmentCardColor(apt)}`}
                >
                  <div className="flex items-center space-x-4">
                    <img src={apt.avatar} alt={apt.patientName} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{apt.patientName} <span className="text-slate-500 font-bold">({apt.age})</span></h4>
                      <p className="text-[11px] font-medium text-slate-600">{apt.date} | {apt.timeRange} • {apt.reason}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-white/80 shadow-2xs">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-4 px-3 text-[11px] font-extrabold text-slate-400 uppercase w-20 text-center border-r border-slate-200">Time</th>
                    {daysOfWeek.map((day, idx) => {
                      const dayStatus = weeklySchedule[idx]?.available;
                      const isDayBlocked = blockedDates.some(b => b.date === day.iso);
                      const blockItem = blockedDates.find(b => b.date === day.iso);
                      const isUnavailable = !dayStatus || isDayBlocked;

                      return (
                        <th key={idx} className="py-4 px-2 text-center border-r border-slate-200 last:border-r-0 select-none">
                          <span className="block text-[11px] font-bold text-slate-400 uppercase">{day.name}</span>
                          <button 
                            type="button"
                            onClick={() => toggleDayAvailability(idx)}
                            className={`inline-block mt-1 text-xs font-extrabold px-3 py-1 rounded-full cursor-pointer transition-all duration-150 active:scale-95 hover:brightness-95 border ${isUnavailable ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}
                            title={`Click to set ${day.name} availability`}
                          >
                            {day.date} {isDayBlocked ? `(${blockItem?.reason || 'Holiday'})` : dayStatus ? '(Available)' : '(Absent)'}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeSlots.map((slot, timeIdx) => (
                    <tr key={timeIdx} className="h-20">
                      <td className="py-2 px-2 text-[11px] font-bold text-slate-400 text-center border-r border-slate-200 bg-slate-50/30 align-top">
                        {slot}
                      </td>
                      {daysOfWeek.map((day, dayIdx) => {
                        const isDayAvailable = weeklySchedule[dayIdx]?.available;
                        const isDayBlocked = blockedDates.some(b => b.date === day.iso);
                        const blockItem = blockedDates.find(b => b.date === day.iso);

                        const aptsInSlot = combinedAppointments.filter(a => {
                          if (a.dayIndex !== dayIdx) return false;
                          const aTime = a.rawTime || a.timeRange;
                          const aptHour = parseInt(aTime.split(':')[0], 10);
                          const aptPeriod = aTime.slice(-2).toUpperCase();
                          const slotHour = parseInt(slot.split(':')[0], 10);
                          const slotPeriod = slot.slice(-2).toUpperCase();
                          return aptHour === slotHour && aptPeriod === slotPeriod;
                        });
                        const matchingApt = aptsInSlot[0] || null;

                        return (
                          <td key={dayIdx} className={`p-1 border-r border-slate-100 last:border-r-0 align-top relative group ${(!isDayAvailable || isDayBlocked) ? 'bg-slate-100/60' : ''}`}>
                            {isDayBlocked ? (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider rotate-[-15deg]">{blockItem?.reason || 'Blocked'}</span>
                              </div>
                            ) : !isDayAvailable ? (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest rotate-[-15deg]">Not Available</span>
                              </div>
                            ) : matchingApt ? (
                              <div
                                onClick={() => setSelectedApt(matchingApt)}
                                className={`p-2.5 rounded-2xl border text-left cursor-pointer transition shadow-2xs hover:shadow-md ${getAppointmentCardColor(matchingApt)}`}
                              >
                                <span className="block text-[10px] font-extrabold opacity-75">{matchingApt.timeRange.split(' ')[0]}</span>
                                <span className="block text-xs font-extrabold truncate mt-0.5">{matchingApt.patientName}</span>
                                <span className="block text-[10px] font-medium opacity-80 truncate">{matchingApt.type}</span>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointment Details Side Panel */}
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-6 sticky top-28">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>Appointment Details</span>
            </h3>
            {selectedApt && (
              <button onClick={() => setSelectedApt(null)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!selectedApt ? (
            <div className="text-center py-16 text-slate-400 font-bold space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs">Click any appointment block on the calendar to view full details.</p>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {selectedApt.timeRange}
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${selectedApt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  {selectedApt.status}
                </span>
              </div>

              <div className="flex items-center space-x-3.5">
                <img src={selectedApt.avatar} alt={selectedApt.patientName} className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500 shadow-sm" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{selectedApt.patientName}</h4>
                  <p className="text-xs font-bold text-slate-500">{selectedApt.age} | {selectedApt.gender}</p>
                  <p className="text-[11px] font-medium text-blue-600 mt-0.5">{selectedApt.phone}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-medium text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Appointment Type</span>
                  <span className="font-bold text-slate-900">{selectedApt.type}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Reason</span>
                  <span className="font-bold text-slate-900">{selectedApt.reason}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Notes</span>
                  <p className="text-slate-600 mt-0.5">{selectedApt.notes}</p>
                </div>
                {selectedApt.attachment && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      {selectedApt.attachment}
                    </span>
                    <button onClick={() => alert(`Downloading ${selectedApt.attachment}`)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => setShowPatientProfileModal(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Patient EHR Profile</span>
                </button>
                <button
                  onClick={() => { setEditReason(selectedApt.reason); setEditNotes(selectedApt.notes); setShowEditModal(true); }}
                  className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  <span>Edit Appointment Notes</span>
                </button>
                <button
                  onClick={() => handleCancelAppointment(selectedApt.id)}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Cancel Appointment</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Today's Summary</h3>
            <span className="text-xs font-bold text-slate-400">Mon, 28 Sep 2026</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-extrabold text-sm">{combinedAppointments.length}</div>
              <div>
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase">TOTAL</span>
                <span className="text-xs font-bold text-slate-900">Appointments</span>
              </div>
            </div>
            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100 flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-extrabold text-sm">{combinedAppointments.filter(a => a.status === 'Completed').length}</div>
              <div>
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase">COMPLETED</span>
                <span className="text-xs font-bold text-slate-900">Done</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setShowBlockTimeModal(true)}
              className="text-left p-3.5 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 rounded-2xl border border-slate-200/60 transition flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Block Time</h4>
                <p className="text-[10px] text-slate-500 font-medium">Set unavailable hours</p>
              </div>
            </button>
            <button
              onClick={() => setCurrentScreen('doctor-availability')}
              className="text-left p-3.5 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 rounded-2xl border border-slate-200/60 transition flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">Availability</h4>
                <p className="text-[10px] text-slate-500 font-medium">Manage weekly schedule</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add New Appointment</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Appointment Date (Calendar)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Past dates blocked</span>
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIsoString()}
                  value={newDateIso}
                  onChange={(e) => {
                    const iso = e.target.value;
                    if (!isPastDate(iso)) {
                      setNewDateIso(iso);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Time Slot</span>
                  <span className="text-[10px] text-slate-400 font-bold">Past times blocked</span>
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM'].map(t => {
                    const isPast = isTimeSlotPast(newDateIso, t);
                    return (
                      <option key={t} value={t} disabled={isPast}>
                        {t} {isPast ? ' • (Past Time Slot)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Consultation Type</label>
                <input
                  type="text"
                  placeholder="e.g. Health consultation"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Edit Appointment: {selectedApt.patientName}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Condition</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

      {/* Patient Profile Modal */}
      {showPatientProfileModal && selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Patient EHR Profile</h3>
              <button onClick={() => setShowPatientProfileModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <img src={selectedApt.avatar} alt={selectedApt.patientName} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm" />
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">{selectedApt.patientName}</h4>
                <p className="text-xs font-bold text-slate-500">{selectedApt.age} | {selectedApt.gender}</p>
              </div>
            </div>
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700">
              <div className="flex items-center space-x-2 text-slate-600">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{selectedApt.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>{selectedApt.email}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPatientProfileModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Modal */}
      {showBlockTimeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Block Unavailable Hours</h3>
              <button onClick={() => setShowBlockTimeModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Select Date & Reason</label>
              <input type="date" defaultValue="2026-09-29" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
              <input type="text" placeholder="Reason (e.g., Personal Leave / Seminar)" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setShowBlockTimeModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button onClick={() => { alert('Time blocked successfully.'); setShowBlockTimeModal(false); }} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md">Confirm Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
