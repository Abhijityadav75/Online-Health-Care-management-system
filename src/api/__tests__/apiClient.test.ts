import { apiClient, API_BASE_URL } from '../apiClient';
import { ApiError } from '../apiTypes';

/**
 * Self-contained Client Integration Tests (Zero external test-runner dependency required).
 * Verifies request serialization, header propagation, and error envelope processing.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runApiClientTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;
  const originalFetch = globalThis.fetch;

  // Test 1: GET Request Construction
  try {
    let capturedUrl = '';
    let capturedConfig: RequestInit | undefined;

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedConfig = init;
      return new Response(JSON.stringify({ success: true, data: { result: 'ok' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const res = await apiClient.get<{ result: string }>('/test-endpoint', {
      params: { filter: 'active', page: 1 },
    });

    assert(capturedUrl === `${API_BASE_URL}/test-endpoint?filter=active&page=1`, 'URL and query string correctly formatted');
    assert(capturedConfig?.method === 'GET', 'Method is GET');
    assert(capturedConfig?.credentials === 'include', 'credentials: include enforced');
    assert(res.data?.result === 'ok', 'Data parsed properly');
    passed++;
  } catch {
    failed++;
  }

  // Test 2: POST Request with JSON Body
  try {
    let capturedConfig: RequestInit | undefined;

    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedConfig = init;
      return new Response(JSON.stringify({ success: true, data: { id: 'item-1' } }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const payload = { name: 'John Doe', role: 'PATIENT' };
    const res = await apiClient.post<{ id: string }>('/users', payload);

    const headers = capturedConfig?.headers as Record<string, string>;
    assert(capturedConfig?.method === 'POST', 'Method is POST');
    assert(headers?.['Content-Type'] === 'application/json', 'Content-Type header set');
    assert(capturedConfig?.body === JSON.stringify(payload), 'Body is JSON stringified');
    assert(capturedConfig?.credentials === 'include', 'credentials: include enforced');
    assert(res.data?.id === 'item-1', 'Response data matches');
    passed++;
  } catch {
    failed++;
  }

  // Test 3: Non-2xx Response Handling throws ApiError
  try {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden',
          message: 'Administrative privileges required',
        }),
        {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'content-type': 'application/json' },
        }
      );
    }) as typeof fetch;

    let threwExpected = false;
    try {
      await apiClient.get('/admin/data');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.message === 'Administrative privileges required') {
        threwExpected = true;
      }
    }
    assert(threwExpected, 'ApiError thrown with correct status and message');
    passed++;
  } catch {
    failed++;
  }

  // Test 4: 204 No Content Handling
  try {
    globalThis.fetch = (async () => {
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    const res = await apiClient.delete('/items/123');
    assert(res.success === true, 'Success on 204');
    assert(res.data === undefined, 'Data is undefined for 204');
    passed++;
  } catch {
    failed++;
  } finally {
    globalThis.fetch = originalFetch;
  }

  return { passed, failed };
}
