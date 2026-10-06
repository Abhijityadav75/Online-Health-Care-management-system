/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ScreenReferenceModal } from './components/ScreenReferenceModal';

import { LandingPage } from './screens/LandingPage';
import { AboutPage } from './screens/AboutPage';
import { ServicesPage } from './screens/ServicesPage';
import { DoctorsPage } from './screens/DoctorsPage';
import { ContactPage } from './screens/ContactPage';
import { AuthScreen } from './screens/AuthScreen';

import { PatientDashboard } from './screens/patient/PatientDashboard';
import { BookAppointmentWizard } from './screens/patient/BookAppointmentWizard';
import { PatientAppointments } from './screens/patient/PatientAppointments';
import { MedicalHistoryScreen } from './screens/patient/MedicalHistoryScreen';
import { PatientProfileScreen } from './screens/patient/PatientProfileScreen';

import { DoctorDashboard } from './screens/doctor/DoctorDashboard';
import { DoctorAppointmentsScreen } from './screens/doctor/DoctorAppointmentsScreen';
import { DoctorCalendarScreen } from './screens/doctor/DoctorCalendarScreen';
import { DoctorPatientsScreen } from './screens/doctor/DoctorPatientsScreen';
import { PatientRecordDetailScreen } from './screens/doctor/PatientRecordDetailScreen';
import { DoctorAvailabilityScreen } from './screens/doctor/DoctorAvailabilityScreen';

import { AdminDashboard } from './screens/admin/AdminDashboard';
import { NotificationsFeedbackScreen } from './screens/NotificationsFeedbackScreen';
import { SettingsSupportScreen } from './screens/SettingsSupportScreen';

function MainContent() {
  const { currentScreen, sidebarOpen, currentUser, selectedDoctorIdForBooking, authLoading } = useApp();

  const isProtected = currentScreen.startsWith('patient-') ||
                      currentScreen.startsWith('doctor-') ||
                      currentScreen.startsWith('admin-') ||
                      currentScreen === 'settings' ||
                      currentScreen === 'notifications';

  const isAuthScreen = currentScreen === 'login' || currentScreen === 'register' || (!currentUser && isProtected);

  const isPublicScreen = ['landing', 'about', 'services', 'doctors', 'contact'].includes(currentScreen);

  const renderScreen = () => {
    // Initial session rehydration loading state
    if (authLoading && isProtected) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Restoring session...</p>
        </div>
      );
    }

    // Unauthenticated route guard: if user is not logged in and attempts to access protected screens, show login
    if (isProtected && !currentUser) {
      return <AuthScreen />;
    }

    switch (currentScreen) {
      case 'landing':
        return <LandingPage />;
      case 'about':
        return <AboutPage />;
      case 'services':
        return <ServicesPage />;
      case 'doctors':
        return <DoctorsPage />;
      case 'contact':
        return <ContactPage />;
      case 'login':
        return <AuthScreen />;
      case 'register':
        return <AuthScreen />;

      // Patient screens
      case 'patient-dashboard':
        return <PatientDashboard />;
      case 'patient-book':
        return <BookAppointmentWizard key={selectedDoctorIdForBooking || 'patient-book'} />;
      case 'patient-appointments':
        return <PatientAppointments />;
      case 'patient-records':
        return <MedicalHistoryScreen />;
      case 'patient-profile':
        return <PatientProfileScreen />;

      // Doctor screens
      case 'doctor-dashboard':
        return <DoctorDashboard />;
      case 'doctor-appointments':
        return <DoctorAppointmentsScreen />;
      case 'doctor-calendar':
        return <DoctorCalendarScreen />;
      case 'doctor-patients':
        return <DoctorPatientsScreen />;
      case 'patient-record-detail':
        return <PatientRecordDetailScreen />;
      case 'doctor-availability':
        return <DoctorAvailabilityScreen />;

      // Admin screens
      case 'admin-dashboard':
        return <AdminDashboard initialTab="Dashboard" />;
      case 'admin-users':
        return <AdminDashboard initialTab="Users" />;
      case 'admin-appointments':
        return <AdminDashboard initialTab="Appointments" />;

      // Shared screens
      case 'notifications':
        return <NotificationsFeedbackScreen />;
      case 'settings':
        return <SettingsSupportScreen />;

      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />
      <ScreenReferenceModal />
      <div className="flex flex-1">
        {sidebarOpen && <Sidebar />}
        <main className={`flex-1 w-full ${isAuthScreen ? 'pb-0' : 'pb-16 md:pb-8'}`}>
          {renderScreen()}
        </main>
      </div>
      {!currentUser && isPublicScreen && !isAuthScreen && <Footer />}
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
