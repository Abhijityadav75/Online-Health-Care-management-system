import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { Users, UserPlus, Search, MoreVertical, Eye, Download, X, Heart, Activity, Shield, MessageSquare, ArrowLeft } from 'lucide-react';

interface PatientItem {
  id: string;
  patientId: string;
  name: string;
  age: string;
  gender: string;
  contact: string;
  lastVisit: string;
  nextAppointment: string;
  condition: string;
  conditionType: 'Hypertension' | 'Arrhythmia' | 'Normal' | 'High Cholesterol' | 'Diabetes' | 'Follow-up' | 'Palpitations' | 'Recovered';
  status: 'Active' | 'Inactive';
  avatar: string;
  email: string;
  bloodPressure: string;
  heartRate: string;
  weight: string;
  height: string;
  diagnosedDate: string;
  appointmentCount?: number;
}

export const DoctorPatientsScreen: React.FC = () => {
  const { currentUser, appointments, users, setCurrentScreen, goBack, setSelectedPatientForDetail } = useApp();
  const [activeTab, setActiveTab] = useState<'All Patients' | 'Follow-up' | 'New Patients' | 'Critical Cases' | 'Inactive'>('All Patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All Gender');
  const [ageFilter, setAgeFilter] = useState('All Age Groups');
  const [conditionFilter, setConditionFilter] = useState('All Conditions');

  const currentDoctorId = currentUser?.id;
  const isDoctorAppointment = (apt: Appointment) => currentDoctorId ? apt.doctorId === currentDoctorId : false;

  const doctorRealAppointments = appointments.filter(isDoctorAppointment);

  const patientMap = new Map<string, PatientItem>();
  for (const apt of doctorRealAppointments) {
    const existingUser = users.find(u => 
      (apt.patientId && u.id === apt.patientId) || 
      (apt.patientName && u.name.toLowerCase().trim() === apt.patientName.toLowerCase().trim())
    );
    const canonicalId = existingUser?.id || apt.patientId || 'Not available';
    const displayPatientId = canonicalId;

    if (!patientMap.has(canonicalId)) {
      patientMap.set(canonicalId, {
        id: canonicalId,
        patientId: displayPatientId,
        name: existingUser?.name || apt.patientName,
        age: existingUser?.dob ? `${Math.max(18, new Date().getFullYear() - parseInt(existingUser.dob.slice(-4) || '1995'))} yrs` : 'Not available',
        gender: (existingUser?.gender as any) || 'Not available',
        contact: apt.patientPhone || existingUser?.phone || 'Not available',
        email: existingUser?.email || 'Not available',
        lastVisit: apt.date,
        nextAppointment: `${apt.date} ${apt.time}`,
        condition: existingUser?.chronicConditions || 'General Health Consultation',
        conditionType: existingUser?.chronicConditions && existingUser.chronicConditions !== 'None' ? 'Hypertension' : 'Normal',
        status: 'Active' as const,
        avatar: existingUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        bloodPressure: 'Not available',
        heartRate: 'Not available',
        weight: existingUser?.weight || 'Not available',
        height: existingUser?.height || 'Not available',
        diagnosedDate: 'Not available',
        appointmentCount: 1
      });
    } else {
      const p = patientMap.get(canonicalId)!;
      p.appointmentCount = (p.appointmentCount || 1) + 1;
      if (apt.status === 'Upcoming') {
        p.nextAppointment = `${apt.date} ${apt.time}`;
      }
    }
  }

  const basePatients: PatientItem[] = Array.from(patientMap.values());
  const [patientsList, setPatientsList] = useState<PatientItem[]>(basePatients);
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(basePatients[0] || null);

  useEffect(() => {
    setPatientsList(prev => {
      const inactiveIds = new Set(prev.filter(p => p.status === 'Inactive').map(p => p.id));
      const map = new Map<string, PatientItem>();
      for (const p of basePatients) {
        map.set(p.id, inactiveIds.has(p.id) ? { ...p, status: 'Inactive' } : p);
      }
      return Array.from(map.values());
    });
  }, [appointments, users]);

  const totalPatients = patientsList.length;
  const newPatientsCount = patientsList.filter(p => (p.appointmentCount || 0) === 1).length;
  const followUpCount = patientsList.filter(p => (p.appointmentCount || 0) > 1).length;
  const monitoredCasesCount = patientsList.filter(p => p.conditionType !== 'Normal').length;

  const [activeDetailTab, setActiveDetailTab] = useState<'Overview' | 'Medical History' | 'Consultations'>('Overview');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientCondition, setNewPatientCondition] = useState('Normal');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [medicalNoteText, setMedicalNoteText] = useState('');

  const handleDeactivate = (id: string) => {
    setPatientsList(prev => prev.map(p => p.id === id ? { ...p, status: 'Inactive' } : p));
    if (selectedPatient?.id === id) {
      setSelectedPatient(prev => prev ? { ...prev, status: 'Inactive' } : null);
    }
    alert('Patient record status updated to Inactive.');
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Patient ID', 'Name', 'Age', 'Gender', 'Contact', 'Email', 'Condition', 'Status', 'Last Visit'],
      ...filteredPatients.map(p => [p.patientId, p.name, p.age, p.gender, p.contact, p.email, p.condition, p.status, p.lastVisit])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "doctor_patients_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedPatient) return;
    alert(`Message sent to ${selectedPatient.name}: "${messageText}"`);
    setMessageText('');
    setShowMsgModal(false);
  };

  const handleAddMedicalNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalNoteText.trim() || !selectedPatient) return;
    alert(`Medical note added for ${selectedPatient.name}: "${medicalNoteText}"`);
    setMedicalNoteText('');
    setShowNoteModal(false);
  };

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Patient creation is not supported from the doctor portal. Patients must register through the patient signup portal.');
    setShowAddPatientModal(false);
  };

  const filteredPatients = patientsList.filter(pat => {
    const matchesSearch = pat.name.toLowerCase().includes(searchTerm.toLowerCase()) || pat.condition.toLowerCase().includes(searchTerm.toLowerCase()) || pat.contact.includes(searchTerm);
    const matchesTab = 
      activeTab === 'All Patients' ? true :
      activeTab === 'Follow-up' ? pat.conditionType === 'Follow-up' :
      activeTab === 'New Patients' ? pat.lastVisit.includes('Sep 2026') :
      activeTab === 'Critical Cases' ? pat.conditionType === 'Hypertension' || pat.conditionType === 'Arrhythmia' || pat.conditionType === 'Diabetes' :
      activeTab === 'Inactive' ? pat.status === 'Inactive' : true;
    const matchesGender = genderFilter === 'All Gender' || pat.gender === genderFilter;
    
    const ageNum = parseInt(pat.age.replace(/\D/g, '')) || 0;
    const matchesAge = 
      ageFilter === 'All Age Groups' ? true :
      ageFilter === '20 - 30 yrs' ? ageNum >= 20 && ageNum <= 30 :
      ageFilter === '30 - 40 yrs' ? ageNum >= 30 && ageNum <= 40 :
      ageFilter === '40+ yrs' ? ageNum >= 40 : true;

    const matchesCondition = conditionFilter === 'All Conditions' || pat.condition === conditionFilter;

    return matchesSearch && matchesTab && matchesGender && matchesAge && matchesCondition;
  });

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
              Patients Directory
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              View and manage your patients' clinical records and history
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddPatientModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition duration-200 flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add New Patient</span>
        </button>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalPatients}</span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Total Patients</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{newPatientsCount}</span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">New Patients</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{followUpCount}</span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Follow-up Patients</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xs border border-slate-200/80 flex items-center space-x-4">
          <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{monitoredCasesCount}</span>
            <span className="block text-xs font-bold text-slate-400 mt-0.5">Monitored Cases</span>
          </div>
        </div>
      </div>

      {/* Main Patients Table & Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
              {(['All Patients', 'Follow-up', 'New Patients', 'Critical Cases', 'Inactive'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition duration-200 whitespace-nowrap cursor-pointer ${activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center space-x-2 cursor-pointer shrink-0 shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Export List</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option>All Gender</option>
              <option>Female</option>
              <option>Male</option>
            </select>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option>All Age Groups</option>
              <option>20 - 30 yrs</option>
              <option>30 - 40 yrs</option>
              <option>40+ yrs</option>
            </select>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option>All Conditions</option>
              <option>Hypertension</option>
              <option>Arrhythmia</option>
              <option>Normal</option>
              <option>Diabetes</option>
              <option>High Cholesterol</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-12">#</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Age/Gender</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Last Visit</th>
                  <th className="py-3.5 px-4">Next Appointment</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-bold">No patients found matching your search criteria.</td>
                  </tr>
                ) : (
                  filteredPatients.map((pat, index) => (
                    <tr
                      key={`${pat.id}-${index}`}
                      onClick={() => setSelectedPatient(pat)}
                      className={`hover:bg-blue-50/50 transition cursor-pointer relative ${selectedPatient?.id === pat.id ? 'bg-blue-50/80' : ''}`}
                    >
                      <td className="py-4 px-3 font-bold text-slate-400">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <img src={pat.avatar} alt={pat.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" />
                          <div>
                            <span className="block font-extrabold text-slate-900">{pat.name}</span>
                            <span className="block text-[10px] font-bold text-slate-400">{pat.patientId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">{pat.age} / {pat.gender}</td>
                      <td className="py-4 px-4 font-medium text-slate-600">{pat.contact}</td>
                      <td className="py-4 px-4 font-medium text-slate-600">{pat.lastVisit}</td>
                      <td className="py-4 px-4 font-medium text-slate-800">{pat.nextAppointment}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold ${
                          pat.conditionType === 'Hypertension' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          pat.conditionType === 'Arrhythmia' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          pat.conditionType === 'Normal' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          pat.conditionType === 'Diabetes' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {pat.condition}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const userRecord = users.find(u => u.id === pat.id || u.id === pat.patientId) || pat;
                            setSelectedPatient(pat);
                            setSelectedPatientForDetail(userRecord);
                            setCurrentScreen('patient-record-detail');
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                          <span>View EHR</span>
                        </button>

                        <button
                          onClick={() => setActionMenuOpenId(actionMenuOpenId === pat.id ? null : pat.id)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer inline-block align-middle"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {actionMenuOpenId === pat.id && (
                          <div className="absolute right-4 top-14 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-30 text-left animate-in fade-in zoom-in-95 duration-150">
                            <button
                              onClick={() => {
                                const userRecord = users.find(u => u.id === pat.id || u.id === pat.patientId) || pat;
                                setSelectedPatient(pat);
                                setSelectedPatientForDetail(userRecord);
                                setActionMenuOpenId(null);
                                setCurrentScreen('patient-record-detail');
                              }}
                              className="w-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition flex items-center space-x-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Profile</span>
                            </button>
                            <button
                              onClick={() => { setSelectedPatient(pat); setShowMsgModal(true); setActionMenuOpenId(null); }}
                              className="w-full px-4 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition flex items-center space-x-2"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                              <span>Send Message</span>
                            </button>
                            <button
                              onClick={() => { handleDeactivate(pat.id); setActionMenuOpenId(null); }}
                              className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center space-x-2"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
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
        </div>

        {/* Right Side Patient Detail Panel */}
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/80 p-6 space-y-6 sticky top-28">
          {!selectedPatient ? (
            <div className="text-center py-20 text-slate-400 font-bold space-y-2">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-xs">Click any patient row to view their detailed medical profile and vitals.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <img src={selectedPatient.avatar} alt={selectedPatient.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500 shadow-sm" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-base text-slate-900">{selectedPatient.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">{selectedPatient.status}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500">{selectedPatient.age} | {selectedPatient.gender} • {selectedPatient.patientId}</p>
                    <p className="text-[11px] font-medium text-blue-600 mt-0.5">{selectedPatient.contact}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto">
                {(['Overview', 'Medical History', 'Consultations'] as const).map(dt => (
                  <button
                    key={dt}
                    onClick={() => setActiveDetailTab(dt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${activeDetailTab === dt ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {dt}
                  </button>
                ))}
              </div>

              {activeDetailTab === 'Overview' ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Blood Pressure</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">{selectedPatient.bloodPressure}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        <span>Heart Rate</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">{selectedPatient.heartRate}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                        <span>Weight</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">{selectedPatient.weight}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-extrabold uppercase">
                        <span>Height</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-900">{selectedPatient.height}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl border border-rose-200/60 space-y-1">
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase">Primary Condition</span>
                    <h4 className="font-extrabold text-sm text-slate-900">{selectedPatient.condition}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Diagnosed: {selectedPatient.diagnosedDate}</p>
                  </div>
                </div>
              ) : activeDetailTab === 'Medical History' ? (
                <div className="space-y-3 py-4 text-xs text-slate-700">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="font-extrabold text-slate-900 block mb-1">Medical Record History</span>
                    <p className="text-slate-600">Stable cardiovascular profile. Routine review advised.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-4 text-xs text-slate-700">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 block">General Clinical Consultation</span>
                      <span className="text-[11px] text-slate-500">In-Clinic Visit • Recorded 25 Sep 2026</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentScreen('doctor-calendar')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>Schedule Consultation</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Add Medical Note</span>
                  </button>
                  <button
                    onClick={() => setShowMsgModal(true)}
                    className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Send Message</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add New Patient</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPatientSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Condition / Status</label>
                <select
                  value={newPatientCondition}
                  onChange={(e) => setNewPatientCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option>Normal</option>
                  <option>Hypertension</option>
                  <option>Arrhythmia</option>
                  <option>Diabetes</option>
                  <option>High Cholesterol</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMsgModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Send Message to {selectedPatient.name}</h3>
              <button onClick={() => setShowMsgModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendMessageSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message or follow-up instructions..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowMsgModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medical Note Modal */}
      {showNoteModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Add Medical Note: {selectedPatient.name}</h3>
              <button onClick={() => setShowNoteModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMedicalNoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical Observation & Note</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter clinical note, symptoms, or vitals observation..."
                  value={medicalNoteText}
                  onChange={(e) => setMedicalNoteText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowNoteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Medical Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
