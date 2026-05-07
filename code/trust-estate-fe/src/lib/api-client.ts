import type { ApiError, AuthTokens } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
const TOKEN_KEY = 'te_access_token';
const REFRESH_KEY = 'te_refresh_token';

export const tokenStorage = {
  getAccess: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  getRefresh: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null,
  set: (tokens: AuthTokens): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = 'ApiRequestError';
  }
}

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshTokens(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    tokenStorage.clear();
    return null;
  }
  const data: AuthTokens = await res.json();
  tokenStorage.set(data);
  return data.accessToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = tokenStorage.getAccess();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401 && retry) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(async (newToken) => {
          resolve(
            request<T>(
              endpoint,
              { ...options, headers: { ...headers, Authorization: `Bearer ${newToken}` } },
              false,
            ),
          );
        });
      });
    }
    isRefreshing = true;
    const newToken = await refreshTokens();
    isRefreshing = false;
    if (newToken) {
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      return request<T>(endpoint, options, false);
    }
    tokenStorage.clear();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiRequestError(401, { message: 'Session expired', statusCode: 401 });
  }

  if (!res.ok) {
    let apiError: ApiError;
    try {
      const body = await res.json();
      // Handle ASP.NET Core ValidationProblemDetails shape (has title not message)
      apiError = {
        message: body.message ?? body.title ?? 'An unexpected error occurred',
        statusCode: body.statusCode ?? body.status ?? res.status,
        errors: body.errors,
      };
    } catch {
      apiError = { message: 'Unable to reach the server. Is the backend running?', statusCode: res.status };
    }
    throw new ApiRequestError(res.status, apiError);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};