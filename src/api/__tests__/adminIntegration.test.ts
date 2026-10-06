import { userApi } from '../userApi';
import { appointmentApi } from '../appointmentApi';
import { analyticsApi } from '../analyticsApi';
import { authApi } from '../authApi';
import { ApiError } from '../apiTypes';

/**
 * MOCKED FRONTEND/API CONTRACT TEST
 * Verifies Admin portal API contracts, authorization checks, and backend data flows (Phase 3.5 Final Correction Pass #2).
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

export async function runAdminIntegrationTests() {
  console.log('--- STARTING PHASE 3.5 ADMIN INTEGRATION & CONTRACT TESTS ---');
  const originalFetch = global.fetch;

  try {
    // -------------------------------------------------------------------------
    // TEST A: Admin can retrieve users
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'Users retrieved',
        data: [{ id: 'u-admin-1', name: 'Admin User', role: 'ADMIN' }]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const usersRes = await userApi.getAllUsers();
    assert(Boolean(usersRes.success) && Array.isArray(usersRes.data) && usersRes.data[0].id === 'u-admin-1', 'A. Admin can retrieve users');

    // -------------------------------------------------------------------------
    // TEST B: Non-admin cannot retrieve users (403 Forbidden)
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: false,
        error: 'Forbidden',
        message: 'Admin privilege required'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await userApi.getAllUsers();
      assert(false, 'B. Non-admin should have been rejected with 403 Forbidden');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'B. Non-admin cannot retrieve users (Caught 403 ApiError)');
    }

    // -------------------------------------------------------------------------
    // TEST C: Admin can retrieve appointments
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'Admin appointments retrieved',
        data: [{ id: 'MC-20261003-10001', patientId: 'p-100', doctorId: 'd-200', status: 'UPCOMING' }]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const aptsRes = await appointmentApi.getAdminAppointments();
    assert(Boolean(aptsRes.success) && Array.isArray(aptsRes.data) && aptsRes.data[0].id === 'MC-20261003-10001', 'C. Admin can retrieve appointments');

    // -------------------------------------------------------------------------
    // TEST D: Non-admin cannot retrieve Admin appointments (403 Forbidden)
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: false,
        error: 'Forbidden',
        message: 'Admin role required'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await appointmentApi.getAdminAppointments();
      assert(false, 'D. Non-admin should have been rejected with 403 Forbidden');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'D. Non-admin cannot retrieve Admin appointments (Caught 403 ApiError)');
    }

    // -------------------------------------------------------------------------
    // TEST E: Admin can approve doctor
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'Doctor registration approved successfully',
        data: null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const apprRes = await userApi.approveDoctor('d-test');
    assert(Boolean(apprRes.success), 'E. Admin can approve doctor');

    // -------------------------------------------------------------------------
    // TEST F: Non-admin cannot approve doctor (403 Forbidden)
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: false,
        error: 'Forbidden',
        message: 'Only administrators can approve doctor credentials'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await userApi.approveDoctor('d-test');
      assert(false, 'F. Non-admin doctor approval should have been rejected with 403');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'F. Non-admin cannot approve doctor (Caught 403 ApiError)');
    }

    // -------------------------------------------------------------------------
    // TEST G: Admin can retrieve analytics
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'Live analytics computed successfully from database',
        data: {
          totalAppointments: 15,
          completedConsultations: 8,
          upcomingAppointments: 5,
          cancelledAppointments: 2,
          standardConsultationDuration: '20 mins',
          totalUsers: 25,
          patientCount: 18,
          doctorCount: 6,
          adminCount: 1,
          departments: [{ department: 'Cardiology', doctorCount: 2, consultations: 5, loadPercentage: '33%' }]
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const analyticsRes = await analyticsApi.getOverview();
    assert(Boolean(analyticsRes.success) && analyticsRes.data?.totalAppointments === 15, 'G. Admin can retrieve analytics');

    // -------------------------------------------------------------------------
    // TEST H: Non-admin cannot retrieve analytics (403 Forbidden)
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: false,
        error: 'Forbidden',
        message: 'Administrative privileges required to access system analytics'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    try {
      await analyticsApi.getOverview();
      assert(false, 'H. Non-admin analytics request should have been rejected with 403');
    } catch (err: any) {
      assert(err instanceof ApiError && err.status === 403, 'H. Non-admin cannot retrieve analytics (Caught 403 ApiError)');
    }

    // -------------------------------------------------------------------------
    // TEST I: Verify Admin appointment request actually contains patientId AND doctorId
    // -------------------------------------------------------------------------
    let capturedBody: any = null;
    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.body) {
        capturedBody = JSON.parse(String(init.body));
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Appointment scheduled successfully',
          data: { id: 'MC-20261003-99999', patientId: 'p-real-123', doctorId: 'd-real-456' }
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    await appointmentApi.bookAdminAppointment({
      patientId: 'p-real-123',
      doctorId: 'd-real-456',
      appointmentDate: '03 Oct 2026',
      appointmentDateIso: '2026-10-03',
      appointmentTime: '10:00 AM',
      type: 'In-clinic',
      reason: 'Admin Scheduled Consult'
    });

    assert(capturedBody !== null, 'I. Request body was captured by mock fetch');
    assert(capturedBody.patientId === 'p-real-123', 'I. Captured request body contains patientId === "p-real-123"');
    assert(capturedBody.doctorId === 'd-real-456', 'I. Captured request body contains doctorId === "d-real-456"');

    // -------------------------------------------------------------------------
    // TEST J: Verify backend appointment ID is treated as canonical
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'Appointment scheduled successfully',
        data: {
          id: 'MC-20260928-12345',
          patientId: 'p-real-123',
          doctorId: 'd-real-456',
          appointmentDate: '28 Sep 2026',
          appointmentTime: '10:00 AM',
          status: 'UPCOMING'
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

    const bookedAptRes = await appointmentApi.bookAdminAppointment({
      patientId: 'p-real-123',
      doctorId: 'd-real-456',
      appointmentDate: '28 Sep 2026',
      appointmentTime: '10:00 AM',
      reason: 'Canonical ID Test'
    });

    assert(bookedAptRes.data?.id === 'MC-20260928-12345', 'J. Backend appointment ID "MC-20260928-12345" is treated as canonical');

    // -------------------------------------------------------------------------
    // TEST K: Verify Admin user creation does NOT generate a frontend ID
    // -------------------------------------------------------------------------
    global.fetch = async () => new Response(
      JSON.stringify({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: 'p-backend-999',
            name: 'New Registered Patient',
            email: 'registered@medicare.local',
            phone: '+91 98765 00000',
            role: 'PATIENT',
            status: 'ACTIVE'
          },
          pendingApproval: false
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

    const registerRes = await authApi.register({
      name: 'New Registered Patient',
      email: 'registered@medicare.local',
      phone: '+91 98765 00000',
      password: 'UserSpecifiedPass123!',
      role: 'PATIENT'
    });

    assert(registerRes.data?.user.id === 'p-backend-999', 'K. User registration returns backend-generated ID "p-backend-999" without frontend ID synthesis');

    // -------------------------------------------------------------------------
    // TEST L: Cross-role appointment identity consistency under mocked contract
    // -------------------------------------------------------------------------
    const canonicalAptDto = {
      id: 'MC-TEST-123',
      patientId: 'p-123',
      doctorId: 'd-456',
      appointmentDate: '05 Oct 2026',
      appointmentTime: '11:00 AM',
      status: 'UPCOMING'
    };

    // Patient booking response
    global.fetch = async () => new Response(
      JSON.stringify({ success: true, data: canonicalAptDto }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    const patientBookingRes = await appointmentApi.bookAppointment({
      doctorId: 'd-456',
      appointmentDate: '05 Oct 2026',
      appointmentTime: '11:00 AM',
      reason: 'Cross-role check'
    });

    // Admin retrieval response
    global.fetch = async () => new Response(
      JSON.stringify({ success: true, data: [canonicalAptDto] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    const adminRetrievalRes = await appointmentApi.getAdminAppointments();

    // Doctor retrieval response
    global.fetch = async () => new Response(
      JSON.stringify({ success: true, data: [canonicalAptDto] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    const doctorRetrievalRes = await appointmentApi.getDoctorAppointments();

    const pApt = patientBookingRes.data!;
    const aApt = adminRetrievalRes.data![0];
    const dApt = doctorRetrievalRes.data![0];

    assert(pApt.id === aApt.id && pApt.id === dApt.id, 'L. Cross-role ID consistency: patient.id === admin.id === doctor.id');
    assert(pApt.patientId === aApt.patientId && pApt.patientId === dApt.patientId, 'L. Cross-role patientId consistency: patient.patientId === admin.patientId === doctor.patientId');
    assert(pApt.doctorId === aApt.doctorId && pApt.doctorId === dApt.doctorId, 'L. Cross-role doctorId consistency: patient.doctorId === admin.doctorId === doctor.doctorId');

    console.log('--- ALL PHASE 3.5 ADMIN INTEGRATION & CONTRACT TESTS PASSED ---');
  } finally {
    global.fetch = originalFetch;
  }
}
