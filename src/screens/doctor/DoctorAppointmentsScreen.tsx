import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { appointmentApi } from '../../api/appointmentApi';
import { Calendar, Users, Clock, FileText, CheckCircle2, Stethoscope, Plus, Eye, Search, ArrowUpDown, MoreVertical, CalendarDays, RefreshCw, XCircle, FileCheck, ArrowLeft } from 'lucide-react';
import { getTodayIsoString, isPastDate, formatDateForDisplay, isTodayDate } from '../../utils/dateUtils';

interface AppointmentItem {
  id: string;
  time: string;
  date?: string;
  patientId?: string;
  name: string;
  age: string;
  gender: string;
  type: 'Consultation' | 'Follow-up' | 'New Patient';
  reason: string;
  status: 'Completed' | 'Consulting' | 'Upcoming' | 'Waiting' | 'Cancelled';
  avatar: string;
  phone: string;
  email: string;
  notes?: string;
  rawAppointment: Appointment;
}

export const DoctorAppointmentsScreen: React.FC = () => {
  const { currentUser, appointments, users, updateAppointmentStatus, addMedicalRecord, goBack, setSelectedPatientForDetail, setCurrentScreen } = useApp();
  const [activeTab, setActiveTab] = useState<'All Appointments' | 'Today' | 'Upcoming' | 'Past' | 'Cancelled'>('All Appointments');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortOrder, setSortOrder] = useState<'earliest' | 'latest'>('earliest');
  const [selectedPerPage, setSelectedPerPage] = useState('8 per page');

  // Modals state
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [blockTimeModalOpen, setBlockTimeModalOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Form states
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDate, setBlockDate] = useState(getTodayIsoString());

  const [clinicalNotesMap, setClinicalNotesMap] = useState<Record<string, string>>({});

  const currentDoctorId = currentUser?.id;
  const doctorAppointments = currentDoctorId ? appointments.filter(apt => apt.doctorId === currentDoctorId) : [];

  const appointmentsList: AppointmentItem[] = doctorAppointments.map(apt => {
    const patientUser = users.find(u => u.id === apt.patientId || u.name.toLowerCase() === apt.patientName.toLowerCase());
    return {
      id: apt.id,
      patientId: apt.patientId,
      time: apt.time,
      date: apt.date,
      name: apt.patientName,
      age: patientUser?.dob ? `${Math.max(18, new Date().getFullYear() - parseInt(patientUser.dob.slice(-4) || '1995'))} yrs` : '31 yrs',
      gender: (patientUser?.gender as any) || 'Male',
      type: apt.type === 'Follow-up' ? 'Follow-up' : 'Consultation',
      reason: apt.reason || 'General Health Consultation',
      status: (apt.status as any) || 'Upcoming',
      avatar: patientUser?.avatar || (apt.patientName.toLowerCase().includes('john') ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'),
      phone: apt.patientPhone || patientUser?.phone || '+91 98765 43210',
      email: patientUser?.email || `${apt.patientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      notes: clinicalNotesMap[apt.id] || 'Patient scheduled for consultation.',
      rawAppointment: apt
    };
  });

  const filteredAppointments = appointmentsList.filter(apt => {
    const matchesSearch = apt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          apt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          apt.phone.toLowerCase().includes(searchTerm);
    
    const matchesTab = 
      activeTab === 'All Appointments' ? true :
      activeTab === 'Today' ? isTodayDate(apt.date || '') :
      activeTab === 'Upcoming' ? !isTodayDate(apt.date || '') && (apt.status === 'Upcoming' || apt.status === 'Waiting' || apt.status === 'Consulting') :
      activeTab === 'Past' ? apt.status === 'Completed' || isPastDate(apt.date || '') :
      activeTab === 'Cancelled' ? apt.status === 'Cancelled' : true;

    const matchesType = typeFilter === 'All Types' || apt.type === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || apt.status === statusFilter;

    return matchesSearch && matchesTab && matchesType && matchesStatus;
  });

  const handleOpenViewModal = async (apt: AppointmentItem) => {
    setSelectedApt(apt);
    setViewModalOpen(true);
    try {
      const res = await appointmentApi.getAppointmentById(apt.id);
      if (res.success && res.data) {
        setSelectedApt(prev => prev && prev.id === apt.id ? {
          ...prev,
          reason: res.data?.reason || prev.reason,
          date: res.data?.appointmentDate || prev.date,
          time: res.data?.appointmentTime || prev.time,
        } : prev);
      }
    } catch {
      // Fall back to existing appointment data
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: AppointmentItem['status']) => {
    try {
      const backendStatus: 'Completed' | 'Cancelled' = newStatus === 'Completed' ? 'Completed' : 'Cancelled';
      await updateAppointmentStatus(id, backendStatus);
      setActionMenuOpenId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status');
    }
  };

  const handleSaveNotes = () => {
    if (!selectedApt) return;
    setClinicalNotesMap(prev => ({ ...prev, [selectedApt.id]: clinicalNotes }));
    setNotesModalOpen(false);
    alert(`Clinical notes updated successfully for ${selectedApt.name}!`);
  };

  const handleCompleteConsultation = async () => {
    if (!selectedApt) return;
    try {
      await updateAppointmentStatus(selectedApt.id, 'Completed');
      if (currentUser) {
        await addMedicalRecord({
          patientId: selectedApt.patientId || selectedApt.id,
          date: formatDateForDisplay(getTodayIsoString()),
          type: 'Consultation',
          doctorName: currentUser.name,
          description: diagnosis || selectedApt.reason,
          details: clinicalNotes || 'In-person clinical consultation completed.'
        });
      }
      setConsultModalOpen(false);
      alert(`Consultation completed for ${selectedApt.name} and medical record saved!`);
    } catch (err: any) {
      alert(err.message || 'Failed to complete consultation');
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 min-h-screen">
      {/* Top Header Card */}
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
              Appointments Management
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              View, manage, and update all patient appointments and schedules.
            </p>
          </div>
        </div>

        <button
          onClick={() => setBlockTimeModalOpen(true)}
          className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-500/20 transition duration-200 flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Block Time / Update Availability</span>
        </button>
      </div>

      {/* 4 Top Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{appointmentsList.filter(a => isTodayDate(a.date || '')).length}</span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Today's Appointments</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {appointmentsList.filter(a => a.status === 'Upcoming' || a.status === 'Waiting').length}
            </span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Upcoming Queue</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {appointmentsList.filter(a => a.type === 'Follow-up').length}
            </span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Follow-ups</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold shadow-2xs">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {appointmentsList.filter(a => a.status === 'Cancelled').length}
            </span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Cancelled / Changes</span>
          </div>
        </div>
      </div>

      {/* Main Filter Tabs and Content Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            {(['All Appointments', 'Today', 'Upcoming', 'Past', 'Cancelled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition duration-200 whitespace-nowrap cursor-pointer ${activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 shadow-2xs shrink-0">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>Mon, 28 Sep 2026</span>
          </div>
        </div>

        {/* Search and Functional Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by patient name, phone or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option>All Types</option>
            <option>Consultation</option>
            <option>Follow-up</option>
            <option>New Patient</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option>All Status</option>
            <option>Completed</option>
            <option>Consulting</option>
            <option>Upcoming</option>
            <option>Waiting</option>
            <option>Cancelled</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'earliest' ? 'latest' : 'earliest')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 justify-between cursor-pointer hover:bg-slate-100 transition"
          >
            <span>Time ({sortOrder === 'earliest' ? 'Earliest' : 'Latest'})</span>
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-bold">No appointments found matching your criteria.</td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition relative">
                    <td className="py-4 px-4 font-extrabold text-slate-900">
                      <div>{apt.time}</div>
                      {apt.date && <div className="text-[11px] font-bold text-blue-600 mt-0.5">{apt.date}</div>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <img src={apt.avatar} alt={apt.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" />
                        <div>
                          <span className="block font-extrabold text-slate-900">{apt.name}</span>
                          <span className="block text-[11px] font-bold text-slate-400">{apt.age} | {apt.gender}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold ${apt.type === 'Consultation' ? 'bg-teal-50 text-teal-700 border border-teal-200' : apt.type === 'Follow-up' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                        {apt.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{apt.reason}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold ${
                        apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        apt.status === 'Consulting' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        apt.status === 'Upcoming' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        apt.status === 'Waiting' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 relative whitespace-nowrap">
                      <button
                        onClick={() => handleOpenViewModal(apt)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {apt.status === 'Upcoming' || apt.status === 'Waiting' || apt.status === 'Consulting' ? (
                        <button
                          onClick={() => { setSelectedApt(apt); setDiagnosis(apt.reason); setClinicalNotes(apt.notes || ''); setConsultModalOpen(true); }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Start</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedApt(apt); setClinicalNotes(apt.notes || ''); setNotesModalOpen(true); }}
                          className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Notes</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActionMenuOpenId(actionMenuOpenId === apt.id ? null : apt.id)}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer inline-block align-middle"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {actionMenuOpenId === apt.id && (
                        <div className="absolute right-4 top-14 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-30 text-left animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => { handleOpenViewModal(apt); setActionMenuOpenId(null); }}
                            className="w-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition flex items-center space-x-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => { setSelectedApt(apt); setClinicalNotes(apt.notes || ''); setNotesModalOpen(true); setActionMenuOpenId(null); }}
                            className="w-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition flex items-center space-x-2"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit Notes</span>
                          </button>
                          <button
                            onClick={() => { handleUpdateStatus(apt.id, 'Completed'); }}
                            className="w-full px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition flex items-center space-x-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                          <button
                            onClick={() => { handleUpdateStatus(apt.id, 'Cancelled'); }}
                            className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center space-x-2"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel Appointment</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500">
            Showing 1-{filteredAppointments.length} of {appointmentsList.length} appointments
          </p>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button className="w-8 h-8 rounded-xl bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center shadow-xs">1</button>
              <button className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-extrabold flex items-center justify-center">2</button>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
              <span>Show</span>
              <select
                value={selectedPerPage}
                onChange={(e) => setSelectedPerPage(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option>8 per page</option>
                <option>12 per page</option>
                <option>16 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* View Patient Modal */}
      {viewModalOpen && selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Patient Profile & Details</h3>
              <button onClick={() => setViewModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <img src={selectedApt.avatar} alt={selectedApt.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md" />
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">{selectedApt.name}</h4>
                <p className="text-xs font-bold text-slate-500">{selectedApt.age} | {selectedApt.gender}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                  {selectedApt.type}
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700">
              <div className="flex items-center space-x-2 text-slate-600">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">{selectedApt.date ? `${selectedApt.date} at ${selectedApt.time}` : selectedApt.time}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <span className="font-bold text-slate-900 block mb-1">Appointment Reason:</span>
                <p className="text-slate-600">{selectedApt.reason}</p>
              </div>
              <div className="pt-2">
                <span className="font-bold text-slate-900 block mb-1">Clinical Notes:</span>
                <p className="text-slate-600">{selectedApt.notes || 'No notes added yet.'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const patUser = users.find(u => u.id === selectedApt.patientId || u.id === selectedApt.rawAppointment.patientId) || { id: selectedApt.patientId, name: selectedApt.name, contact: selectedApt.phone };
                  setSelectedPatientForDetail(patUser);
                  setViewModalOpen(false);
                  setCurrentScreen('patient-record-detail');
                }}
                className="px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>View Full EHR Profile</span>
              </button>
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Notes Modal */}
      {notesModalOpen && selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Clinical Notes for {selectedApt.name}</h3>
              <button onClick={() => setNotesModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Patient Medical Notes & Observations</label>
              <textarea
                rows={5}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Enter diagnosis, symptoms, or notes..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setNotesModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Consultation Modal */}
      {consultModalOpen && selectedApt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Conduct Consultation: {selectedApt.name}</h3>
              <button onClick={() => setConsultModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis / Summary</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes & Observations</label>
                <textarea
                  rows={4}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter clinical examination notes and recommendations..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setConsultModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteConsultation}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>Complete Consultation & Save Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Modal */}
      {blockTimeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Block Time / Update Availability</h3>
              <button onClick={() => setBlockTimeModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Select Date to Block</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Today or Future</span>
                </label>
                <input
                  type="date"
                  min={getTodayIsoString()}
                  value={blockDate}
                  onChange={(e) => {
                    if (!isPastDate(e.target.value)) {
                      setBlockDate(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Blocking Time</label>
                <input
                  type="text"
                  placeholder="e.g. Conference, Personal Leave"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setBlockTimeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isPastDate(blockDate)) {
                    alert('Error: Cannot block dates in the past. Please select today or a future date.');
                    return;
                  }
                  alert(`Successfully blocked schedule for ${blockDate} (${blockReason || 'Unavailable'})`);
                  setBlockTimeModalOpen(false);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm Block Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
