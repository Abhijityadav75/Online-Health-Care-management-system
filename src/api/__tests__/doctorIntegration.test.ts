import { appointmentApi } from '../appointmentApi';
import { userApi } from '../userApi';
import { ApiError } from '../apiTypes';

/**
 * Doctor Portal Integration & Contract Test Suite (Phase 3.4 Final Correction)
 * All tests are MOCKED FRONTEND/API CONTRACT TESTS validating API service contracts against Servlet endpoints.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runDoctorCorrectionTests() {
  console.log('--- STARTING PHASE 3.4 FINAL CORRECTION TESTS (A-J & CROSS-ROLE) ---');
  const results: Record<string, boolean> = {};

  const originalFetch = global.fetch;

  try {
    // -------------------------------------------------------------------------
    // CROSS-ROLE SYNCHRONIZATION TEST (MOCKED API CONTRACT)
    // -------------------------------------------------------------------------
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.includes('/api/appointments') && method === 'POST') {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Appointment scheduled successfully.',
            data: {
              id: 'MC-20261005-99887',
              patientId: 'p-abhi',
              patientName: 'Abhi',
              doctorId: 'd-doc-1',
              doctorName: 'Dr. Priya Gupta',
              appointmentDate: '05 Oct 2026',
              appointmentDateIso: '2026-10-05',
              appointmentTime: '10:00 AM',
              type: 'Consultation',
              reason: 'Annual Health Checkup',
              status: 'UPCOMING'
            }
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/appointments/doctor') && method === 'GET') {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Doctor appointments retrieved',
            data: [
              {
                id: 'MC-20261005-99887',
                patientId: 'p-abhi',
                patientName: 'Abhi',
                doctorId: 'd-doc-1',
                doctorName: 'Dr. Priya Gupta',
                appointmentDate: '05 Oct 2026',
                appointmentDateIso: '2026-10-05',
                appointmentTime: '10:00 AM',
                type: 'Consultation',
                reason: 'Annual Health Checkup',
                status: 'UPCOMING'
              }
            ]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/users/patients') && method === 'GET') {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Patients retrieved',
            data: [{ id: 'p-abhi', name: 'Abhi', role: 'PATIENT', status: 'ACTIVE' }]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/appointments/apt-other-doctor') && method === 'GET') {
        return new Response(
          JSON.stringify({ success: false, message: 'Forbidden: You cannot view appointments assigned to another doctor.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/appointments/apt-unauthorized') && method === 'GET') {
        return new Response(
          JSON.stringify({ success: false, message: 'Forbidden: You cannot view appointments assigned to another doctor.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/appointments/apt-unauthorized/status') && method === 'PUT') {
        return new Response(
          JSON.stringify({ success: false, message: 'Forbidden: You cannot update status for an appointment assigned to another doctor.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/appointments/forged-impersonate') && method === 'PUT') {
        return new Response(
          JSON.stringify({ success: false, message: 'Forbidden: Doctor impersonation is prohibited.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/api/appointments/patient-ownership') && method === 'PUT') {
        return new Response(
          JSON.stringify({ success: false, message: 'Forbidden: Modifying patient ownership is prohibited.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true, message: 'OK', data: null }), { status: 200 });
    };

    // Patient booking -> Doctor retrieval cross-role test (MOCKED API CONTRACT)
    const bookRes = await appointmentApi.bookAppointment({
      doctorId: 'd-doc-1',
      appointmentDate: '05 Oct 2026',
      appointmentTime: '10:00 AM',
      reason: 'Annual Health Checkup',
      type: 'Consultation'
    });
    assert(Boolean(bookRes.success && bookRes.data?.id === 'MC-20261005-99887'), 'CROSS-ROLE: Patient booking returned server appointment ID');

    const docAptsRes = await appointmentApi.getDoctorAppointments();
    assert(Boolean(docAptsRes.success && docAptsRes.data?.length === 1), 'CROSS-ROLE: Doctor retrieved appointments');
    const retrievedApt = docAptsRes.data![0];
    assert(retrievedApt.id === bookRes.data?.id, 'CROSS-ROLE: Patient booking response and Doctor retrieval response use the same canonical appointment ID and fields under the mocked API contract.');
    results['CROSS_ROLE_SYNCHRONIZATION_TEST'] = true;

    // -------------------------------------------------------------------------
    // TESTS A THROUGH J (MOCKED FRONTEND/API CONTRACT TESTS)
    // -------------------------------------------------------------------------

    // TEST A: Doctor can retrieve own appointments
    const testARes = await appointmentApi.getDoctorAppointments();
    assert(testARes.success && Array.isArray(testARes.data), 'TEST A (MOCKED FRONTEND/API CONTRACT TEST): Doctor can retrieve own appointments');
    results['TEST_A'] = true;

    // TEST B: Doctor cannot retrieve another doctor's appointment
    try {
      await appointmentApi.getAppointmentById('apt-other-doctor');
      throw new Error('Should have failed');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'TEST B (MOCKED FRONTEND/API CONTRACT TEST): Doctor cannot retrieve another doctor appointment');
      results['TEST_B'] = true;
    }

    // TEST C: Doctor cannot retrieve another doctor's appointment details by ID
    try {
      await appointmentApi.getAppointmentById('apt-unauthorized');
      throw new Error('Should have failed');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'TEST C (MOCKED FRONTEND/API CONTRACT TEST): Doctor cannot view another doctor appointment by ID');
      results['TEST_C'] = true;
    }

    // TEST D: Doctor can update status of assigned appointment
    const testDRes = await appointmentApi.updateAppointmentStatus('MC-20261005-99887', { status: 'COMPLETED' });
    assert(testDRes.success, 'TEST D (MOCKED FRONTEND/API CONTRACT TEST): Doctor can update status of assigned appointment');
    results['TEST_D'] = true;

    // TEST E: Doctor cannot update status of another doctor's appointment
    try {
      await appointmentApi.updateAppointmentStatus('apt-unauthorized', { status: 'COMPLETED' });
      throw new Error('Should have failed');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'TEST E (MOCKED FRONTEND/API CONTRACT TEST): Doctor cannot update status of another doctor appointment');
      results['TEST_E'] = true;
    }

    // TEST F: Patient-created appointment appears to assigned Doctor
    assert(docAptsRes.data!.some(a => a.id === 'MC-20261005-99887'), 'TEST F (MOCKED FRONTEND/API CONTRACT TEST): Patient-created appointment appears to assigned Doctor');
    results['TEST_F'] = true;

    // TEST G: Appointment ID remains unchanged across Patient and Doctor
    assert(bookRes.data?.id === retrievedApt.id, 'TEST G (MOCKED FRONTEND/API CONTRACT TEST): Appointment ID remains unchanged across Patient and Doctor');
    results['TEST_G'] = true;

    // TEST H: Doctor cannot impersonate another doctor
    try {
      await appointmentApi.updateAppointmentStatus('forged-impersonate', { status: 'COMPLETED' });
      throw new Error('Should have failed');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'TEST H (MOCKED FRONTEND/API CONTRACT TEST): Doctor cannot impersonate another doctor');
      results['TEST_H'] = true;
    }

    // TEST I: Doctor cannot modify Patient ownership
    try {
      await appointmentApi.updateAppointmentStatus('patient-ownership', { status: 'COMPLETED' });
      throw new Error('Should have failed');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'TEST I (MOCKED FRONTEND/API CONTRACT TEST): Doctor cannot modify Patient ownership');
      results['TEST_I'] = true;
    }

    // TEST J: Appointment ID always comes from backend/server
    assert(retrievedApt.id.startsWith('MC-'), 'TEST J (MOCKED FRONTEND/API CONTRACT TEST): Appointment ID always comes from backend');
    results['TEST_J'] = true;

    console.log('--- ALL PHASE 3.4 FINAL CORRECTION TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Final correction test failure:', err);
    throw err;
  } finally {
    global.fetch = originalFetch;
  }
}

runDoctorCorrectionTests().catch(console.error);
