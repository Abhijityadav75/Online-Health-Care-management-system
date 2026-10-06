import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DaySchedule, BlockedDate } from '../../types';
import { Clock, Calendar, Check, X, Plus, Trash2, Save, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getTodayIsoString, isPastDate } from '../../utils/dateUtils';

export const DoctorAvailabilityScreen: React.FC = () => {
  const { 
    goBack,
    weeklySchedule: contextWeeklySchedule,
    setWeeklySchedule: setContextWeeklySchedule,
    blockedDates: contextBlockedDates,
    setBlockedDates: setContextBlockedDates,
    slotDuration: contextSlotDuration,
    setSlotDuration: setContextSlotDuration,
    maxPatientsPerSlot: contextMaxPatientsPerSlot,
    setMaxPatientsPerSlot: setContextMaxPatientsPerSlot,
    bufferTime: contextBufferTime,
    setBufferTime: setContextBufferTime
  } = useApp();

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(contextWeeklySchedule);
  const [slotDuration, setSlotDuration] = useState(contextSlotDuration);
  const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState(contextMaxPatientsPerSlot);
  const [bufferTime, setBufferTime] = useState(contextBufferTime);

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(contextBlockedDates);
  const [newBlockDate, setNewBlockDate] = useState(getTodayIsoString());
  const [newBlockReason, setNewBlockReason] = useState('');
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);

  const timeOptions = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'
  ];

  const toggleDayAvailability = (index: number) => {
    setWeeklySchedule(prev => prev.map((item, idx) => idx === index ? { ...item, available: !item.available } : item));
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime' | 'breakStart' | 'breakEnd', value: string) => {
    setWeeklySchedule(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleAddBlockedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate) return;
    if (isPastDate(newBlockDate)) {
      alert('Error: Cannot block dates in the past. Please select today or a future date.');
      return;
    }
    const newBlock: BlockedDate = {
      id: 'b-' + Date.now(),
      date: newBlockDate,
      reason: newBlockReason || 'Unavailable / Leave',
      fullDay: true
    };
    setBlockedDates([...blockedDates, newBlock]);
    setNewBlockReason('');
    setShowAddBlockModal(false);
    alert(`Date ${newBlockDate} marked as unavailable.`);
  };

  const handleRemoveBlockedDate = (id: string) => {
    setBlockedDates(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveSettings = () => {
    setContextWeeklySchedule(weeklySchedule);
    setContextBlockedDates(blockedDates);
    setContextSlotDuration(slotDuration);
    setContextMaxPatientsPerSlot(maxPatientsPerSlot);
    setContextBufferTime(bufferTime);
    alert('Weekly availability and leave schedules saved successfully!');
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
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-7 h-7 text-blue-600" />
              <span>Manage Weekly Availability & Status</span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Toggle whether you are available or absent for each day of the week, and configure timing.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition duration-200 flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Availability Settings</span>
        </button>
      </div>

      {/* Main Grid: Weekly Availability + Slot & Exception Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Weekly Day-by-Day Availability List */}
        <div className="lg:col-span-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Weekly Schedule & Working Hours</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Define your available consultation hours and break times for each day.</p>
            </div>
            <button
              onClick={() => {
                setWeeklySchedule(prev => prev.map(d => ({ ...d, available: true })));
                alert('All days set to Available.');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition cursor-pointer"
            >
              Set All Available
            </button>
          </div>

          <div className="space-y-4">
            {weeklySchedule.map((item, idx) => (
              <div
                key={item.day}
                className={`p-5 rounded-2xl border transition duration-200 space-y-4 ${
                  item.available
                    ? 'bg-white border-slate-200/80 shadow-2xs hover:border-blue-300'
                    : 'bg-slate-100/70 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-extrabold text-base text-slate-900">{item.day}</span>
                    <span
                      className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                        item.available
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {item.available ? 'Available' : 'Absent / Not Available'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleDayAvailability(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition duration-150 cursor-pointer flex items-center space-x-1.5 shadow-2xs ${
                      item.available
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    {item.available ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>{item.available ? 'Set Absent' : 'Set Available'}</span>
                  </button>
                </div>

                {item.available ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Start Time</label>
                      <select
                        value={item.startTime}
                        onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        {timeOptions.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">End Time</label>
                      <select
                        value={item.endTime}
                        onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        {timeOptions.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Break Start</label>
                      <select
                        value={item.breakStart}
                        onChange={(e) => handleTimeChange(idx, 'breakStart', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option>None</option>
                        {timeOptions.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Break End</label>
                      <select
                        value={item.breakEnd}
                        onChange={(e) => handleTimeChange(idx, 'breakEnd', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option>None</option>
                        {timeOptions.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">
                    Doctor is marked absent for this day. Patients cannot book appointments.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Settings & Leave Exceptions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Consultation Slot Settings */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Slot Configuration</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Slot Duration</label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option>15 mins</option>
                  <option>20 mins</option>
                  <option>30 mins</option>
                  <option>45 mins</option>
                  <option>60 mins</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Max Patients Per Slot</label>
                <select
                  value={maxPatientsPerSlot}
                  onChange={(e) => setMaxPatientsPerSlot(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option>1 Patient</option>
                  <option>2 Patients</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Buffer Time Between Slots</label>
                <select
                  value={bufferTime}
                  onChange={(e) => setBufferTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option>0 mins</option>
                  <option>5 mins</option>
                  <option>10 mins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Blocked Specific Dates / Holidays */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>Blocked Dates & Leave</span>
              </h3>
              <button
                onClick={() => setShowAddBlockModal(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Block</span>
              </button>
            </div>

            <div className="space-y-3">
              {blockedDates.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium text-center py-4">No custom blocked dates added.</p>
              ) : (
                blockedDates.map((block) => (
                  <div key={block.id} className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/60 flex items-center justify-between">
                    <div>
                      <span className="block font-extrabold text-xs text-rose-900">{block.date}</span>
                      <p className="text-[11px] text-rose-700 font-medium truncate max-w-[180px]">{block.reason}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveBlockedDate(block.id)}
                      className="p-1.5 hover:bg-rose-200/80 text-rose-700 rounded-xl transition cursor-pointer"
                      title="Remove leave block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl border border-blue-200/70 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-blue-700 font-extrabold">
              <Shield className="w-4 h-4" />
              <span>Schedule Synchronization</span>
            </div>
            <p className="text-slate-600 font-medium">
              Changes to your availability and working hours update your appointment booking calendar immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Save Settings Footer Bar */}
      <div className="bg-white/95 backdrop-blur-xl p-5 rounded-3xl shadow-xs border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All changes ready to save</span>
        </div>
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Availability Settings</span>
        </button>
      </div>

      {/* Add Blocked Date Modal */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Block Specific Date / Leave</h3>
              <button onClick={() => setShowAddBlockModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBlockedDate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Select Date</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Today or Future</span>
                </label>
                <input
                  type="date"
                  required
                  min={getTodayIsoString()}
                  value={newBlockDate}
                  onChange={(e) => {
                    if (!isPastDate(e.target.value)) {
                      setNewBlockDate(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Unavailability</label>
                <input
                  type="text"
                  placeholder="e.g. Leave, Conference, Holiday"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirm Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
