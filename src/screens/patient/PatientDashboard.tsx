import React from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, FileText, Stethoscope, Heart, ChevronRight, Sparkles, Droplet, ShieldCheck, HeartPulse, Scale, Bell, User as UserIcon } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { setCurrentScreen, currentUser, appointments, medicalRecords, users, updateAppointmentStatus } = useApp();

  const userName = currentUser?.name || 'Patient';
  const patientAppointments = appointments.filter(a => a.patientId === currentUser?.id);
  const patientRecords = medicalRecords.filter(r => r.patientId === currentUser?.id);

  const upcomingAppointments = patientAppointments.filter(a => a.status === 'Upcoming');
  const completedAppointments = patientAppointments.filter(a => a.status === 'Completed');
  const pastAppointments = patientAppointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled');
  const availableDoctors = users.filter(u => u.role === 'doctor' && u.approvalStatus === 'APPROVED');
  const recentConsultations = patientRecords.filter(r => r.type === 'Consultation');

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 py-10 space-y-10 bg-slate-50/50 min-h-screen">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-8 sm:p-10 text-white shadow-2xl overflow-hidden flex flex-col lg:flex-row items-center justify-between">
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4 max-w-xl text-center lg:text-left mb-8 lg:mb-0">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/25 text-xs font-bold text-cyan-200">
            <Sparkles className="w-4 h-4" />
            <span>MediCare Patient Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">{userName}</span>
          </h1>
          <p className="text-sm sm:text-base text-blue-100 font-medium leading-relaxed">
            Your health dashboard is up to date. Access consultations, medical records, and expert practitioners.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 text-xs font-semibold">
            <button 
              onClick={() => setCurrentScreen('patient-book')}
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-2xl font-extrabold shadow-lg transition duration-200 flex items-center space-x-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Book Appointment</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('patient-appointments')}
              className="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl font-extrabold shadow-lg transition duration-200 flex items-center space-x-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>My Appointments</span>
            </button>
            <button 
              onClick={() => setCurrentScreen('patient-records')}
              className="px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/25 rounded-2xl font-extrabold transition duration-200 flex items-center space-x-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-200" />
              <span>Medical Records</span>
            </button>
          </div>
        </div>

        {/* Doctor Illustration Avatar */}
        <div className="relative z-10 shrink-0">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-75 blur-md animate-pulse"></div>
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-white/80 shadow-2xl bg-blue-100">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
                alt="Doctor Portrait"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setCurrentScreen('patient-appointments')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition duration-300 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-600 flex items-center group-hover:translate-x-1 transition duration-200">
              View All <ChevronRight className="w-4 h-4 ml-0.5" />
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Appointments</h4>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{upcomingAppointments.length}</p>
        </div>

        <div 
          onClick={() => setCurrentScreen('patient-appointments')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition duration-300 shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center group-hover:translate-x-1 transition duration-200">
              View History <ChevronRight className="w-4 h-4 ml-0.5" />
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Past Appointments</h4>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{completedAppointments.length}</p>
        </div>

        <div 
          onClick={() => setCurrentScreen('patient-records')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition duration-300 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center group-hover:translate-x-1 transition duration-200">
              View All <ChevronRight className="w-4 h-4 ml-0.5" />
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medical Records</h4>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{patientRecords.length}</p>
        </div>

        <div 
          onClick={() => setCurrentScreen('doctors')}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-300 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition duration-300 shadow-sm">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-cyan-600 flex items-center group-hover:translate-x-1 transition duration-200">
              View Doctors <ChevronRight className="w-4 h-4 ml-0.5" />
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consulting Doctors</h4>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{availableDoctors.length}</p>
        </div>
      </div>

      {/* Main Grid: Left & Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Upcoming Appointments Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Upcoming Appointments</h3>
              <button 
                onClick={() => setCurrentScreen('patient-appointments')}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No upcoming appointments scheduled</p>
                  <p className="text-xs text-slate-500 mt-1">Book a consultation with our doctors in just a few clicks.</p>
                  <button
                    onClick={() => setCurrentScreen('patient-book')}
                    className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Appointment</span>
                  </button>
                </div>
              ) : (
                upcomingAppointments.slice(0, 3).map((apt) => {
                  const doctorInfo = users.find(u => u.id === apt.doctorId || u.name === apt.doctorName);
                  const hospitalName = doctorInfo?.hospital || 'Medicare Clinic & Medical Center';

                  return (
                    <div key={apt.id} className="p-5 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-blue-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition">
                      <div className="flex items-center space-x-4">
                        <img
                          src={apt.doctorAvatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
                          alt={apt.doctorName}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-sm text-slate-900">{apt.doctorName}</h4>
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Confirmed</span>
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 font-semibold mt-0.5">{apt.doctorSpecialization}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{hospitalName}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>{apt.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>{apt.time}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              <span>{apt.type}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
                        <button 
                          onClick={() => setCurrentScreen('patient-appointments')}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to cancel your appointment with ${apt.doctorName}?`)) {
                              updateAppointmentStatus(apt.id, 'Cancelled');
                            }
                          }}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Consultations Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Recent Consultations</h3>
              <button 
                onClick={() => setCurrentScreen('patient-records')}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              {recentConsultations.length === 0 && pastAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium">
                  <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs">No completed consultations recorded yet.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Consultation</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {(recentConsultations.length > 0 ? recentConsultations.slice(0, 3) : pastAppointments.slice(0, 3)).map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-4 px-4 flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <span className="text-slate-900 font-bold">{item.description || item.reason || 'Medical Consultation'}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{item.doctorName}</td>
                        <td className="py-4 px-4 text-slate-500">{item.date}</td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => setCurrentScreen(item.description ? 'patient-records' : 'patient-appointments')}
                            className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl font-bold transition cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Quick Actions Grid */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => setCurrentScreen('patient-book')}
                className="p-4 bg-slate-50/80 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col items-center text-center transition-all duration-200 group cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition duration-200 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">Book Appointment</span>
              </button>

              <button 
                onClick={() => setCurrentScreen('patient-appointments')}
                className="p-4 bg-slate-50/80 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col items-center text-center transition-all duration-200 group cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition duration-200 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">My Appointments</span>
              </button>

              <button 
                onClick={() => setCurrentScreen('doctors')}
                className="p-4 bg-slate-50/80 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col items-center text-center transition-all duration-200 group cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition duration-200 shadow-xs">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">Find a Doctor</span>
              </button>

              <button 
                onClick={() => setCurrentScreen('patient-records')}
                className="p-4 bg-slate-50/80 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col items-center text-center transition-all duration-200 group cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition duration-200 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">Medical History</span>
              </button>

              <button 
                onClick={() => setCurrentScreen('patient-profile')}
                className="p-4 bg-slate-50/80 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col items-center text-center transition-all duration-200 group cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition duration-200 shadow-xs">
                  <UserIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">My Profile</span>
              </button>

              <button 
                onClick={() => setCurrentScreen('notifications')}
                className="p-4 bg-slate-50/80 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl flex flex-col items-center text-center transition-all duration-200 group cursor-pointer shadow-2xs"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition duration-200 shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">Notifications</span>
              </button>
            </div>
          </div>

          {/* Health Tips Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Daily Wellness Tip</h3>
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 flex items-center space-x-4 shadow-xs">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <Heart className="w-7 h-7 fill-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-slate-900">Stay Hydrated & Active</h4>
                <p className="text-xs text-slate-600 mt-0.5">Drink sufficient water daily and maintain light physical activity to support overall wellness.</p>
              </div>
            </div>
          </div>

          {/* Health Summary Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Health Summary</h3>
              <button 
                onClick={() => setCurrentScreen('patient-profile')}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <Droplet className="w-6 h-6 fill-rose-100" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{currentUser?.bloodGroup || 'B+'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Allergies</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{currentUser?.allergies || 'None Known'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chronic Conditions</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{currentUser?.chronicConditions || 'None'}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BMI</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">22.4 <span className="text-xs font-semibold text-slate-500">(Normal)</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
