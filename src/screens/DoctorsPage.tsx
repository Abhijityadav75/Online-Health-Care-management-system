import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, MapPin, ArrowRight, Search, Filter, X } from 'lucide-react';
import { User } from '../types';
import { matchesDoctorSearch, matchesSpecialty } from '../utils/doctorSearch';

export const DoctorsPage: React.FC = () => {
  const { 
    users, 
    startBookingWithDoctor, 
    doctorSearchQuery, 
    setDoctorSearchQuery,
    doctorSpecialtyFilter,
    setDoctorSpecialtyFilter
  } = useApp();

  const [searchTerm, setSearchTerm] = useState(doctorSearchQuery || '');
  const [specialtyFilter, setSpecialtyFilter] = useState(doctorSpecialtyFilter || 'All');
  const [viewDoctorModal, setViewDoctorModal] = useState<User | null>(null);

  useEffect(() => {
    if (doctorSearchQuery !== undefined) {
      setSearchTerm(doctorSearchQuery);
    }
  }, [doctorSearchQuery]);

  useEffect(() => {
    if (doctorSpecialtyFilter) {
      setSpecialtyFilter(doctorSpecialtyFilter);
    }
  }, [doctorSpecialtyFilter]);

  const approvedDoctors = Array.from(new Map(users.filter(u => u.role === 'doctor' && u.approvalStatus === 'APPROVED').map(d => [d.id, d])).values());
  const standardDepartments = ['Cardiology', 'General Medicine', 'Dermatology', 'Orthopedics'];
  const doctorSpecs = approvedDoctors.map(d => d.specialization).filter(Boolean) as string[];
  const specializations = ['All', ...Array.from(new Set([...standardDepartments, ...doctorSpecs]))];

  const filteredDoctors = approvedDoctors.filter(doc => {
    const matchesSearch = !searchTerm.trim() ? true : matchesDoctorSearch(doc, searchTerm);
    const matchesSpec = matchesSpecialty(doc.specialization, specialtyFilter);
    return matchesSearch && matchesSpec;
  });

  const handleSpecialtyChange = (newVal: string) => {
    setSpecialtyFilter(newVal);
    setDoctorSpecialtyFilter(newVal);
  };

  const handleBook = (doctor: User) => {
    startBookingWithDoctor(doctor.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <span>Registered Physicians</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Doctors Directory</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Browse registered doctors in the system, check specializations and consultation fees, and carry your selected doctor into appointment booking.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, clinic..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDoctorSearchQuery(e.target.value);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDoctorSearchQuery('');
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={specialtyFilter}
              onChange={(e) => handleSpecialtyChange(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-auto cursor-pointer"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec === 'All' ? 'All Specializations' : spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(specialtyFilter !== 'All' || searchTerm.trim()) && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-xs">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-bold text-blue-900">Active Filters:</span>
              {specialtyFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white font-bold rounded-lg shadow-xs">
                  <span>Specialization: {specialtyFilter}</span>
                  <button
                    onClick={() => handleSpecialtyChange('All')}
                    className="hover:opacity-80 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-white font-bold rounded-lg shadow-xs">
                  <span>Query: "{searchTerm}"</span>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDoctorSearchQuery('');
                    }}
                    className="hover:opacity-80 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={() => {
                handleSpecialtyChange('All');
                setSearchTerm('');
                setDoctorSearchQuery('');
              }}
              className="text-blue-700 font-extrabold hover:underline cursor-pointer ml-3 shrink-0"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Doctors Vertical List */}
        <div className="space-y-4">
          {filteredDoctors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">No doctors found.</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No specialists match your search criteria. Try searching for <span className="font-semibold text-blue-600">Cardiology</span>, <span className="font-semibold text-blue-600">Dermatology</span>, or <span className="font-semibold text-blue-600">Dr. Ananya</span>.
              </p>
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setDoctorSearchQuery(''); }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredDoctors.map((doc) => (
              <div 
                key={doc.id} 
                data-testid={`doctor-card-${doc.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={doc.avatar || doc.profile_photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"}
                    alt={doc.name}
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400";
                    }}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-sm shrink-0 cursor-pointer"
                    onClick={() => setViewDoctorModal(doc)}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 
                        onClick={() => setViewDoctorModal(doc)}
                        className="font-bold text-base text-slate-900 hover:text-blue-600 cursor-pointer transition"
                      >
                        {doc.name}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        In-clinic
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-blue-600">
                      {doc.specialization} {doc.qualification ? `• ${doc.qualification}` : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.experience || 8}+ Years Experience • ★ {doc.rating || 4.8} ({doc.reviewsCount || 120} reviews)
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.hospital || 'MediCare Clinic & Medical Center'}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-semibold text-emerald-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Available Today</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center space-x-1 font-extrabold text-slate-900 text-base">
                      <span>₹ {doc.consultationFee || 700}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Consultation Fee</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewDoctorModal(doc)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleBook(doc)}
                      data-testid={`book-${doc.id}`}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-md cursor-pointer flex items-center space-x-1"
                      title={`Book with ${doc.name}`}
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Doctor Profile Modal */}
      {viewDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <img
                  src={viewDoctorModal.avatar || viewDoctorModal.profile_photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"}
                  alt={viewDoctorModal.name}
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400";
                  }}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-md shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{viewDoctorModal.name}</h3>
                  <p className="text-xs font-semibold text-blue-600">{viewDoctorModal.specialization}</p>
                  <p className="text-xs text-slate-500">{viewDoctorModal.qualification || 'MBBS, MD'}</p>
                </div>
              </div>
              <button
                onClick={() => setViewDoctorModal(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Experience</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">{viewDoctorModal.experience || 8}+ years</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Consultation Fee</span>
                <span className="font-extrabold text-slate-900 mt-0.5 block">₹{viewDoctorModal.consultationFee || 700}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Clinic / Hospital</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{viewDoctorModal.hospital || 'MediCare Clinic & Medical Center'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Available Days</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">Mon–Sat</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Available Hours</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">09:00 AM – 04:30 PM</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                <span className="block text-slate-400 font-bold uppercase text-[10px]">Rating & Reviews</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">★ {viewDoctorModal.rating || 4.8} ({viewDoctorModal.reviewsCount || 120} reviews)</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDoctorModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const doc = viewDoctorModal;
                  setViewDoctorModal(null);
                  handleBook(doc);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer flex items-center space-x-1.5"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
