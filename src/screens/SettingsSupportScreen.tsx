import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDoctorName } from '../utils/dateUtils';
import { 
  Settings, HelpCircle, Shield, Bell, Lock, Globe, Moon, ChevronRight,
  Mail, Phone, Camera, CheckCircle2, Save, ArrowLeft
} from 'lucide-react';

export const SettingsSupportScreen: React.FC = () => {
  const { currentUser, updateUserProfile, changePassword, goBack } = useApp();
  const [activeTab, setActiveTab] = useState<'Settings' | 'Support'>('Settings');
  const [settingsSection, setSettingsSection] = useState<'Account' | 'Notifications' | 'Privacy' | 'Help'>('Account');

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Profile edit states
  const [name, setName] = useState(currentUser?.role === 'doctor' ? formatDoctorName(currentUser?.name) : (currentUser?.name || ''));
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Notification toggles (In-app notifications)
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [aptReminders, setAptReminders] = useState(true);
  const [recordAlerts, setRecordAlerts] = useState(true);

  // Privacy toggles
  const [profileVisibility, setProfileVisibility] = useState('Public');

  // Theme & Language
  const [language, setLanguage] = useState('English (India)');
  const [themeMode, setThemeMode] = useState('Light');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = changePassword(currentPassword, newPassword, confirmPassword);
    if (!result.success) {
      showToast(result.message);
      return;
    }
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast(result.message);
  };

  const handleAvatarSelect = (url: string) => {
    if (!currentUser) return;
    updateUserProfile(currentUser.id, { avatar: url });
    setShowAvatarModal(false);
    showToast('Profile photo updated successfully!');
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    updateUserProfile(currentUser.id, { name, email, phone });
    showToast('Account details updated successfully!');
  };

  const presetAvatars = [
    "https://images.unsplash.com/photo-1594824813578-834419999a42?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 min-h-screen relative">
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-in slide-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings & Support</h2>
          <p className="text-sm text-slate-600 mt-1">Manage account settings, privacy, notifications and get help.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar */}
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-xs border border-slate-200/80 space-y-2 h-fit">
          <button
            onClick={() => { setActiveTab('Settings'); setSettingsSection('Account'); }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'Settings' && settingsSection === 'Account' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <div className="flex items-center space-x-3">
              <Settings className="w-4 h-4" />
              <span>Account Settings</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('Settings'); setSettingsSection('Notifications'); }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'Settings' && settingsSection === 'Notifications' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4" />
              <span>In-App Notifications</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('Settings'); setSettingsSection('Privacy'); }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'Settings' && settingsSection === 'Privacy' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4" />
              <span>Privacy & Security</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setActiveTab('Support'); setSettingsSection('Help'); }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${activeTab === 'Support' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-4 h-4" />
              <span>Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-8 bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-xs border border-slate-200/80">
          {/* 1. ACCOUNT SETTINGS */}
          {activeTab === 'Settings' && settingsSection === 'Account' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4">Account Settings</h3>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Details</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Change Password</span>
                      <span className="text-[11px] text-slate-500">Update your account security password</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Manage Profile Photo</span>
                      <span className="text-[11px] text-slate-500">Update avatar image URL or select preset</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Language</span>
                      <span className="text-[11px] text-slate-500">System display language</span>
                    </div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => { setLanguage(e.target.value); showToast('Language updated to ' + e.target.value); }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option>English (India)</option>
                    <option>English (US)</option>
                    <option>Hindi (India)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Theme Mode</span>
                      <span className="text-[11px] text-slate-500">Appearance preference</span>
                    </div>
                  </div>
                  <select
                    value={themeMode}
                    onChange={(e) => { setThemeMode(e.target.value); showToast('Theme updated to ' + e.target.value); }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option>Light</option>
                    <option>Dark</option>
                    <option>System Default</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. IN-APP NOTIFICATIONS */}
          {activeTab === 'Settings' && settingsSection === 'Notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4">In-App Notification Preferences</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">In-App Notifications</span>
                    <span className="text-[11px] text-slate-500">Receive in-app notification bells for status updates</span>
                  </div>
                  <input type="checkbox" checked={inAppAlerts} onChange={() => { setInAppAlerts(!inAppAlerts); showToast('In-app alerts updated'); }} className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Appointment Reminders</span>
                    <span className="text-[11px] text-slate-500">View upcoming appointment alerts on your dashboard</span>
                  </div>
                  <input type="checkbox" checked={aptReminders} onChange={() => { setAptReminders(!aptReminders); showToast('Appointment reminder preference updated'); }} className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-slate-100 transition">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Medical Record Updates</span>
                    <span className="text-[11px] text-slate-500">Alerts when doctors add clinical consultation records</span>
                  </div>
                  <input type="checkbox" checked={recordAlerts} onChange={() => { setRecordAlerts(!recordAlerts); showToast('Record alerts preference updated'); }} className="w-4 h-4 rounded text-blue-600 cursor-pointer" />
                </label>
              </div>
            </div>
          )}

          {/* 3. PRIVACY & SECURITY */}
          {activeTab === 'Settings' && settingsSection === 'Privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4">Privacy & Access Control</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="block text-xs font-bold text-slate-900">Role-Based Access Control (RBAC)</span>
                  <p className="text-[11px] text-slate-600">Access to medical records and administration panels is strictly segregated based on your account role ({currentUser?.role || 'user'}).</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Profile Directory Visibility</span>
                    <span className="text-[11px] text-slate-500">Allow other portal users to view your registered profile</span>
                  </div>
                  <select
                    value={profileVisibility}
                    onChange={(e) => { setProfileVisibility(e.target.value); showToast('Directory visibility updated'); }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option>Public</option>
                    <option>Patients Only</option>
                    <option>Hidden</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. HELP & SUPPORT */}
          {activeTab === 'Support' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4">Help & Support</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 rounded-3xl text-white space-y-3 shadow-lg">
                  <h4 className="font-extrabold text-sm">Need System Assistance?</h4>
                  <p className="text-xs text-blue-100 leading-relaxed">Our support team is available during clinic hours to answer questions about bookings and account features.</p>
                  <div className="flex space-x-3 pt-2">
                    <a href="mailto:support@medicare.local" className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-extrabold shadow-md inline-flex items-center space-x-2 transition">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Support</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-extrabold text-sm text-slate-900">Frequently Asked Questions (FAQ)</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="font-extrabold text-xs text-slate-900 block">How do doctors manage their daily availability slots?</span>
                    <p className="text-xs text-slate-600">Navigate to Calendar or Availability in the doctor portal to toggle days and set working hours.</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="font-extrabold text-xs text-slate-900 block">How are patient consultation records protected?</span>
                    <p className="text-xs text-slate-600">Patient records are protected through role-based access control, allowing only the patient and attending physicians to view consultation details.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Change Account Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PROFILE PHOTO MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg text-slate-900">Manage Profile Photo</h3>
              <button onClick={() => setShowAvatarModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-600">Select a professional avatar below:</p>
              <div className="grid grid-cols-5 gap-3">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAvatarSelect(url)}
                    className="relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-600 transition group cursor-pointer aspect-square shadow-sm"
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Or Enter Custom Image URL</label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customAvatarUrl.trim()) return;
                      handleAvatarSelect(customAvatarUrl.trim());
                      setCustomAvatarUrl('');
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
