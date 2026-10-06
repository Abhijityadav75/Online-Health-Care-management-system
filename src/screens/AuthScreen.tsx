import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Shield, Lock, Mail, Phone, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Calendar as CalendarIcon, FileText as FileTextIcon, HelpCircle, KeyRound, Stethoscope, Clock, ShieldAlert } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, registerUser, resetPasswordWithIdentifier, users } = useApp();
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'doctor-register' | 'doctor-pending' | 'forgot'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password flow state
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotInput, setForgotInput] = useState('');
  const [forgotCode, setForgotCode] = useState('123456');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Patient registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDob] = useState('15 Jan 1995');
  const [regGender] = useState('Male');
  const [regAddress] = useState('123, Green Park, New Delhi');
  const [regEmergency] = useState('+91 87654 32109');

  // Doctor specific registration fields
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('Cardiology');
  const [docQualification, setDocQualification] = useState('MBBS, MD');
  const [docExperience, setDocExperience] = useState('5');
  const [docHospital, setDocHospital] = useState('MediCare Hospital');
  const [docFee, setDocFee] = useState('800');

  // Doctor pending confirmation state
  const [submittedDocName, setSubmittedDocName] = useState('');
  const [submittedDocSpec, setSubmittedDocSpec] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedId = loginEmail.trim();

    // 1. Empty email or phone number check
    if (!trimmedId) {
      setErrorMessage('Email or phone number is required.');
      return;
    }

    // 2. Format check for email or phone
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigitsOnly = trimmedId.replace(/\D/g, '');
    const isPhoneFormat = /^[+]?[0-9\s-]{10,15}$/.test(trimmedId) && phoneDigitsOnly.length >= 10;
    const isEmailFormat = emailPattern.test(trimmedId);

    if (!isEmailFormat && !isPhoneFormat) {
      setErrorMessage('Please enter a valid email address or phone number.');
      return;
    }

    // 3. Empty password check
    if (!loginPassword || !loginPassword.trim()) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);
    login(loginEmail, loginPassword, selectedRole, rememberMe)
      .then((res) => {
        setIsLoading(false);
        if (!res.success) {
          setErrorMessage(res.message || 'Invalid email/phone number or password.');
        }
      })
      .catch((err: any) => {
        setIsLoading(false);
        setErrorMessage(err.message || 'Authentication error occurred.');
      });
  };

  const handlePatientRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Full Name validation
    const trimmedName = regName.trim();
    if (!trimmedName) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMessage('Please enter a valid full name (at least 2 characters).');
      return;
    }

    // 2. Email validation
    const trimmedEmail = regEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // 3. Phone validation (exactly 10 digits after country code 91)
    const phoneInput = regPhone.trim();
    if (!phoneInput) {
      setErrorMessage('Phone number is required.');
      return;
    }
    const phoneDigits = phoneInput.replace(/\D/g, '');
    let standardDigits = '';
    if (phoneDigits.startsWith('91')) {
      standardDigits = phoneDigits.slice(2);
    } else {
      standardDigits = phoneDigits;
    }

    if (standardDigits.length !== 10) {
      setErrorMessage('Phone number must include exactly 10 digits after country code 91.');
      return;
    }
    const formattedPhone = `+91 ${standardDigits}`;

    // 4. Password validation
    if (!regPassword) {
      setErrorMessage('Password is required.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    registerUser({
      name: trimmedName,
      email: trimmedEmail,
      phone: formattedPhone,
      password: regPassword,
      role: 'patient',
      dob: regDob,
      gender: regGender,
      address: regAddress,
      emergencyContact: regEmergency
    })
      .then((res) => {
        setIsLoading(false);
        if (!res.success) {
          setErrorMessage(res.message || 'Registration failed.');
        }
      })
      .catch((err: any) => {
        setIsLoading(false);
        setErrorMessage(err.message || 'Registration failed.');
      });
  };

  const handleDoctorRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Doctor Name
    const trimmedName = docName.trim();
    if (!trimmedName) {
      setErrorMessage('Doctor full name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMessage('Please enter a valid full name.');
      return;
    }

    // 2. Email
    const trimmedEmail = docEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // 3. Phone validation (exactly 10 digits after country code 91)
    const phoneInput = docPhone.trim();
    if (!phoneInput) {
      setErrorMessage('Phone number is required.');
      return;
    }
    const phoneDigits = phoneInput.replace(/\D/g, '');
    let standardDigits = '';
    if (phoneDigits.startsWith('91')) {
      standardDigits = phoneDigits.slice(2);
    } else {
      standardDigits = phoneDigits;
    }

    if (standardDigits.length !== 10) {
      setErrorMessage('Phone number must include exactly 10 digits after country code 91.');
      return;
    }
    const formattedPhone = `+91 ${standardDigits}`;

    // 4. Password validation
    if (!docPassword) {
      setErrorMessage('Password is required.');
      return;
    }
    if (docPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // 5. Professional Fields
    if (!docSpecialization.trim()) {
      setErrorMessage('Please specify medical specialization.');
      return;
    }
    if (!docQualification.trim()) {
      setErrorMessage('Please specify medical qualifications (e.g. MBBS, MD).');
      return;
    }

    setIsLoading(true);
    const cleanDocName = trimmedName.replace(/^(dr\.?\s*)+/gi, '').trim();
    const finalDocName = `Dr. ${cleanDocName}`;

    registerUser({
      name: finalDocName,
      email: trimmedEmail,
      phone: formattedPhone,
      password: docPassword,
      role: 'doctor',
      specialization: docSpecialization,
      qualification: docQualification,
      experience: parseInt(docExperience) || 5,
      hospital: docHospital || 'MediCare Hospital',
      consultationFee: parseInt(docFee) || 600
    })
      .then((res) => {
        setIsLoading(false);
        if (!res.success) {
          setErrorMessage(res.message || 'Registration failed.');
        } else {
          // Transition to dedicated Pending Approval confirmation screen
          setSubmittedDocName(finalDocName);
          setSubmittedDocSpec(docSpecialization);
          setViewMode('doctor-pending');
        }
      })
      .catch((err: any) => {
        setIsLoading(false);
        setErrorMessage(err.message || 'Registration failed.');
      });
  };

  const handleForgotRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const trimmed = forgotInput.trim();
    if (!trimmed) {
      setForgotError('Email or phone number is required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigitsOnly = trimmed.replace(/\D/g, '');
    const isPhoneFormat = /^[+]?[0-9\s-]{10,15}$/.test(trimmed) && phoneDigitsOnly.length >= 10;
    const isEmailFormat = emailPattern.test(trimmed);

    if (!isEmailFormat && !isPhoneFormat) {
      setForgotError('Please enter a valid email address or phone number.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotStep('reset');
    }, 600);
  };

  const handleForgotResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotCode.trim()) {
      setForgotError('Please enter the 6-digit reset code.');
      return;
    }
    if (!forgotNewPass) {
      setForgotError('New password is required.');
      return;
    }
    if (forgotNewPass.length < 4) {
      setForgotError('Password must be at least 4 characters long.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = resetPasswordWithIdentifier(forgotInput, forgotNewPass);
      setIsLoading(false);
      if (!res.success) {
        setForgotError(res.message);
      } else {
        setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
        setLoginEmail(forgotInput);
        setLoginPassword(forgotNewPass);
        setViewMode('login');
        setForgotStep('request');
        setForgotInput('');
        setForgotNewPass('');
        setForgotConfirmPass('');
        setForgotError('');
      }
    }, 600);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        {/* Left Form Section */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                {viewMode === 'forgot'
                  ? 'Account Recovery'
                  : viewMode === 'doctor-register'
                  ? 'Healthcare Professional Registration'
                  : viewMode === 'doctor-pending'
                  ? 'Verification in Progress'
                  : viewMode === 'register'
                  ? 'Get Started'
                  : 'Welcome Back'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {viewMode === 'forgot' ? (
                  'Forgot Password?'
                ) : viewMode === 'doctor-register' ? (
                  <>Doctor <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Registration</span></>
                ) : viewMode === 'doctor-pending' ? (
                  <>Registration <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">Submitted</span></>
                ) : viewMode === 'register' ? (
                  <>Create Account in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">MediCare</span></>
                ) : (
                  <>Sign In to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">MediCare</span></>
                )}
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                {viewMode === 'forgot'
                  ? forgotStep === 'request'
                    ? 'Enter your email or phone number to receive reset instructions.'
                    : 'Set a new secure password for your account.'
                  : viewMode === 'doctor-register'
                  ? 'Register your medical practice. Administrator verification is required prior to activation.'
                  : viewMode === 'doctor-pending'
                  ? 'Your application has been received and queued for administrative review.'
                  : viewMode === 'register'
                  ? 'Sign up as a patient to book appointments and manage your health records.'
                  : 'Access your personalized healthcare dashboard.'}
              </p>
            </div>

            {/* Role Selection Tabs for Login (3 Roles) */}
            {viewMode === 'login' && (
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('patient'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${selectedRole === 'patient' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedRole('doctor'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${selectedRole === 'doctor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedRole('admin'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${selectedRole === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Admin
                </button>
              </div>
            )}

            {/* Public Registration Tabs (Patient | Doctor ONLY) */}
            {(viewMode === 'register' || viewMode === 'doctor-register') && (
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${viewMode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Patient Registration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('doctor-register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${viewMode === 'doctor-register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Doctor Registration
                </button>
              </div>
            )}

            {/* Success feedback */}
            {successMessage && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error feedback */}
            {errorMessage && viewMode !== 'forgot' && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. LOGIN FORM */}
            {viewMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email or Phone Number</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                      placeholder="name@example.com or phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPassword(prev => !prev);
                      }}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 focus:outline-none"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 text-blue-600" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-slate-600 font-medium">Remember me</span>
                  </label>
                  <button 
                    type="button"
                    onClick={() => {
                      setViewMode('forgot');
                      setForgotStep('request');
                      setForgotInput(loginEmail);
                      setForgotError('');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }} 
                    className="text-blue-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition flex items-center justify-center space-x-2 mt-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? <span>Signing In...</span> : <span>Sign In</span>}
                </button>
              </form>
            )}

            {/* 2. PATIENT REGISTRATION FORM */}
            {viewMode === 'register' && (
              <form onSubmit={handlePatientRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPassword(prev => !prev);
                      }}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 focus:outline-none"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 text-blue-600" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? <span>Creating Account...</span> : <span>Create Account</span>}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('doctor-register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5 mr-1.5" />
                    Are you a healthcare professional? Register Doctor Account →
                  </button>
                </div>
              </form>
            )}

            {/* 3. DOCTOR REGISTRATION FORM */}
            {viewMode === 'doctor-register' && (
              <form onSubmit={handleDoctorRegisterSubmit} className="space-y-3.5 max-h-[420px] overflow-y-auto pr-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Doctor Verification Required:</strong> After submitting, your credentials will undergo review by administrators. Access is granted upon approval.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Doctor Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="Dr. Rajiv Sharma"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={docEmail}
                        onChange={(e) => setDocEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="dr.sharma@medicare.local"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={docPhone}
                        onChange={(e) => setDocPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={docPassword}
                        onChange={(e) => setDocPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowPassword(prev => !prev);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Specialization</label>
                    <select
                      value={docSpecialization}
                      onChange={(e) => setDocSpecialization(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="ENT Specialist">ENT Specialist</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Gynecology">Gynecology</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Qualifications</label>
                    <input
                      type="text"
                      value={docQualification}
                      onChange={(e) => setDocQualification(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="MBBS, MD (Cardiology)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Exp (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={docExperience}
                      onChange={(e) => setDocExperience(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Hospital / Clinic</label>
                    <input
                      type="text"
                      value={docHospital}
                      onChange={(e) => setDocHospital(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder="MediCare Hospital"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={docFee}
                    onChange={(e) => setDocFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    placeholder="800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition flex items-center justify-center space-x-2 mt-3 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? <span>Submitting Application...</span> : <span>Register Doctor Account</span>}
                </button>

                <div className="pt-1 flex items-center justify-between text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('register');
                      setErrorMessage('');
                    }}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    ← Register as Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setErrorMessage('');
                    }}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* 4. DOCTOR REGISTRATION SUBMITTED (PENDING APPROVAL CONFIRMATION) */}
            {viewMode === 'doctor-pending' && (
              <div className="space-y-6 py-2 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Registration Submitted</h3>
                  <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                    Your doctor account has been submitted for administrator verification.
                  </p>
                </div>

                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Status: Pending Approval</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Doctor Name:</span>
                    <span className="font-bold text-slate-800">{submittedDocName || 'Doctor'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Specialization:</span>
                    <span className="font-bold text-slate-800">{submittedDocSpec || 'Cardiology'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Access Status:</span>
                    <span className="font-bold text-amber-600">Locked pending admin approval</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Our administrative team will review your qualifications and hospital credentials. Once verified and approved, you can sign in to access your doctor dashboard.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setSelectedRole('doctor');
                    setErrorMessage('');
                    setSuccessMessage('Your application is pending review. Please sign in once approved.');
                  }}
                  className="w-full max-w-md py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition cursor-pointer mx-auto block"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            {/* 5. FORGOT PASSWORD FLOW */}
            {viewMode === 'forgot' && (
              <div className="space-y-4">
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotStep === 'request' ? (
                  /* Step 1: Request Reset */
                  <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email / Phone</label>
                      <div className="relative">
                        <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={forgotInput}
                          onChange={(e) => setForgotInput(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                          placeholder="name@example.com or +91..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? <span>Sending Reset Request...</span> : <span>Send Reset Request</span>}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('login');
                          setForgotError('');
                          setErrorMessage('');
                        }}
                        className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Verification & New Password */
                  <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2">
                      <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Reset instructions sent to <strong>{forgotInput}</strong>. Enter code below:</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">6-Digit Reset Code</label>
                      <input
                        type="text"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none tracking-widest text-center"
                        placeholder="123456"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type={forgotShowPass ? 'text' : 'password'}
                          value={forgotNewPass}
                          onChange={(e) => setForgotNewPass(e.target.value)}
                          className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                          placeholder="New password (min 4 chars)"
                        />
                        <button
                          type="button"
                          onClick={() => setForgotShowPass(prev => !prev)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 focus:outline-none"
                        >
                          {forgotShowPass ? <EyeOff className="w-5 h-5 text-blue-600" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type={forgotShowPass ? 'text' : 'password'}
                          value={forgotConfirmPass}
                          onChange={(e) => setForgotConfirmPass(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                          placeholder="Re-type new password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? <span>Resetting Password...</span> : <span>Reset Password & Sign In</span>}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('login');
                          setForgotError('');
                          setErrorMessage('');
                        }}
                        className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Bottom Switch between Login / Register */}
          <div className="pt-6 border-t border-slate-100 text-center">
            {viewMode === 'forgot' || viewMode === 'doctor-register' || viewMode === 'doctor-pending' ? (
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setForgotError('');
                  setErrorMessage('');
                }}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer inline-flex items-center"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Return to Login
              </button>
            ) : viewMode === 'login' ? (
              <p className="text-xs text-slate-600 font-medium">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0 ml-1"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0 ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Right Info Section (Dynamic per Auth Mode) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-12 text-white hidden lg:flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full mb-8 border border-white/20">
              <Shield className="w-4 h-4 text-cyan-300" />
              <span className="text-xs font-bold tracking-wide">
                {viewMode === 'forgot'
                  ? 'Account Security'
                  : viewMode === 'doctor-register' || viewMode === 'doctor-pending'
                  ? 'Physician Network'
                  : viewMode === 'register'
                  ? 'Join MediCare'
                  : 'Trusted Healthcare'}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              {viewMode === 'forgot'
                ? 'Safe & Fast Account Recovery'
                : viewMode === 'doctor-register' || viewMode === 'doctor-pending'
                ? 'Expand Your Medical Practice'
                : viewMode === 'register'
                ? 'Start Your Health Journey'
                : 'Secure Patient & Clinical Access'}
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-3 leading-relaxed opacity-90">
              {viewMode === 'forgot'
                ? 'Safely reset your password using multi-factor identity verification to restore access to your medical dashboard.'
                : viewMode === 'doctor-register' || viewMode === 'doctor-pending'
                ? "Join MediCare's verified clinical network. Streamline appointment schedules, consult with patients, and manage digital EHRs."
                : viewMode === 'register'
                ? 'Create your personal patient profile to connect with top specialists, consult online, and track your health metrics.'
                : 'Access doctor schedules, health records, lab reports, and direct consultation logs with end-to-end security.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 mt-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-200 mb-3">
              {viewMode === 'doctor-register' || viewMode === 'doctor-pending' ? 'Clinical Capabilities' : viewMode === 'register' ? 'Patient Benefits' : 'Platform Features'}
            </h4>
            <div className="space-y-3">
              {viewMode === 'doctor-register' || viewMode === 'doctor-pending' ? (
                <>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Verified Doctor Credentials</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Automated Appointment Schedule</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <FileTextIcon className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Digital Prescription & EHR Management</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Shield className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Administrator Verified Profiles</span>
                  </div>
                </>
              ) : viewMode === 'register' ? (
                <>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Free Patient Account Registration</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>24/7 Real-Time Slot Booking</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <FileTextIcon className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Centralized Health Records & History</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Confidential & HIPAA-Compliant Data</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Lock className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Role-Based Access Control (RBAC)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Real-Time Calendar Booking</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <FileTextIcon className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Medical Records History</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-blue-50 font-medium">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
                    </div>
                    <span>Support & Instant Notifications</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
