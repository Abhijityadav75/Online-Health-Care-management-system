import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, Send, Check, ArrowLeft } from 'lucide-react';

export const NotificationsFeedbackScreen: React.FC = () => {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead, addFeedback, users, appointments, goBack, setCurrentScreen } = useApp();
  const [activeTab, setActiveTab] = useState<'All' | 'Appointments' | 'Medical' | 'System'>('All');

  // Feedback form state - tied strictly to completed appointments
  const userCompletedAppointments = appointments.filter(a => (!currentUser || a.patientId === currentUser.id) && a.status === 'Completed');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(userCompletedAppointments[0]?.id || '');
  const [rating, setRating] = useState<number | ''>('');
  const [comment, setComment] = useState('');

  const userNotifications = notifications.filter(n => !currentUser || n.userId === currentUser.id);

  const filteredNotifs = userNotifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Appointments') return n.type === 'appointment';
    if (activeTab === 'Medical') return n.type === 'medical';
    if (activeTab === 'System') return n.type === 'system';
    return true;
  });

  const handleNotificationClick = (n: typeof notifications[0]) => {
    markNotificationRead(n.id);
    if (n.appointmentId) {
      if (currentUser?.role === 'doctor') {
        setCurrentScreen('doctor-appointments');
      } else if (currentUser?.role === 'patient') {
        setCurrentScreen('patient-appointments');
      } else if (currentUser?.role === 'admin') {
        setCurrentScreen('admin-appointments');
      }
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !rating) return;
    const targetApt = userCompletedAppointments.find(a => a.id === selectedAppointmentId) || userCompletedAppointments[0];
    if (!targetApt) {
      alert('Error: You can only submit feedback for a completed consultation.');
      return;
    }

    try {
      await addFeedback({
        patientId: currentUser.id,
        patientName: currentUser.name,
        doctorId: targetApt.doctorId,
        appointmentId: targetApt.id,
        rating: Number(rating),
        comment
      });

      alert('Feedback submitted successfully! Thank you.');
      setComment('');
      setRating('');
    } catch (err: any) {
      alert(`Error submitting feedback: ${err.message || 'Failed'}`);
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-10">
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications & Feedback</h2>
          <p className="text-sm text-slate-600 mt-1">View in-app notifications and submit consultation feedback.</p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="font-bold text-lg text-slate-900">In-App Notifications</h3>
            {userNotifications.some(n => !n.read) && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Appointments', 'Medical', 'System'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No notifications found.</p>
          ) : (
            filteredNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 cursor-pointer hover:border-blue-300 ${!n.read ? 'bg-blue-50/60 border-blue-200 shadow-xs' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>}
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  {n.appointmentId && (
                    <div className="pt-1">
                      <span className="inline-flex items-center text-[11px] font-bold text-blue-600 hover:text-blue-700">
                        View Appointment ({n.appointmentId}) &rarr;
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 pt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">{n.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Give Feedback Section - Patients Only */}
      {currentUser?.role === 'patient' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Doctor Feedback</h3>
              <p className="text-xs text-slate-500">Rate your recent consultation with MediCare doctors.</p>
            </div>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Completed Consultation *</label>
              {userCompletedAppointments.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  No completed consultations available for feedback. Feedback requires a completed consultation.
                </div>
              ) : (
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {userCompletedAppointments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      {apt.doctorName} ({apt.doctorSpecialization}) — {apt.date} at {apt.time} [{apt.id}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Rating (1 to 5 Stars) *</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="">Select rating</option>
                <option value="5">5 ★★★★★ — Excellent</option>
                <option value="4">4 ★★★★ — Very Good</option>
                <option value="3">3 ★★★ — Good</option>
                <option value="2">2 ★★ — Fair</option>
                <option value="1">1 ★ — Needs Improvement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Feedback Comment *</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                placeholder="Write your consultation feedback..."
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={userCompletedAppointments.length === 0 || rating === ''}
              className={`px-6 py-3.5 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 ${
                userCompletedAppointments.length === 0 || rating === ''
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
