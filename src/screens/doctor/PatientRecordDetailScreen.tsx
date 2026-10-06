import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, Printer, Share2, Edit3, Heart, Activity, Shield, 
  Plus, Phone, Mail, MapPin, AlertCircle, X, Package, Calendar, Clock, FileText, CheckCircle2 
} from 'lucide-react';

interface PatientRecordProps {
  patient?: any;
  onBack?: () => void;
}

export const PatientRecordDetailScreen: React.FC<PatientRecordProps> = ({ patient, onBack }) => {
  const { 
    currentUser, 
    setCurrentScreen, 
    selectedPatientForDetail, 
    users, 
    appointments, 
    medicalRecords, 
    addMedicalRecord, 
    updateUserProfile 
  } = useApp();

  const effectivePatient = patient || selectedPatientForDetail;

  const [activeTab, setActiveTab] = useState<'Overview' | 'Medical History' | 'Appointments' | 'Clinical Notes'>('Overview');

  // If no patient is selected or ID is missing
  if (!effectivePatient || (!effectivePatient.id && !effectivePatient.patientId)) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-16 min-h-screen flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">No Patient Selected</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Please select a patient from the Patient Directory or Appointments screen to view their Electronic Health Record (EHR).
          </p>
          <button
            onClick={() => onBack ? onBack() : setCurrentScreen('doctor-patients')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition cursor-pointer shadow-md inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patients Directory</span>
          </button>
        </div>
      </div>
    );
  }

  const patientId = String(effectivePatient.id || effectivePatient.patientId);
  const patientUser = users.find(u => u.id === patientId || u.id === effectivePatient.id);

  // Derive patient profile fields accurately from shared data
  const patientName = patientUser?.name || effectivePatient.name || 'Patient';
  const patientAge = patientUser?.dob 
    ? `${Math.max(18, new Date().getFullYear() - parseInt(patientUser.dob.slice(-4) || '1995'))} yrs` 
    : (effectivePatient.age || 'Not available');
  const patientGender = patientUser?.gender || effectivePatient.gender || 'Not available';
  const patientContact = patientUser?.phone || effectivePatient.contact || effectivePatient.phone || 'Not available';
  const patientEmail = patientUser?.email || effectivePatient.email || 'Not available';
  const patientAddress = patientUser?.address || effectivePatient.address || 'Not available';
  const patientBloodGroup = patientUser?.bloodGroup || effectivePatient.bloodGroup || 'Not available';
  const patientStatus = effectivePatient.status || 'Active';
  const patientAvatar = patientUser?.avatar || effectivePatient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
  const patientHeight = patientUser?.height || effectivePatient.height || 'Not available';
  const patientWeight = patientUser?.weight || effectivePatient.weight || 'Not available';

  // Real Appointments strictly for this specific patientId
  const patientAppointments = appointments.filter(a => a.patientId === patientId);

  // Real Medical Records strictly for this specific patientId
  const patientMedicalRecords = medicalRecords.filter(r => r.patientId === patientId);

  // Compute actual visit chronology
  const pastApts = patientAppointments.filter(a => a.status === 'Completed');
  const lastVisit = pastApts.length > 0 ? pastApts[pastApts.length - 1].date : 'Initial visit';
  const upcomingApts = patientAppointments.filter(a => a.status === 'Upcoming' || a.status === 'Pending');
  const nextAppointment = upcomingApts.length > 0 ? `${upcomingApts[0].date} ${upcomingApts[0].time}` : 'None Scheduled';

  // Local interactive states
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [showAddAllergyModal, setShowAddAllergyModal] = useState(false);

  const [medications, setMedications] = useState<{ name: string; freq: string; purpose: string }[]>([]);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('Once daily');
  const [newMedPurpose, setNewMedPurpose] = useState('General');

  const [customNotes, setCustomNotes] = useState<{ date: string; note: string; doctor?: string }[]>([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(patientName);
  const [editContact, setEditContact] = useState(patientContact);
  const [editEmail, setEditEmail] = useState(patientEmail);

  // Synchronize state immediately whenever selected patient changes
  useEffect(() => {
    setEditName(patientName);
    setEditContact(patientContact);
    setEditEmail(patientEmail);

    const userAllergies = patientUser?.allergies
      ? patientUser.allergies.split(',').map(s => s.trim()).filter(Boolean)
      : (effectivePatient.allergies ? (Array.isArray(effectivePatient.allergies) ? effectivePatient.allergies : effectivePatient.allergies.split(',')) : []);
    setAllergies(userAllergies.length > 0 ? userAllergies : ['None Known']);

    if (patientUser?.chronicConditions && patientUser.chronicConditions !== 'None') {
      setMedications([
        { name: `${patientUser.chronicConditions} Care Rx`, freq: 'Once daily', purpose: patientUser.chronicConditions }
      ]);
    } else {
      setMedications([]);
    }

    setCustomNotes([]);
    setActiveTab('Overview');
  }, [patientId]);

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergy.trim()) return;
    setAllergies(prev => [...prev, newAllergy.trim()]);
    setNewAllergy('');
    setShowAddAllergyModal(false);
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    setMedications(prev => [...prev, { name: newMedName.trim(), freq: newMedFreq, purpose: newMedPurpose }]);
    setNewMedName('');
    setShowAddMedModal(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const noteContent = newNoteText.trim();
    try {
      // Save to shared medical records in AppContext via backend API
      await addMedicalRecord({
        patientId: patientId,
        date: '01 Oct 2026',
        type: 'Clinical Note',
        doctorName: currentUser?.name || 'Dr. Priya Gupta',
        description: 'Physician Clinical Evaluation',
        details: noteContent
      });
      setCustomNotes(prev => [{ date: 'Today', note: noteContent, doctor: currentUser?.name || 'Dr. Priya Gupta' }, ...prev]);
      setNewNoteText('');
      setShowAddNoteModal(false);
    } catch (err: any) {
      alert(`Error saving note: ${err.message || 'Failed'}`);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(patientId, { name: editName, phone: editContact, email: editEmail });
    setShowEditProfileModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    alert('Patient record link copied to clipboard!');
  };

  // Combine shared clinical notes with any session notes
  const allClinicalNotes = [
    ...customNotes,
    ...patientMedicalRecords.filter(r => r.type === 'Clinical Note' || r.type === 'Consultation').map(r => ({
      date: r.date,
      note: r.details || r.description,
      doctor: r.doctorName
    }))
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 min-h-screen">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-xs border border-slate-200/80">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onBack ? onBack() : setCurrentScreen('doctor-patients')}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patients</span>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Electronic Health Record (EHR)
            </h2>
            <p className="text-xs font-medium text-slate-500">
              View and manage patient medical records, vitals & history for <span className="font-bold text-slate-800">{patientName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center space-x-2 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print EHR</span>
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center space-x-2 cursor-pointer shadow-2xs"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
            <span>Share</span>
          </button>
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition flex items-center space-x-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Patient Info Header Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <img src={patientAvatar} alt={patientName} className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-blue-500/30 shadow-md" />
              <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border-2 border-white shadow-xs">
                {patientStatus}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{patientName}</h3>
              <p className="text-xs font-bold text-slate-500">{patientAge} | {patientGender}</p>
              
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-600" />{patientContact}</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-600" />{patientEmail}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-600" />{patientAddress}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Patient ID</span>
              <span className="text-sm font-extrabold text-slate-900 font-mono">{patientId}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Blood Group</span>
              <span className="text-sm font-extrabold text-rose-600 flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {patientBloodGroup}
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Last Visit</span>
              <span className="text-xs font-extrabold text-slate-900">{lastVisit}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Next Appointment</span>
              <span className="text-xs font-extrabold text-blue-600">{nextAppointment}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pt-4 overflow-x-auto pb-2">
          {(['Overview', 'Medical History', 'Appointments', 'Clinical Notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <h4 className="font-extrabold text-base text-slate-900">Health Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Blood Pressure</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">120/80 mmHg</span>
                  <span className="block text-[10px] text-slate-400 font-medium">Standard</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>Heart Rate</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">72 bpm</span>
                  <span className="block text-[10px] text-slate-400 font-medium">Resting</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                    <span>Weight</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">{patientWeight}</span>
                  <span className="block text-[10px] text-slate-400 font-medium">Recorded</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                    <span>Height</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">{patientHeight}</span>
                  <span className="block text-[10px] text-slate-400 font-medium">Recorded</span>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-base text-slate-900">Medical History</h4>
                <button onClick={() => setActiveTab('Medical History')} className="text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer">View All</button>
              </div>
              <div className="space-y-3.5">
                {patientMedicalRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 font-medium text-center">No prior medical records on file.</p>
                ) : (
                  patientMedicalRecords.slice(0, 3).map((hist) => (
                    <div key={hist.id} className="flex items-start space-x-3 text-xs">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900">{hist.type}</span>
                          <span className="text-[10px] font-bold text-slate-400">{hist.date}</span>
                        </div>
                        <p className="text-slate-600 font-semibold">{hist.description}</p>
                        {hist.details && <p className="text-slate-500 font-medium text-[11px]">{hist.details}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-base text-slate-900">Allergies</h4>
                <button 
                  onClick={() => setShowAddAllergyModal(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Allergy</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((alg, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-extrabold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{alg}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-base text-slate-900">Prescribed Medications</h4>
                <button 
                  onClick={() => setShowAddMedModal(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medication</span>
                </button>
              </div>
              <div className="space-y-3">
                {medications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 font-medium text-center">No active medications registered.</p>
                ) : (
                  medications.map((med, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs text-slate-900">{med.name}</h5>
                          <p className="text-[10px] text-slate-500 font-medium">{med.freq} • {med.purpose}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-base text-slate-900">Clinical Consultations</h4>
                <button onClick={() => setActiveTab('Appointments')} className="text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer">View All</button>
              </div>
              <div className="space-y-3">
                {patientAppointments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 font-medium text-center">No consultations on file for this patient.</p>
                ) : (
                  patientAppointments.map((apt) => (
                    <div key={apt.id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="block text-[10px] font-extrabold text-blue-600">{apt.date} • {apt.time}</span>
                          <span className="text-[10px] font-mono text-slate-400">({apt.id})</span>
                        </div>
                        <h5 className="font-extrabold text-xs text-slate-900 mt-0.5">{apt.doctorName}</h5>
                        <p className="text-[11px] text-slate-500">{apt.reason || 'General Consultation'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        apt.status === 'Upcoming' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-base text-slate-900">Upcoming Appointments</h4>
                <button onClick={() => setCurrentScreen('doctor-calendar')} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 cursor-pointer">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>
              <div className="space-y-3">
                {upcomingApts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 font-medium text-center">No upcoming appointments scheduled.</p>
                ) : (
                  upcomingApts.map((apt) => (
                    <div key={apt.id} className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/60 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-xs text-slate-900">{apt.date} • {apt.time}</span>
                          <span className="text-[9px] font-mono text-blue-700 font-bold">[{apt.id}]</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">{apt.type} • {apt.reason}</p>
                        <span className="block text-[10px] text-blue-700 font-bold">Doctor: {apt.doctorName}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                        {apt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-base text-slate-900">Doctor's Notes</h4>
                <button 
                  onClick={() => setShowAddNoteModal(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>
              </div>
              <div className="space-y-3">
                {allClinicalNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 font-medium text-center">No clinical notes recorded.</p>
                ) : (
                  allClinicalNotes.map((note, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-blue-600">{note.date}</span>
                        {note.doctor && <span className="text-[10px] font-bold text-slate-500">{note.doctor}</span>}
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MEDICAL HISTORY */}
      {activeTab === 'Medical History' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Complete Medical History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological clinical examination records, prescriptions and diagnoses for {patientName}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700">
              {patientMedicalRecords.length} Record{patientMedicalRecords.length !== 1 ? 's' : ''}
            </span>
          </div>

          {patientMedicalRecords.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No medical records found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">There are currently no recorded medical history entries or lab results filed for {patientName}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {patientMedicalRecords.map((record) => (
                <div key={record.id} className="p-5 rounded-2xl border border-slate-200/80 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 transition space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
                        {record.type}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">{record.description}</h4>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center space-x-1"><Calendar className="w-3.5 h-3.5 text-blue-600" /><span>{record.date}</span></span>
                      <span>•</span>
                      <span>Physician: <strong className="text-slate-800">{record.doctorName}</strong></span>
                    </div>
                  </div>
                  {record.details && (
                    <p className="text-xs text-slate-600 font-medium bg-white p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                      {record.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: APPOINTMENTS */}
      {activeTab === 'Appointments' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Patient Consultation History</h3>
              <p className="text-xs text-slate-500 mt-0.5">All scheduled, upcoming, and past consultations for {patientName}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700">
              {patientAppointments.length} Total Appointment{patientAppointments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {patientAppointments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No appointments found</p>
              <p className="text-xs text-slate-400">There are no consultations scheduled or completed for this patient.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Appointment ID</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Doctor</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {patientAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4 font-mono font-bold text-xs text-blue-700">{apt.id}</td>
                      <td className="py-4 px-4 font-extrabold text-slate-900">
                        {apt.date}
                        <span className="block text-[10px] text-slate-500 font-medium">{apt.time}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">{apt.doctorName}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700">
                          {apt.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 max-w-xs">{apt.reason}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          apt.status === 'Upcoming' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CLINICAL NOTES */}
      {activeTab === 'Clinical Notes' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Diagnostic Observations & Clinical Notes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Medical provider notes, progress tracking and treatment instructions for {patientName}</p>
            </div>
            <button 
              onClick={() => setShowAddNoteModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Note</span>
            </button>
          </div>

          {allClinicalNotes.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No clinical notes recorded</p>
              <p className="text-xs text-slate-400">Click "Add New Note" to document clinical findings or treatment recommendations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allClinicalNotes.map((note, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-blue-700">{note.date}</span>
                    {note.doctor && <span className="font-semibold text-slate-500">Documented by: <strong className="text-slate-800">{note.doctor}</strong></span>}
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-4 rounded-xl border border-slate-100">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showAddAllergyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add Patient Allergy</h3>
              <button onClick={() => setShowAddAllergyModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddAllergy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allergy Name / Substance</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dust, Peanuts"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddAllergyModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Allergy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add Current Medication</h3>
              <button onClick={() => setShowAddMedModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name & Dosage</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                <input
                  type="text"
                  value={newMedFreq}
                  onChange={(e) => setNewMedFreq(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purpose</label>
                <input
                  type="text"
                  value={newMedPurpose}
                  onChange={(e) => setNewMedPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddMedModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Medication</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add Clinical Note</h3>
              <button onClick={() => setShowAddNoteModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Note & Observation</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter observation, advice, or follow-up instructions..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddNoteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Edit Patient Profile</h3>
              <button onClick={() => setShowEditProfileModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowEditProfileModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
