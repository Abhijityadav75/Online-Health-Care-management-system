import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { userApi } from '../../api/userApi';
import { User as UserIcon, Shield, Bell, Camera, X, Edit3, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const PatientProfileScreen: React.FC = () => {
  const { currentUser, updateUserProfile, changePassword, goBack } = useApp();
  const [activeTab, setActiveTab] = useState<'Personal' | 'Security' | 'Notifications'>('Personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [dob, setDob] = useState(currentUser?.dob || '');
  const [gender, setGender] = useState(currentUser?.gender || 'Male');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [emergency, setEmergency] = useState(currentUser?.emergencyContact || '');
  const [relation, setRelation] = useState(currentUser?.emergencyRelation || '');
  const [bloodGroup, setBloodGroup] = useState(currentUser?.bloodGroup || 'B+');
  const [allergies, setAllergies] = useState(currentUser?.allergies || 'None Known');
  const [chronicConditions, setChronicConditions] = useState(currentUser?.chronicConditions || 'Hypertension');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notifReminders, setNotifReminders] = useState(true);
  const [notifConfirmations, setNotifConfirmations] = useState(true);
  const [notifCancellations, setNotifCancellations] = useState(true);
  const [notifRecordUpdates, setNotifRecordUpdates] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [passwordMessage, setPasswordMessage] = useState<{ success: boolean; text: string } | null>(null);

  const presetAvatars = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (email !== currentUser.email || bloodGroup !== currentUser.bloodGroup || chronicConditions !== currentUser.chronicConditions || allergies !== currentUser.allergies) {
      const confirmed = window.confirm('You are modifying sensitive medical or contact information (Email, Blood Group, or Medical Conditions). Do you wish to confirm these changes?');
      if (!confirmed) return;
    }

    try {
      // Direct call to Java UserServlet via userApi.updateUserProfile
      const res = await userApi.updateUserProfile(currentUser.id, {
        name,
        phone,
        dob,
        gender,
        address,
        emergencyContact: emergency,
        emergencyRelation: relation,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update profile');
      }

      await updateUserProfile(currentUser.id, {
        name,
        email,
        phone,
        dob,
        gender,
        address,
        emergencyContact: emergency,
        emergencyRelation: relation,
        bloodGroup,
        allergies,
        chronicConditions
      });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    const res = changePassword(currentPassword, newPassword, confirmNewPassword);
    if (!res.success) {
      setPasswordMessage({ success: false, text: res.message });
      return;
    }
    setPasswordMessage({ success: true, text: res.message });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleSelectAvatar = async (url: string) => {
    if (!currentUser) return;
    try {
      const res = await userApi.updateUserProfile(currentUser.id, { avatarUrl: url });
      if (!res.success) {
        throw new Error(res.message || 'Failed to update avatar');
      }
      await updateUserProfile(currentUser.id, { avatar: url });
      setShowAvatarModal(false);
      alert('Profile photo updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update photo.');
    }
  };

  const handleCustomAvatarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    handleSelectAvatar(customUrlInput.trim());
    setCustomUrlInput('');
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Profile</h2>
          <p className="text-sm text-slate-600 mt-1">View personal information, manage security settings, and edit profile details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-2 h-fit">
          <button
            onClick={() => setActiveTab('Personal')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'Personal' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Personal Information</span>
          </button>
          <button
            onClick={() => setActiveTab('Security')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'Security' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
          <button
            onClick={() => setActiveTab('Notifications')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'Notifications' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <Bell className="w-4 h-4" />
            <span>In-App Notification Settings</span>
          </button>
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          {activeTab === 'Personal' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <img
                      src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                      alt={currentUser?.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-md"
                    />
                    {isEditing && (
                      <button
                        onClick={() => setShowAvatarModal(true)}
                        className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition cursor-pointer"
                        title="Change Photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">{currentUser?.name}</h4>
                    <p className="text-xs text-slate-500">{currentUser?.email}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-md uppercase tracking-wider">
                      {currentUser?.role || 'Patient'}
                    </span>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-2 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-blue-200 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Select Avatar</span>
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{name || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{email || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{phone || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{dob || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{gender || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Emergency Contact</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{emergency || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{bloodGroup || 'Not specified'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Allergies</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{allergies || 'None Known'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chronic Conditions</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{chronicConditions || 'None'}</span>
                  </div>
                  <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1">{address || 'Not specified'}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
                      <input
                        type="text"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Emergency Contact</label>
                      <input
                        type="text"
                        value={emergency}
                        onChange={(e) => setEmergency(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Allergies</label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. None Known, Penicillin"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Chronic Conditions</label>
                      <input
                        type="text"
                        value={chronicConditions}
                        onChange={(e) => setChronicConditions(e.target.value)}
                        placeholder="e.g. Hypertension, Asthma"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'Security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500">Ensure your account is using a secure password.</p>

              {passwordMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${passwordMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold pr-10"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-blue-700 transition"
              >
                Update Password
              </button>
            </form>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-bold text-slate-900">In-App Notification Preferences</h3>
              <p className="text-xs text-slate-500">Choose your in-app alert options.</p>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Appointment Reminders</span>
                    <span className="text-[11px] text-slate-500">Receive in-app alerts for upcoming consultations</span>
                  </div>
                  <input type="checkbox" checked={notifReminders} onChange={() => setNotifReminders(!notifReminders)} className="w-4 h-4 rounded text-blue-600" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Appointment Confirmations</span>
                    <span className="text-[11px] text-slate-500">Alerts when appointments are successfully confirmed</span>
                  </div>
                  <input type="checkbox" checked={notifConfirmations} onChange={() => setNotifConfirmations(!notifConfirmations)} className="w-4 h-4 rounded text-blue-600" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Appointment Cancellations</span>
                    <span className="text-[11px] text-slate-500">Alerts when appointments are cancelled</span>
                  </div>
                  <input type="checkbox" checked={notifCancellations} onChange={() => setNotifCancellations(!notifCancellations)} className="w-4 h-4 rounded text-blue-600" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Medical Record Updates</span>
                    <span className="text-[11px] text-slate-500">Get notified when doctors file consultation records</span>
                  </div>
                  <input type="checkbox" checked={notifRecordUpdates} onChange={() => setNotifRecordUpdates(!notifRecordUpdates)} className="w-4 h-4 rounded text-blue-600" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">System Notifications</span>
                    <span className="text-[11px] text-slate-500">Important system announcements and updates</span>
                  </div>
                  <input type="checkbox" checked={notifSystem} onChange={() => setNotifSystem(!notifSystem)} className="w-4 h-4 rounded text-blue-600" />
                </label>
              </div>

              <button
                onClick={() => alert('Notification preferences saved!')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-blue-700 transition"
              >
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Choose Profile Avatar</h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-600">Select an avatar:</p>
              <div className="grid grid-cols-3 gap-4">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAvatar(url)}
                    className="relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-600 transition group cursor-pointer aspect-square shadow-sm"
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100">
                <form onSubmit={handleCustomAvatarSubmit} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Or Enter Image URL</label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
