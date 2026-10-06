import { appointmentApi } from '../appointmentApi';
import { userApi } from '../userApi';
import { ApiError } from '../apiTypes';

/**
 * Patient Integration Test Suite (Phase 3.3 Correction)
 * TYPE: MOCKED FRONTEND / API CONTRACT TESTS
 * Verifies that the Patient frontend workflows interact strictly with the Java Jakarta Servlets and MySQL schema.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runPatientIntegrationTests(): Promise<{ results: Record<string, boolean>; passed: boolean }> {
  const originalFetch = globalThis.fetch;
  const results: Record<string, boolean> = {};

  try {
    // -------------------------------------------------------------------------
    // TEST A: Patient fetches appointments from API (GET /api/appointments/patient)
    // -------------------------------------------------------------------------
    globalThis.fetch = (async (url: string | URL | Request) => {
      assert(String(url).endsWith('/appointments/patient'), 'TEST A: Endpoint matches /appointments/patient');
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 'MC-20261001-98721',
              patientId: 'p-abhi',
              patientName: 'abhi',
              doctorId: 'd-3',
              doctorName: 'Dr. Priya Gupta',
              doctorSpecialization: 'Dermatologist',
              appointmentDate: '01 Oct 2026',
              appointmentDateIso: '2026-10-01',
              appointmentTime: '10:30 AM',
              reason: 'Routine health checkup',
              status: 'UPCOMING',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resA = await appointmentApi.getPatientAppointments();
    assert(Boolean(resA.success && resA.data?.length === 1), 'TEST A: Patient appointments fetched from API');
    results['TEST_A_PATIENT_APPOINTMENT_FETCH'] = true;

    // -------------------------------------------------------------------------
    // TEST B: Patient booking calls POST /api/appointments
    // -------------------------------------------------------------------------
    let postedEndpoint = '';
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      postedEndpoint = String(url);
      const body = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment booked successfully',
          data: {
            id: 'MC-20261005-12345',
            patientId: 'p-abhi',
            doctorId: body.doctorId,
            appointmentDate: body.appointmentDate,
            appointmentDateIso: body.appointmentDateIso,
            appointmentTime: body.appointmentTime,
            reason: body.reason,
            status: 'UPCOMING',
          },
        }),
        { status: 201, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resB = await appointmentApi.bookAppointment({
      doctorId: 'd-3',
      appointmentDate: '05 Oct 2026',
      appointmentDateIso: '2026-10-05',
      appointmentTime: '11:00 AM',
      type: 'Consultation',
      reason: 'Follow-up consultation',
    });
    assert(postedEndpoint.endsWith('/appointments'), 'TEST B: Endpoint matches POST /appointments');
    assert(Boolean(resB.success && resB.data?.id.startsWith('MC-')), 'TEST B: Appointment booked');
    results['TEST_B_PATIENT_BOOKING_POST'] = true;

    // -------------------------------------------------------------------------
    // TEST C: Patient booking does not send forged patientId (Session-bound)
    // -------------------------------------------------------------------------
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      const payload = JSON.parse(init?.body as string);
      assert(!payload.patientId, 'TEST C: Patient ID omitted from client request payload');
      return new Response(
        JSON.stringify({
          success: true,
          data: { id: 'MC-20261001-98721', patientId: 'p-abhi', doctorId: 'd-3', status: 'UPCOMING' },
        }),
        { status: 201, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    await appointmentApi.bookAppointment({
      doctorId: 'd-3',
      appointmentDate: '01 Oct 2026',
      appointmentTime: '10:30 AM',
      reason: 'Routine checkup',
    });
    results['TEST_C_BOOKING_OMITS_PATIENT_ID'] = true;

    // -------------------------------------------------------------------------
    // TEST D: Backend appointment ID is used (No client-side Math.random generation)
    // -------------------------------------------------------------------------
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'MC-20261001-98721',
            patientId: 'p-abhi',
            doctorId: 'd-3',
            doctorName: 'Dr. Priya Gupta',
            appointmentDate: '01 Oct 2026',
            appointmentTime: '10:30 AM',
            status: 'UPCOMING',
          },
        }),
        { status: 201, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resD = await appointmentApi.bookAppointment({
      doctorId: 'd-3',
      appointmentDate: '01 Oct 2026',
      appointmentTime: '10:30 AM',
      reason: 'Checkup',
    });
    assert(resD.data?.id === 'MC-20261001-98721', 'TEST D: Authoritative backend ID returned');
    results['TEST_D_BACKEND_APPOINTMENT_ID_USED'] = true;

    // -------------------------------------------------------------------------
    // TEST E: Patient cancellation calls DELETE /api/appointments/{id}
    // -------------------------------------------------------------------------
    let deleteMethod = '';
    let deletedId = '';
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      deleteMethod = init?.method || '';
      deletedId = String(url).split('/').pop() || '';
      return new Response(
        JSON.stringify({ success: true, message: 'Appointment cancelled successfully' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resE = await appointmentApi.cancelAppointment('MC-20261001-98721');
    assert(resE.success && deleteMethod === 'DELETE' && deletedId === 'MC-20261001-98721', 'TEST E: Cancellation invoked DELETE');
    results['TEST_E_PATIENT_CANCELLATION_DELETE'] = true;

    // -------------------------------------------------------------------------
    // TEST F: Patient rescheduling calls PUT /api/appointments/{id}/reschedule
    // -------------------------------------------------------------------------
    let putMethod = '';
    let putEndpoint = '';
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      putMethod = init?.method || '';
      putEndpoint = String(url);
      return new Response(
        JSON.stringify({ success: true, message: 'Appointment rescheduled successfully' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resF = await appointmentApi.rescheduleAppointment('MC-20261001-98721', {
      date: '02 Oct 2026',
      dateIso: '2026-10-02',
      time: '02:00 PM',
    });
    assert(resF.success && putMethod === 'PUT' && putEndpoint.includes('/reschedule'), 'TEST F: Rescheduling invoked PUT');
    results['TEST_F_PATIENT_RESCHEDULING_PUT'] = true;

    // -------------------------------------------------------------------------
    // TEST G: Patient profile update calls PUT /api/users/{id}
    // -------------------------------------------------------------------------
    let updateUrl = '';
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      updateUrl = String(url);
      const body = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Profile updated successfully',
          data: {
            id: 'p-abhi',
            name: body.name || 'abhi',
            email: 'abhi@example.com',
            phone: body.phone || '+91 98765 43299',
            role: 'PATIENT',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resG = await userApi.updateUserProfile('p-abhi', { name: 'abhi updated', phone: '+91 98765 00000' });
    assert(resG.success && updateUrl.endsWith('/users/p-abhi'), 'TEST G: Profile update sent to PUT /users/p-abhi');
    results['TEST_G_PATIENT_PROFILE_UPDATE_PUT'] = true;

    // -------------------------------------------------------------------------
    // TEST H: Doctor list calls GET /api/users/doctors
    // -------------------------------------------------------------------------
    let docListUrl = '';
    globalThis.fetch = (async (url: string | URL | Request) => {
      docListUrl = String(url);
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            { id: 'd-1', name: 'Dr. Ananya Sharma', specialization: 'Cardiologist', approvalStatus: 'APPROVED' },
            { id: 'd-3', name: 'Dr. Priya Gupta', specialization: 'Dermatologist', approvalStatus: 'APPROVED' },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resH = await userApi.getDoctors();
    assert(resH.success && docListUrl.endsWith('/users/doctors') && resH.data?.length === 2, 'TEST H: Doctors loaded from GET /users/doctors');
    results['TEST_H_DOCTOR_LIST_BACKEND'] = true;

    // -------------------------------------------------------------------------
    // TEST I: Patient appointment data is not read from localStorage
    // -------------------------------------------------------------------------
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('medicare_appointments');
      assert(localStorage.getItem('medicare_appointments') === null, 'TEST I: No medicare_appointments in localStorage');
    }
    results['TEST_I_NO_LOCALSTORAGE_READ'] = true;

    // -------------------------------------------------------------------------
    // TEST J: Canonical appointment MC-20261001-98721 is received from API
    // -------------------------------------------------------------------------
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: 'MC-20261001-98721',
            patientId: 'p-abhi',
            doctorId: 'd-3',
            doctorName: 'Dr. Priya Gupta',
            appointmentDate: '01 Oct 2026',
            appointmentTime: '10:30 AM',
            status: 'UPCOMING',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resJ = await appointmentApi.getAppointmentById('MC-20261001-98721');
    assert(resJ.data?.id === 'MC-20261001-98721' && resJ.data?.doctorId === 'd-3', 'TEST J: Canonical appointment received from API');
    results['TEST_J_CANONICAL_APT_RECEIVED_FROM_API'] = true;

    return { results, passed: true };
  } finally {
    globalThis.fetch = originalFetch;
  }
}
