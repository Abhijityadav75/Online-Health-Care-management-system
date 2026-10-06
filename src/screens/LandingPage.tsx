import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, Calendar, Stethoscope, FileText, Shield, Users, Lock,
  ChevronRight, Activity, Clock, CheckCircle2, Heart,
  HelpCircle, ChevronDown, Sparkles, X, Star
} from 'lucide-react';
import { matchesDoctorSearch } from '../utils/doctorSearch';

export const LandingPage: React.FC = () => {
  const { 
    currentUser, 
    setCurrentScreen, 
    users, 
    setDoctorSearchQuery, 
    startBookingWithDoctor,
    setDoctorSpecialtyFilter
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const approvedDoctors = Array.from(new Map(users.filter(u => u.role === 'doctor' && u.approvalStatus === 'APPROVED').map(d => [d.id, d])).values());
  const matchingDoctors = searchTerm.trim()
    ? approvedDoctors.filter(doc => matchesDoctorSearch(doc, searchTerm))
    : [];

  const handleConsultDepartment = (deptName: string) => {
    setDoctorSpecialtyFilter(deptName);
    setDoctorSearchQuery('');
    setCurrentScreen('doctors');
  };

  const handleAction = (screen: string) => {
    if (!currentUser) {
      setCurrentScreen('login');
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setDoctorSearchQuery(searchTerm.trim());
      setCurrentScreen('doctors');
    } else {
      handleAction('patient-book');
    }
  };

  const departments = [
    { name: 'Cardiology', icon: Heart, desc: 'Heart rhythm monitoring, consultation & cardiology checkups.' },
    { name: 'General Medicine', icon: Stethoscope, desc: 'General consultations, seasonal health & routine clinical checkups.' },
    { name: 'Dermatology', icon: Sparkles, desc: 'Skin health, clinical dermatology & allergy checkups.' },
    { name: 'Orthopedics', icon: Activity, desc: 'Joint mobility, bone health, rehabilitation & spine care.' },
  ];

  const testimonials = [
    {
      name: 'Priya Narayanan',
      role: 'Cardiac Patient',
      comment: 'Booking Dr. Ananya Sharma was straightforward. Being able to access consultation notes directly in the portal is very convenient.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: 'Rajesh Malhotra',
      role: 'Patient',
      comment: 'The clear appointment scheduling and structured records make managing routine checkups dependable and easy.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: 'Anita Sen',
      role: 'Patient',
      comment: 'Easy to browse available doctors, check consultation fees, and receive in-app booking confirmation immediately.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    }
  ];

  // Specific FAQs according to project requirements (3 core questions kept)
  const faqs = [
    {
      q: 'How does appointment booking work on MediCare?',
      a: 'Select your preferred doctor or specialty, pick an upcoming date and time slot from the calendar, and confirm your visit. You receive immediate in-app confirmation and booking details.'
    },
    {
      q: 'Can doctors manage their own availability and leaves?',
      a: 'Yes. Physicians have a dedicated doctor portal to configure working hours, break slots, set days as available or absent, and block specific leave dates.'
    },
    {
      q: 'How are medical records protected?',
      a: 'The system uses Role-Based Access Control (RBAC) to enforce separation of concerns. Patient records are accessible only to the authenticated patient and authorized attending physicians, with input and date validation across all flows.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col space-y-12 sm:space-y-16 pb-16 overflow-x-hidden w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 pt-10 sm:pt-16 pb-16 sm:pb-20 border-b border-slate-200/60 w-full">
        <div className="w-full px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-blue-100/80 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Online Healthcare Management System</span>
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Your Health <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Our Priority</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Book appointments with registered doctors, manage health records, consult specialists, and track visits with MediCare.
              </p>

              {/* Search Box & Live Homepage Results */}
              <div className="relative max-w-xl mx-auto lg:mx-0 w-full z-20">
                <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex items-center space-x-3 px-3 py-2 flex-1 w-full">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search doctors, specialties (e.g. Cardiology, Dr. Ananya)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </form>

                {/* Instant Live Homepage Search Results */}
                {searchTerm.trim().length > 0 && (
                  <div className="mt-3 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    {matchingDoctors.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
                          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                            Found {matchingDoctors.length} {matchingDoctors.length === 1 ? 'Doctor' : 'Doctors'} for "{searchTerm}"
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDoctorSearchQuery(searchTerm.trim());
                              setCurrentScreen('doctors');
                            }}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Open in Directory</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                          {matchingDoctors.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={doc.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
                                  alt={doc.name}
                                  className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-500/20 shrink-0"
                                />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-sm text-slate-900">{doc.name}</h4>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">
                                      {doc.specialization}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {doc.hospital || 'MediCare Clinic'} • {doc.experience || 8}+ yrs exp
                                  </p>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5 font-medium">
                                    <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                      ★ {doc.rating || 4.8}
                                    </span>
                                    <span>• Fee: ₹{doc.consultationFee || 800}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => startBookingWithDoctor(doc.id)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap cursor-pointer self-start sm:self-center"
                              >
                                Book Consultation
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-6 px-4 text-center space-y-2">
                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900">No doctors found.</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          No doctors match "{searchTerm}". Try searching for specializations like{' '}
                          <button
                            type="button"
                            onClick={() => setSearchTerm('Cardiology')}
                            className="font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Cardiology
                          </button>
                          ,{' '}
                          <button
                            type="button"
                            onClick={() => setSearchTerm('Dermatology')}
                            className="font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Dermatology
                          </button>
                          , or doctor names like{' '}
                          <button
                            type="button"
                            onClick={() => setSearchTerm('Dr. Ananya')}
                            className="font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Dr. Ananya
                          </button>
                          .
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3 Quick Action Shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-xl mx-auto lg:mx-0">
                <button
                  onClick={() => handleAction('patient-book')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition text-center flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-800">Book In-Clinic</h4>
                </button>
                <button
                  onClick={() => setCurrentScreen('doctors')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition text-center flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-800">Find Doctors</h4>
                </button>
                <button
                  onClick={() => handleAction('patient-records')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 hover:shadow-md transition text-center flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-800">Medical Records</h4>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Doctor Portrait Image */}
            <div className="lg:col-span-5 relative flex justify-center w-full">
              <div className="relative w-full max-w-lg">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl opacity-20 blur-2xl"></div>
                 <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-blue-50 h-[420px] sm:h-[480px]">
                  <img
                    src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=1200"
                    alt="Dr. Rakesh Sharma"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
                  
                  {/* Floating Doctor Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">Dr. Rakesh Sharma & Doctor Team</h4>
                        <p className="text-[11px] text-slate-500">Registered Medical Doctors Available for In-Clinic Visits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section (Neutral Project Stats) */}
      <section className="bg-white border-y border-slate-200/80 py-8 shadow-xs w-full">
        <div className="w-full px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-slate-100">
            <div className="flex items-center justify-center space-x-3 px-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-extrabold text-slate-900">{approvedDoctors.length}</h3>
                <p className="text-xs font-semibold text-slate-500">Registered Doctors</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3 px-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-extrabold text-slate-900">{departments.length}</h3>
                <p className="text-xs font-semibold text-slate-500">Medical Specialties</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3 px-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-extrabold text-slate-900">Validated</h3>
                <p className="text-xs font-semibold text-slate-500">Calendar Slots</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3 px-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-extrabold text-slate-900">RBAC</h3>
                <p className="text-xs font-semibold text-slate-500">Role-Based Access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Departments Section */}
      <section className="w-full px-6 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Clinical Departments</h2>
            <p className="text-sm text-slate-600 mt-1">Explore medical departments and book consultations with available physicians.</p>
          </div>
          <button
            onClick={() => handleConsultDepartment('All')}
            className="text-xs font-extrabold text-blue-600 hover:underline cursor-pointer flex items-center space-x-1"
          >
            <span>All Specialists</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {departments.map((dept, idx) => {
            const IconC = dept.icon;
            return (
              <div
                key={idx}
                onClick={() => handleConsultDepartment(dept.name)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-lg transition cursor-pointer group space-y-4"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <IconC className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition">{dept.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{dept.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                    Consult Specialists <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How Appointment Management Works Section */}
      <section className="w-full px-6 sm:px-10 lg:px-16">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-100/80 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Seamless Consultation Flow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Appointment Management Works
          </h2>
          <p className="text-sm text-slate-600">
            A simple 4-step digital workflow designed to connect you with doctors and manage your consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 01 Find a Doctor */}
          <div 
            onClick={() => setCurrentScreen('doctors')}
            className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  01
                </span>
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <Search className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                Find a Doctor
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter and browse registered doctors across departments, qualifications, experience, and ratings.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <span className="inline-flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition gap-1">
                Browse Specialists <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 02 Check Availability */}
          <div 
            onClick={() => handleAction('patient-book')}
            className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-500">
                  02
                </span>
                <div className="w-11 h-11 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-cyan-600 transition">
                Check Availability
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                View real-time doctor availability calendars, upcoming open working days, and available consultation time slots.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <span className="inline-flex items-center text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition gap-1">
                Check Schedules <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 03 Book Appointment */}
          <div 
            onClick={() => handleAction('patient-book')}
            className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600">
                  03
                </span>
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                Book Appointment
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select your preferred date, choose an open time slot, specify reason for consultation, and receive instant booking confirmation.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <span className="inline-flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition gap-1">
                Book Instantly <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 04 Manage Appointment */}
          <div 
            onClick={() => handleAction('patient-appointments')}
            className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-500 hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                  04
                </span>
                <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition">
                Manage Appointment
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Easily reschedule dates, cancel appointments if plans change, track visit status, and review consultation details.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <span className="inline-flex items-center text-xs font-bold text-purple-600 group-hover:translate-x-1 transition gap-1">
                Manage Appointments <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Testimonials */}
      <section className="w-full px-6 sm:px-10 lg:px-16">
        <div className="mb-8 text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Patient Experiences</h2>
          <p className="text-sm text-slate-600">Feedback from patients using MediCare for their consultations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {'★'.repeat(t.rating)}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium italic">"{t.comment}"</p>
              </div>
              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-2xl object-cover border" />
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="w-full px-6 sm:px-10 lg:px-16 max-w-4xl mx-auto">
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-600">Common questions about doctors, clinic appointments, and data access.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-extrabold text-xs sm:text-sm text-slate-900 hover:text-blue-600 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
