import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { appointmentApi } from '../../api/appointmentApi';
import { Search, ArrowRight, ArrowLeft, Filter, MapPin, AlertCircle, CalendarDays, Clock, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../../types';
import { jsPDF } from 'jspdf';
import { 
  getTodayIsoString, 
  getInitialBookingDate, 
  formatDateForDisplay, 
  formatDateToIso, 
  parseDateString,
  isPastDate, 
  isTodayDate, 
  isTimeSlotPast, 
  getFirstAvailableSlot, 
  getNow,
  generateDoctorTimeSlots,
  STANDARD_TIME_SLOTS
} from '../../utils/dateUtils';

export const BookAppointmentWizard: React.FC = () => {
  const { 
    currentUser, 
    users, 
    appointments, 
    weeklySchedule, 
    blockedDates, 
    maxPatientsPerSlot,
    refreshPatientAppointments, 
    setCurrentScreen, 
    goBack, 
    selectedDoctorIdForBooking, 
    setSelectedDoctorIdForBooking,
    bookAppointment
  } = useApp();
  
  const initialBooking = getInitialBookingDate();
  const doctors = Array.from(new Map(users.filter(u => u.role === 'doctor' && u.approvalStatus === 'APPROVED').map(d => [d.id, d])).values());

  const [step, setStep] = useState<number>(() => (selectedDoctorIdForBooking ? 2 : 1));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => (selectedDoctorIdForBooking || (doctors[0]?.id || '')));

  useEffect(() => {
    if (selectedDoctorIdForBooking) {
      setSelectedDoctorId(selectedDoctorIdForBooking);
      setStep(2);
    }
  }, [selectedDoctorIdForBooking]);

  const [selectedDateIso, setSelectedDateIso] = useState<string>(initialBooking.iso);
  const [selectedDate, setSelectedDate] = useState<string>(initialBooking.display);
  const [dateError, setDateError] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('10:30 AM');
  const [appointmentType, setAppointmentType] = useState<'In-clinic' | 'General Consultation' | 'Follow-up'>('In-clinic');
  const [reason, setReason] = useState('Routine health checkup and consultation');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [bookedReceiptAppointment, setBookedReceiptAppointment] = useState<Appointment | null>(null);

  const handleDownloadReceiptPDF = () => {
    if (!bookedReceiptAppointment || !selectedDoctor) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color palette
    const primaryColor = [13, 110, 253]; // Blue (#0d6efd)
    const darkColor = [33, 37, 41]; // Slate dark (#212529)
    const lightBg = [248, 249, 250]; // Light gray background
    const borderCol = [222, 226, 230]; // Light border

    // Background decoration card
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(15, 15, 180, 260, 5, 5, 'F');

    // Header section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('MediCare', 105, 32, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('ONLINE HEALTHCARE MANAGEMENT SYSTEM', 105, 38, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('APPOINTMENT RECEIPT', 105, 48, { align: 'center' });

    // Dividers
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.setLineWidth(0.5);
    doc.line(25, 54, 185, 54);

    // Grid details
    const labelX = 30;
    const valueX = 110;
    let startY = 65;
    const rowHeight = 12;

    const items = [
      { label: 'Appointment ID:', value: bookedReceiptAppointment.id },
      { label: 'Patient:', value: currentUser?.name || 'Harish' },
      { label: 'Doctor:', value: selectedDoctor.name || bookedReceiptAppointment.doctorName },
      { label: 'Specialization:', value: selectedDoctor.specialization || bookedReceiptAppointment.doctorSpecialization || 'Cardiologist' },
      { label: 'Clinic:', value: selectedDoctor.hospital || 'MediCare Clinic & Medical Center' },
      { label: 'Appointment Date:', value: bookedReceiptAppointment.date },
      { label: 'Appointment Time:', value: bookedReceiptAppointment.time },
      { label: 'Appointment Type:', value: bookedReceiptAppointment.type || 'In-clinic' },
      { label: 'Reason:', value: bookedReceiptAppointment.reason || 'Routine consultation' },
      { label: 'Consultation Fee:', value: `Rs. ${selectedDoctor.consultationFee || 800}` },
      { label: 'Payment Status:', value: 'PENDING' },
      { label: 'Payment Method:', value: 'Cash / Online (Pending)' },
      { label: 'Status:', value: 'CONFIRMED' },
      { label: 'Booked On:', value: bookedReceiptAppointment.createdAt || getTodayIsoString() }
    ];

    items.forEach((item, index) => {
      // Draw light background for alternating rows
      if (index % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(25, startY - 6, 160, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, labelX, startY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      // Handle color coding for status values
      if (item.label === 'Status:' || item.label === 'Payment Status:') {
        doc.setFont('helvetica', 'bold');
        if (item.value === 'CONFIRMED') {
          doc.setTextColor(16, 185, 129); // Green
        } else if (item.value === 'PENDING') {
          doc.setTextColor(245, 158, 11); // Amber
        }
      }

      doc.text(String(item.value), valueX, startY);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]); // reset text color
      
      // Draw light line after row
      doc.setDrawColor(241, 245, 249);
      doc.line(25, startY + rowHeight - 6, 185, startY + rowHeight - 6);

      startY += rowHeight;
    });

    // Footer signature / barcode simulation
    startY += 10;
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(25, startY, 185, startY);

    startY += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated receipt, no signature is required.', 105, startY, { align: 'center' });
    
    startY += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Thank you for choosing MediCare!', 105, startY, { align: 'center' });

    // Save File
    doc.save(`Medicare-Appointment-Receipt-${bookedReceiptAppointment.id}.pdf`);
  };

  const filteredDoctors = Array.from(new Map(doctors.filter((doc: any) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.specialization?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (doc.hospital?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesSpec = specialtyFilter === 'All' || doc.specialization === specialtyFilter;
    return matchesSearch && matchesSpec;
  }).map(d => [d.id, d])).values());

  const selectedDoctor = users.find(u => u.id === selectedDoctorId) || doctors[0] || ({} as any);

  const getDoctorAvailabilityForDate = (iso: string) => {
    // 1. Check blocked dates (e.g. 2026-10-02, 2026-10-15)
    const blocked = blockedDates.find(b => b.date === iso);
    if (blocked) {
      return { available: false, reason: blocked.reason || 'Leave / Holiday' };
    }
    // 2. Check weekly schedule (e.g. Saturday, Sunday marked absent)
    const d = parseDateString(iso);
    if (d) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const daySched = weeklySchedule.find(s => s.day.toLowerCase() === dayName.toLowerCase());
      if (daySched && !daySched.available) {
        return { available: false, reason: `${dayName} (Marked Absent)` };
      }
    }
    return { available: true };
  };

  const currentDayAvailability = getDoctorAvailabilityForDate(selectedDateIso);

  const bookedTimesForDoctorOnDate = appointments
    .filter(a => {
      const docMatch = a.doctorId === selectedDoctor.id || a.doctorName.toLowerCase().replace(/^(dr\.?\s*)/i, '').trim() === (selectedDoctor.name || '').toLowerCase().replace(/^(dr\.?)\s*/i, '').trim();
      if (!docMatch) return false;
      const aptIso = formatDateToIso(a.date);
      const isSameDate = aptIso === selectedDateIso || a.date === selectedDate;
      return isSameDate && a.status !== 'Cancelled';
    })
    .map(a => a.time);

  const getDoctorSlotsForDate = (iso: string) => {
    const avail = getDoctorAvailabilityForDate(iso);
    if (!avail.available) return [];
    const d = parseDateString(iso);
    if (!d) return STANDARD_TIME_SLOTS;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const daySched = weeklySchedule.find(s => s.day.toLowerCase() === dayName.toLowerCase());
    if (daySched) {
      return generateDoctorTimeSlots(
        daySched.startTime || '09:00 AM',
        daySched.endTime || '05:00 PM',
        daySched.breakStart,
        daySched.breakEnd,
        30
      );
    }
    return STANDARD_TIME_SLOTS;
  };

  const availableSlots = getDoctorSlotsForDate(selectedDateIso);

  const handleDateChange = (newIso: string) => {
    if (!newIso) return;
    if (isPastDate(newIso)) {
      setDateError('Cannot select a past date. Please choose today or a future date on the calendar.');
      return;
    }
    
    setSelectedDateIso(newIso);
    const newDisplayDate = formatDateForDisplay(newIso);
    setSelectedDate(newDisplayDate);

    const avail = getDoctorAvailabilityForDate(newIso);
    if (!avail.available) {
      setDateError(`${selectedDoctor.name} is not available on ${newDisplayDate} (${avail.reason}). Please select another date.`);
      return;
    }

    setDateError('');

    const newSlots = getDoctorSlotsForDate(newIso);

    // Check if current selected time is past or booked for new date
    const newlyBookedTimes = appointments
      .filter(a => {
        const docMatch = a.doctorId === selectedDoctor.id || a.doctorName.toLowerCase().replace(/^(dr\.?\s*)/i, '').trim() === (selectedDoctor.name || '').toLowerCase().replace(/^(dr\.?)\s*/i, '').trim();
        if (!docMatch) return false;
        const aptIso = formatDateToIso(a.date);
        return (aptIso === newIso || a.date === newDisplayDate) && a.status !== 'Cancelled';
      })
      .map(a => a.time);

    if (isTimeSlotPast(newIso, selectedTime) || newlyBookedTimes.includes(selectedTime) || !newSlots.includes(selectedTime)) {
      const next = newSlots.find(s => !isTimeSlotPast(newIso, s) && !newlyBookedTimes.includes(s));
      if (next) {
        setSelectedTime(next);
      }
    }
  };

  const handleStep2Continue = () => {
    if (isPastDate(selectedDateIso)) {
      setDateError('Cannot book an appointment for a past date. Please select today or a future date.');
      return;
    }
    const avail = getDoctorAvailabilityForDate(selectedDateIso);
    if (!avail.available) {
      setDateError(`Cannot book: ${selectedDoctor.name} is not available on ${selectedDate} (${avail.reason}). Please choose an available working date.`);
      return;
    }
    if (isTimeSlotPast(selectedDateIso, selectedTime)) {
      setDateError('The selected time slot has already passed for this date. Please choose an upcoming time slot.');
      return;
    }
    if (bookedTimesForDoctorOnDate.includes(selectedTime)) {
      setDateError('This time slot is already booked for this doctor. Please select another available slot.');
      return;
    }
    setDateError('');
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!currentUser) {
      alert('Please log in as a patient to book an appointment.');
      setCurrentScreen('login');
      return;
    }

    if (isPastDate(selectedDateIso) || isTimeSlotPast(selectedDateIso, selectedTime)) {
      alert('Error: You cannot book can appointment for a past date or time. Please choose a valid upcoming slot.');
      setStep(2);
      return;
    }

    try {
      const createdAppt = await bookAppointment({
        patientId: currentUser.id,
        patientName: currentUser.name,
        patientPhone: currentUser.phone || '+91 98765 43210',
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialization: selectedDoctor.specialization || 'General Physician',
        doctorAvatar: selectedDoctor.avatar,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType as any,
        reason: reason,
      });

      setBookedReceiptAppointment(createdAppt);
    } catch (e: any) {
      alert(e.message || 'Failed to book appointment');
    }
  };

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 py-8 space-y-8">
      {/* Header & Steps Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                goBack();
              }
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs flex items-center justify-center cursor-pointer shrink-0"
            title={step > 1 ? 'Back to Previous Step' : 'Back to Dashboard'}
            aria-label={step > 1 ? 'Back to Previous Step' : 'Back to Dashboard'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Appointment Booking
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-slate-600">
                Consultation booking workflow • Step {step} of 4
              </p>
              <span className="text-slate-300">•</span>
              <span 
                data-testid="selected-doctor-badge"
                className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200"
              >
                Doctor = {selectedDoctor.name}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Doctor pill in top header */}
        <div data-testid="selected-doctor-header" className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs">
          <img
            src={selectedDoctor.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
            alt={selectedDoctor.name}
            className="w-10 h-10 rounded-xl object-cover border border-blue-500/40 shrink-0"
          />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor = {selectedDoctor.name}</span>
            <span className="font-extrabold text-xs text-slate-900">{selectedDoctor.name}</span>
          </div>
        </div>
      </div>

      {/* Prominent Active Doctor Banner */}
      <div data-testid="selected-doctor-banner" className="bg-gradient-to-r from-blue-50 via-cyan-50/50 to-blue-50 border-2 border-blue-200/80 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="relative shrink-0">
            <img
              src={selectedDoctor.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"}
              alt={selectedDoctor.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor:</span>
              <h3 className="font-extrabold text-lg text-slate-900">{selectedDoctor.name}</h3>
              <span data-testid="selected-doctor-tag" className="px-2.5 py-0.5 bg-blue-600 text-white font-extrabold text-xs rounded-lg shadow-2xs">
                Doctor = {selectedDoctor.name}
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-700">
              {selectedDoctor.specialization} • ₹{selectedDoctor.consultationFee || 700} Consultation Fee
            </p>
            <p className="text-xs text-slate-500">{selectedDoctor.hospital || 'MediCare Clinic, New Delhi'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Continue with {selectedDoctor.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
            >
              Change Doctor
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="grid grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`p-3.5 rounded-xl border flex items-center space-x-3 transition cursor-pointer text-left ${step >= 1 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'}`}>1</span>
          <span className="text-xs font-bold hidden sm:inline">1. Select Doctor</span>
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`p-3.5 rounded-xl border flex items-center space-x-3 transition cursor-pointer text-left ${step >= 2 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'}`}>2</span>
          <span className="text-xs font-bold hidden sm:inline">2. Date & Time</span>
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className={`p-3.5 rounded-xl border flex items-center space-x-3 transition cursor-pointer text-left ${step >= 3 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'}`}>3</span>
          <span className="text-xs font-bold hidden sm:inline">3. Details</span>
        </button>
        <button
          type="button"
          onClick={() => setStep(4)}
          className={`p-3.5 rounded-xl border flex items-center space-x-3 transition cursor-pointer text-left ${step >= 4 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 4 ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'}`}>4</span>
          <span className="text-xs font-bold hidden sm:inline">4. Confirm</span>
        </button>
      </div>

      {/* STEP 1: SELECT DOCTOR */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200 w-full">
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, specialty, or clinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-auto cursor-pointer"
              >
                <option value="All">All Specializations</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="General Physician">General Physician</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Orthopedist">Orthopedist</option>
              </select>
            </div>
          </div>

          {/* Doctor List Vertical Stack */}
          <div className="space-y-4 w-full">
            {filteredDoctors.map(doc => {
              const isSelected = selectedDoctor.id === doc.id;
              return (
                <div
                  key={doc.id}
                  className={`rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition w-full ${
                    isSelected
                      ? 'bg-blue-50/40 border-2 border-blue-600 shadow-md ring-2 border-blue-500/20'
                      : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={doc.avatar || "https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200"}
                      alt={doc.name}
                      className={`w-20 h-20 rounded-2xl object-cover border-2 shadow-sm shrink-0 ${isSelected ? 'border-blue-600' : 'border-slate-200'}`}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base">{doc.name}</h4>
                        {isSelected && (
                          <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-extrabold rounded-md shadow-2xs">
                            Doctor = {doc.name} (Selected)
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          In-clinic Consultations
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-blue-600">{doc.specialization} • <span className="text-slate-500 font-normal">{doc.qualification}</span></p>
                      <p className="text-xs text-slate-500">{doc.experience || 8}+ yrs exp. • ★ {doc.rating || 4.8} ({doc.reviewsCount || 120} reviews)</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{doc.hospital || 'MediCare Clinic'}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-semibold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Available Today</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-slate-900 text-base">₹ {doc.consultationFee || 700}</div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Consultation Fee</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedDoctorId(doc.id); setSelectedDoctorIdForBooking(doc.id); setStep(2); }}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer flex items-center space-x-1 ${
                          isSelected
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-900 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <span>{isSelected ? `Proceed with ${doc.name.split(' ')[1] || 'Doctor'}` : 'Select & Choose Slot'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: DATE & TIME */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 animate-in fade-in duration-200 w-full">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-xs" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor:</span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.name}</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-extrabold text-[11px] rounded-md">
                    Doctor = {selectedDoctor.name}
                  </span>
                </div>
                <p className="text-xs font-semibold text-blue-600">{selectedDoctor.specialization} • ₹{selectedDoctor.consultationFee || 700} Fee</p>
                <p className="text-xs text-slate-500">{selectedDoctor.hospital}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Choose Different Doctor
            </button>
          </div>

          {dateError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{dateError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span>Select Date (Real-World Calendar)</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">Past dates disabled</span>
                </label>

                {/* Quick Date Shortcuts */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {[0, 1, 2, 3].map(offset => {
                    const d = getNow();
                    d.setDate(d.getDate() + offset);
                    const iso = formatDateToIso(d);
                    const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : formatDateForDisplay(d).split(' ').slice(0, 2).join(' ');
                    const isSelected = selectedDateIso === iso;
                    const dayAvail = getDoctorAvailabilityForDate(iso);
                    const daySlots = getDoctorSlotsForDate(iso);
                    const hasOpenSlot = dayAvail.available && daySlots.some((s: string) => !isTimeSlotPast(iso, s));
                    const isButtonDisabled = !dayAvail.available || (offset === 0 && !hasOpenSlot);

                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => handleDateChange(iso)}
                        disabled={isButtonDisabled}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : isButtonDisabled
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through opacity-60'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {label} {!dayAvail.available ? `(${dayAvail.reason?.includes('Holiday') ? 'Holiday' : 'Absent'})` : offset === 0 && !hasOpenSlot ? '(Ended)' : ''}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <input
                    type="date"
                    min={getTodayIsoString()}
                    value={selectedDateIso}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Selected Date:</span>
                  <span className="font-extrabold text-blue-700">{selectedDate}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Available Time Slots with {selectedDoctor.name}</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Past & booked slots disabled</span>
              </label>

              {!currentDayAvailability.available ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold space-y-1">
                  <p className="font-extrabold">{selectedDoctor.name} is Unavailable on {selectedDate}</p>
                  <p className="text-[11px] text-rose-600">Status: {currentDayAvailability.reason}. No appointment slots are available for booking on this day.</p>
                </div>
              ) : isTodayDate(selectedDateIso) && availableSlots.every(s => isTimeSlotPast(selectedDateIso, s)) ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold mb-2">
                  All consultation slots for today have ended. Please choose tomorrow or a future date on the calendar.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSlots.map(slot => {
                    const isPast = isTimeSlotPast(selectedDateIso, slot);
                    const isBooked = bookedTimesForDoctorOnDate.includes(slot);
                    const isDisabled = isPast || isBooked;
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedTime(slot);
                            setDateError('');
                          }
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : isDisabled
                            ? 'bg-slate-100 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-50 line-through'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                        }`}
                        title={isPast ? 'This time slot is in the past' : isBooked ? 'This time slot is already booked' : `Select ${slot}`}
                      >
                        <span>{slot}</span>
                        {isPast && <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 no-underline">Past</span>}
                        {isBooked && !isPast && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 no-underline">Booked</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Doctors</span>
            </button>
            <button
              onClick={handleStep2Continue}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <span>Continue to Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PATIENT DETAILS & TYPE */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 animate-in fade-in duration-200 w-full">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Consultation Format & Reason</h3>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">Booking with: Doctor = {selectedDoctor.name}</p>
            </div>
            <span className="text-xs font-bold text-slate-500">{selectedDate} at {selectedTime}</span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Consultation Format</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppointmentType('In-clinic')}
                  className={`p-4 rounded-2xl border text-left flex items-start space-x-3 cursor-pointer transition ${appointmentType === 'In-clinic' ? 'bg-blue-50 border-blue-600 ring-2 border-blue-500/20' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                >
                  <MapPin className={`w-5 h-5 shrink-0 mt-0.5 ${appointmentType === 'In-clinic' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">In-Clinic Consultation</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Meet {selectedDoctor.name} at {selectedDoctor.hospital || 'MediCare Clinic'}.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentType('Follow-up')}
                  className={`p-4 rounded-2xl border text-left flex items-start space-x-3 cursor-pointer transition ${appointmentType === 'Follow-up' ? 'bg-blue-50 border-blue-600 ring-2 border-blue-500/20' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                >
                  <Clock className={`w-5 h-5 shrink-0 mt-0.5 ${appointmentType === 'Follow-up' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">Follow-up / Review</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Follow-up visit with {selectedDoctor.name} for previous consultation.</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reason for Visit / Symptoms *</label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Describe your symptoms or reason for appointment..."
                required
              ></textarea>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <span>Review Confirmation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CONFIRMATION */}
      {step === 4 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 animate-in fade-in duration-200 w-full">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Review Appointment Details</h3>
            <p className="text-xs text-slate-500">Please confirm your booking information below.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Doctor</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>{selectedDoctor.name} ({selectedDoctor.specialization})</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-md font-extrabold">Doctor = {selectedDoctor.name}</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Patient</span>
              <span className="font-bold text-slate-900">{currentUser?.name || 'John Doe'}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Date & Time</span>
              <span className="font-bold text-blue-600">{selectedDate} at {selectedTime}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Format</span>
              <span className="font-bold text-slate-900">{appointmentType}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Consultation Fee</span>
              <span className="font-bold text-slate-900">₹ {selectedDoctor.consultationFee || 700}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold">Payment Status</span>
              <span className="font-bold text-amber-600">Pending</span>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm & Book Appointment</span>
            </button>
          </div>
        </div>
      )}

      {/* APPOINTMENT RECEIPT MODAL */}
      {bookedReceiptAppointment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
              <div className="text-xl font-black text-blue-600 tracking-wider">MediCare</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Appointment Receipt</div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Appointment ID:</span>
                <span className="font-bold text-slate-900">{bookedReceiptAppointment.id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Patient:</span>
                <span className="font-bold text-slate-900">{bookedReceiptAppointment.patientName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Doctor:</span>
                <span className="font-bold text-slate-900">{bookedReceiptAppointment.doctorName} [Doctor = {bookedReceiptAppointment.doctorName}]</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Specialization:</span>
                <span className="font-bold text-slate-900">{bookedReceiptAppointment.doctorSpecialization}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Clinic:</span>
                <span className="font-bold text-slate-900">{selectedDoctor.hospital || 'MediCare Clinic'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Appointment Date:</span>
                <span className="font-bold text-blue-600">{bookedReceiptAppointment.date}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Appointment Time:</span>
                <span className="font-bold text-blue-600">{bookedReceiptAppointment.time}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Appointment Type:</span>
                <span className="font-bold text-slate-900">{bookedReceiptAppointment.type}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Reason:</span>
                <span className="font-bold text-slate-900 text-right max-w-[220px] truncate">{bookedReceiptAppointment.reason}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Consultation Fee:</span>
                <span className="font-bold text-slate-900">₹ {selectedDoctor.consultationFee || 700}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Payment Status:</span>
                <span className="font-bold text-amber-600 uppercase">Pending</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Payment Method:</span>
                <span className="font-bold text-slate-700">Cash / Online (Pending)</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Status:</span>
                <span className="font-bold text-emerald-600 uppercase">Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Booked On:</span>
                <span className="font-bold text-slate-900">{bookedReceiptAppointment.createdAt}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedDoctorIdForBooking(null);
                  setBookedReceiptAppointment(null);
                  setCurrentScreen('patient-appointments');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                View Appointments
              </button>
              <button
                onClick={handleDownloadReceiptPDF}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Download / Print</span>
              </button>
              <button
                onClick={() => {
                  setSelectedDoctorIdForBooking(null);
                  setBookedReceiptAppointment(null);
                  setCurrentScreen('patient-dashboard');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
