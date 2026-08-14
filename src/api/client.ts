export const BASE_URL = 'https://api.codingboss.in/herbal';
export const FALLBACK_BASE_URL = 'https://viral-motto-customs.ngrok-free.dev/herbal';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const primaryUrl = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers as Record<string, string>),
  };

  const doFetch = async (targetUrl: string, customHeaders?: Record<string, string>) => {
    const response = await fetch(targetUrl, { 
      ...options,
      headers: customHeaders || headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(errorBody);
      } catch (_) {}
      const msg = parsedJson?.message || parsedJson?.detail || errorBody;
      const err = new Error(msg);
      (err as any).status = response.status;
      (err as any).body = parsedJson;
      (err as any).raw = errorBody;
      throw err;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  };

  try {
    return await doFetch(primaryUrl);
  } catch (primaryErr: any) {
    // If 401/403 (expired/invalid auth token), retry without Authorization header for public endpoints
    if ((primaryErr?.status === 401 || primaryErr?.status === 403) && headers.Authorization) {
      const publicHeaders = { ...headers };
      delete publicHeaders.Authorization;
      try {
        return await doFetch(primaryUrl, publicHeaders);
      } catch (_) {}
    }

    if (!endpoint.startsWith('http')) {
      const fallbackUrl = `${FALLBACK_BASE_URL}${endpoint}`;
      try {
        return await doFetch(fallbackUrl);
      } catch (fallbackErr: any) {
        if ((fallbackErr?.status === 401 || fallbackErr?.status === 403) && headers.Authorization) {
          const publicHeaders = { ...headers };
          delete publicHeaders.Authorization;
          try {
            return await doFetch(fallbackUrl, publicHeaders);
          } catch (_) {}
        }
      }
    }
    throw primaryErr;
  }
};
