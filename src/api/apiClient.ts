import { ApiResponse, ApiError } from './apiTypes';

/**
 * API Base URL Configuration.
 * Defaults to '/api' for same-origin proxy or configured environment variable.
 */
export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

/**
 * Builds full URL with encoded query parameters safely.
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  if (!params) return url;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Core HTTP Request Execution Engine.
 * Automatically enforces credentials: "include" for Jakarta Servlet HttpSession cookie persistence.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, body, headers = {}, ...customConfig } = options;
  const url = buildUrl(endpoint, params);

  const isJsonBody = body !== undefined && body !== null && typeof body === 'object';
  
  const config: RequestInit = {
    method: 'GET',
    credentials: 'include', // Essential for Java JSESSIONID session cookie lifecycle
    headers: {
      Accept: 'application/json',
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (body !== undefined && body !== null) {
    config.body = isJsonBody ? JSON.stringify(body) : (body as BodyInit);
  }

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: undefined as unknown as T };
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData: unknown = null;

    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }
    } else {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorObj = responseData as { error?: string; message?: string } | null;
      let errorMessage = errorObj?.message || errorObj?.error;
      if (!errorMessage) {
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          errorMessage = `Backend service unavailable (HTTP ${response.status}). Please start the Java Servlet server on MySQL to perform live authentication.`;
        } else {
          errorMessage = `HTTP ${response.status}${response.statusText ? ': ' + response.statusText : ''}`;
        }
      }
      throw new ApiError(response.status, errorMessage, errorObj?.error, undefined, responseData);
    }

    // Envelope normalizer: If response is already in ApiResponse format, return it directly
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      return responseData as ApiResponse<T>;
    }

    return {
      success: true,
      data: responseData as T,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const genericMessage = error instanceof Error ? error.message : 'A network communication error occurred';
    throw new ApiError(0, genericMessage);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
