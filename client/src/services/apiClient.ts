import { getApiBaseUrl } from '../config.ts';

type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  retry?: number;
  keepalive?: boolean;
};

type ApiError = Error & { status?: number };

const dispatchServerEvent = (name: 'server:online' | 'server:offline') => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name));
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    retry = 0,
    keepalive,
  } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';

  const attempt = async (remainingRetries: number): Promise<T> => {
    try {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}${path}`;

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        keepalive,
      });

      dispatchServerEvent('server:online');

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json() : null;

      if (!response.ok) {
        const message = payload?.message || `Request failed with status ${response.status}`;
        const error: ApiError = new Error(message);
        error.status = response.status;
        throw error;
      }

      return payload as T;
    } catch (err) {
      if (remainingRetries > 0) {
        await sleep(200);
        return attempt(remainingRetries - 1);
      }
      dispatchServerEvent('server:offline');
      throw err;
    }
  };

  return attempt(retry);
};

export type { ApiRequestOptions, ApiError };
export { apiRequest };
