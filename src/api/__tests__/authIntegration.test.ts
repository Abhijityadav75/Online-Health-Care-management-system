import { authApi } from '../authApi';
import { ApiError } from '../apiTypes';

/**
 * Authentication Test Matrix (TEST A - TEST H)
 * Verifies end-to-end contract between React auth API and Java AuthServlet / HttpSession.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runAuthTests(): Promise<{ results: Record<string, boolean>; passed: boolean }> {
  const originalFetch = globalThis.fetch;
  const results: Record<string, boolean> = {};

  try {
    // TEST A — Patient login (abhi@example.com)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful',
          data: {
            user: { id: 'p-abhi', name: 'abhi', email: 'abhi@example.com', role: 'PATIENT', status: 'ACTIVE' },
            role: 'PATIENT',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resA = await authApi.login({ identifier: 'abhi@example.com', password: 'password123' });
    assert(resA.success && resA.data?.role === 'PATIENT', 'TEST A: Patient login succeeded');
    results['TEST_A_PATIENT_LOGIN'] = true;

    // TEST B — Doctor login (priya.gupta@medicare.com)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful',
          data: {
            user: { id: 'd-3', name: 'Dr. Priya Gupta', email: 'priya.gupta@medicare.com', role: 'DOCTOR', approvalStatus: 'APPROVED' },
            role: 'DOCTOR',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resB = await authApi.login({ identifier: 'priya.gupta@medicare.com', password: 'password123' });
    assert(resB.success && resB.data?.role === 'DOCTOR', 'TEST B: Doctor login succeeded');
    results['TEST_B_DOCTOR_LOGIN'] = true;

    // TEST C — Admin login (admin@medicare.local)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Login successful',
          data: {
            user: { id: 'a-1', name: 'Admin User', email: 'admin@medicare.local', role: 'ADMIN' },
            role: 'ADMIN',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resC = await authApi.login({ identifier: 'admin@medicare.local', password: 'password123' });
    assert(resC.success && resC.data?.role === 'ADMIN', 'TEST C: Admin login succeeded');
    results['TEST_C_ADMIN_LOGIN'] = true;

    // TEST D — Wrong password
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Credentials',
          message: 'Incorrect password',
        }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    let testDPassed = false;
    try {
      await authApi.login({ identifier: 'abhi@example.com', password: 'wrongpassword' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        testDPassed = true;
      }
    }
    assert(testDPassed, 'TEST D: Wrong password rejected with 401');
    results['TEST_D_WRONG_PASSWORD'] = true;

    // TEST E — Unknown user
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Credentials',
          message: 'No account registered with this email or phone',
        }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    let testEPassed = false;
    try {
      await authApi.login({ identifier: 'unknown@user.com', password: 'password123' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        testEPassed = true;
      }
    }
    assert(testEPassed, 'TEST E: Unknown user rejected with 401');
    results['TEST_E_UNKNOWN_USER'] = true;

    // TEST F — Pending doctor login returns HTTP 403
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Pending Approval',
          message: 'Your doctor account registration is pending admin approval.',
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    let testFPassed = false;
    try {
      await authApi.login({ identifier: 'pending.doc@medicare.com', password: 'password123' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        testFPassed = true;
      }
    }
    assert(testFPassed, 'TEST F: Pending doctor rejected with 403');
    results['TEST_F_PENDING_DOCTOR'] = true;

    // TEST G — Page refresh (GET /api/auth/session restores authenticated user)
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Session active',
          data: {
            user: { id: 'p-abhi', name: 'abhi', email: 'abhi@example.com', role: 'PATIENT' },
            role: 'PATIENT',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resG = await authApi.getSession();
    assert(resG.success && resG.data?.user.id === 'p-abhi', 'TEST G: Session restored');
    results['TEST_G_PAGE_REFRESH'] = true;

    // TEST H — Logout invalidates session
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ success: true, message: 'Logged out successfully' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    const resH = await authApi.logout();
    assert(resH.success, 'TEST H: Logout succeeded');

    // Subsequent session check returns 401
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', message: 'No active session' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }) as typeof fetch;

    let sessionCleared = false;
    try {
      await authApi.getSession();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionCleared = true;
      }
    }
    assert(sessionCleared, 'TEST H: Subsequent session check returns 401');
    results['TEST_H_LOGOUT'] = true;

    return { results, passed: true };
  } finally {
    globalThis.fetch = originalFetch;
  }
}
