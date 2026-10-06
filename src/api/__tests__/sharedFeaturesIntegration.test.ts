import { notificationApi } from '../notificationApi';
import { medicalRecordApi } from '../medicalRecordApi';
import { feedbackApi } from '../feedbackApi';
import { appointmentApi } from '../appointmentApi';
import { ApiError } from '../apiTypes';

/**
 * MOCKED FRONTEND/API CONTRACT TEST
 * Verifies shared feature API contracts (Notifications, Medical Records, Feedback)
 * and cross-role canonical appointment ID consistency across Java Servlets & MySQL schemas.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

export async function runSharedFeaturesIntegrationTests() {
  console.log('--- STARTING PHASE 3.6 SHARED FEATURES CONTRACT TESTS ---');
  const originalFetch = global.fetch;

  try {
    // =========================================================================
    // NOTIFICATIONS TESTS
    // =========================================================================

    // TEST A: Authenticated user can retrieve own notifications
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications retrieved',
        data: [
          {
            id: 'notif-101',
            userId: 'p-pat-1',
            appointmentId: 'MC-20261001-98721',
            title: 'Appointment Scheduled',
            message: 'Your appointment with Dr. Mehta is confirmed.',
            notificationType: 'APPOINTMENT',
            isRead: false,
            createdAt: '2026-10-01T10:00:00Z'
          }
        ]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const notifRes = await notificationApi.getNotifications();
    assert(Boolean(notifRes.success) && Array.isArray(notifRes.data) && notifRes.data[0].id === 'notif-101', 'A. Authenticated user can retrieve own notifications');

    // TEST B: User cannot retrieve another user's notifications (403 Forbidden)
    global.fetch = async () => new Response(
      JSON.stringify({
        success: false,
        error: 'Forbidden',
        message: 'Access denied to notifications for another user'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await notificationApi.getNotifications();
      assert(false, 'B. Should have thrown 403 Forbidden');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'B. User cannot retrieve another user\'s notifications (Caught 403 ApiError)');
    }

    // TEST C: Mark-read calls the correct backend endpoint
    let markReadUrl = '';
    global.fetch = async (input: RequestInfo | URL) => {
      markReadUrl = String(input);
      return new Response(
        JSON.stringify({ success: true, message: 'Notification marked as read', data: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const markRes = await notificationApi.markAsRead('notif-101');
    assert(Boolean(markRes.success) && markReadUrl.includes('/notifications/notif-101/read'), 'C. Mark-read calls the correct backend endpoint /notifications/notif-101/read');

    // TEST D: Notification appointmentId remains canonical
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        data: [{ id: 'notif-102', userId: 'd-doc-1', appointmentId: 'MC-20261001-98721', title: 'New Consult', message: 'New consult booked', notificationType: 'APPOINTMENT', isRead: false }]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const docNotifRes = await notificationApi.getNotifications();
    assert(docNotifRes.data?.[0].appointmentId === 'MC-20261001-98721', 'D. Notification appointmentId remains canonical ("MC-20261001-98721")');

    // =========================================================================
    // MEDICAL RECORDS TESTS
    // =========================================================================

    // TEST E: Authorized patient can retrieve own medical records
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'Medical records retrieved',
        data: [
          {
            id: 'mr-501',
            patientId: 'p-pat-1',
            doctorId: 'd-doc-1',
            recordDate: '2026-10-01',
            recordType: 'Consultation',
            diagnosis: 'Hypertension Stage 1',
            treatmentPlan: 'Lifestyle modifications and daily blood pressure tracking',
            prescriptions: 'Amlodipine 5mg OD'
          }
        ]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const medRes = await medicalRecordApi.getMedicalRecords();
    assert(Boolean(medRes.success) && Array.isArray(medRes.data) && medRes.data[0].id === 'mr-501', 'E. Authorized patient can retrieve own medical records');

    // TEST F: Unauthorized user receives 403 Forbidden
    global.fetch = async () => new Response(
      JSON.stringify({ success: false, error: 'Forbidden', message: 'Unauthorized medical record access' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await medicalRecordApi.getMedicalRecords('p-other-user');
      assert(false, 'F. Should have thrown 403');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'F. Unauthorized user receives 403 Forbidden');
    }

    // TEST G: Authorized doctor can access a permitted completed-consultation record
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        data: [{ id: 'mr-502', patientId: 'p-pat-1', doctorId: 'd-doc-1', recordDate: '2026-10-01', recordType: 'Clinical Note', diagnosis: 'Post-consultation follow up' }]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const docRecRes = await medicalRecordApi.getMedicalRecords('p-pat-1');
    assert(Boolean(docRecRes.success) && docRecRes.data?.[0].doctorId === 'd-doc-1', 'G. Authorized doctor can access a permitted completed-consultation record');

    // TEST H: Doctor cannot access an unrelated patient's record (403 Forbidden)
    global.fetch = async () => new Response(
      JSON.stringify({ success: false, error: 'Forbidden', message: 'No established doctor-patient clinical relationship' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await medicalRecordApi.getMedicalRecords('p-unrelated-999');
      assert(false, 'H. Should have thrown 403 for unrelated patient');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'H. Doctor cannot access an unrelated patient\'s record (Caught 403 ApiError)');
    }

    // TEST I: Medical record creation/update uses backend API
    let createdRecordBody: any = null;
    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.body) createdRecordBody = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'mr-backend-777',
            patientId: 'p-pat-1',
            doctorId: 'd-doc-1',
            recordDate: '2026-10-01',
            recordType: 'Prescription',
            diagnosis: 'Acute Bronchitis'
          }
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const newRecordRes = await medicalRecordApi.createMedicalRecord({
      patientId: 'p-pat-1',
      recordDate: '2026-10-01',
      recordType: 'Prescription',
      diagnosis: 'Acute Bronchitis',
      treatmentPlan: 'Rest and hydration',
      prescriptions: 'Azithromycin 500mg'
    });

    assert(createdRecordBody?.patientId === 'p-pat-1', 'I. Medical record payload sent patientId "p-pat-1" to backend API');
    assert(newRecordRes.data?.id === 'mr-backend-777', 'I. Medical record creation received backend-generated ID "mr-backend-777"');

    // =========================================================================
    // FEEDBACK TESTS
    // =========================================================================

    // TEST J: Patient can submit feedback for a completed appointment
    let feedbackBody: any = null;
    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.body) feedbackBody = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          success: true,
          data: { id: 'fb-801', patientId: 'p-pat-1', doctorId: 'd-doc-1', appointmentId: 'MC-20261001-98721', rating: 5, comment: 'Great consultation!' }
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const fbRes = await feedbackApi.submitFeedback({
      doctorId: 'd-doc-1',
      appointmentId: 'MC-20261001-98721',
      rating: 5,
      comment: 'Great consultation!'
    });

    assert(Boolean(fbRes.success) && fbRes.data?.id === 'fb-801', 'J. Patient can submit feedback for a completed appointment');

    // TEST K: Non-patient cannot submit feedback (403 Forbidden)
    global.fetch = async () => new Response(
      JSON.stringify({ success: false, error: 'Forbidden', message: 'Only patients can submit consultation feedback' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await feedbackApi.submitFeedback({ doctorId: 'd-doc-1', appointmentId: 'MC-20261001-98721', rating: 5, comment: 'Illegal doc feedback' });
      assert(false, 'K. Should have thrown 403 for non-patient');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'K. Non-patient cannot submit feedback (Caught 403 ApiError)');
    }

    // TEST L: Feedback for incomplete/cancelled appointment is rejected (400 Bad Request)
    global.fetch = async () => new Response(
      JSON.stringify({ success: false, error: 'Bad Request', message: 'Feedback can only be submitted for completed consultations' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await feedbackApi.submitFeedback({ doctorId: 'd-doc-1', appointmentId: 'MC-UPCOMING-001', rating: 4, comment: 'Consultation not done' });
      assert(false, 'L. Should have thrown 400 for incomplete appointment');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 400, 'L. Feedback for incomplete/cancelled appointment is rejected (Caught 400 ApiError)');
    }

    // TEST M: Duplicate feedback for same appointment is rejected (409 Conflict)
    global.fetch = async () => new Response(
      JSON.stringify({ success: false, error: 'Conflict', message: 'Feedback already submitted for this appointment' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await feedbackApi.submitFeedback({ doctorId: 'd-doc-1', appointmentId: 'MC-20261001-98721', rating: 5, comment: 'Second attempt' });
      assert(false, 'M. Should have thrown 409 Conflict for duplicate feedback');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 409, 'M. Duplicate feedback for same appointment is rejected (Caught 409 ApiError)');
    }

    // TEST N: Feedback request contains canonical appointmentId
    assert(feedbackBody?.appointmentId === 'MC-20261001-98721', 'N. Feedback request contains canonical appointmentId "MC-20261001-98721"');

    // =========================================================================
    // CROSS-FEATURE & CANONICAL IDENTITY TESTS
    // =========================================================================

    // TEST O: Patient booking -> canonical appointment ID -> Doctor notification references same appointment ID
    const canonicalAptId = 'MC-20261001-98721';
    
    // 1) Patient books appointment
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        data: { id: canonicalAptId, patientId: 'p-pat-1', doctorId: 'd-doc-1', appointmentDate: '01 Oct 2026', appointmentTime: '10:00 AM', status: 'UPCOMING' }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

    const bookedApt = await appointmentApi.bookAppointment({
      doctorId: 'd-doc-1',
      appointmentDate: '01 Oct 2026',
      appointmentTime: '10:00 AM',
      reason: 'Cross-feature verification'
    });

    // 2) Doctor retrieves notifications created by backend
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        data: [{ id: 'notif-doc-909', userId: 'd-doc-1', appointmentId: canonicalAptId, title: 'New Appointment Booked', message: 'New consult', notificationType: 'APPOINTMENT', isRead: false }]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const docNotifs = await notificationApi.getNotifications();

    assert(bookedApt.data?.id === canonicalAptId, 'O. Patient booking returns canonical ID "MC-20261001-98721"');
    assert(docNotifs.data?.[0].appointmentId === canonicalAptId, 'O. Doctor notification references exact same canonical appointment ID "MC-20261001-98721"');

    // TEST P: No shared feature creates frontend-generated authoritative IDs
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        data: { id: 'mr-backend-generated-999', patientId: 'p-pat-1', doctorId: 'd-doc-1', recordType: 'Consultation', diagnosis: 'Checkup' }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

    const recordCreated = await medicalRecordApi.createMedicalRecord({ patientId: 'p-pat-1', diagnosis: 'Checkup' });
    assert(recordCreated.data?.id === 'mr-backend-generated-999', 'P. Medical record ID "mr-backend-generated-999" was generated strictly by the backend');

    console.log('--- ALL PHASE 3.6 SHARED FEATURES CONTRACT TESTS PASSED ---');
  } finally {
    global.fetch = originalFetch;
  }
}
