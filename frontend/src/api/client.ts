import axios from 'axios';

// Default production backend API URL
const DEFAULT_PRODUCTION_API = 'https://agent-website-r7za.onrender.com/api';

const getAgentBackendUrl = () => {
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL)
      : null;

  let url = envUrl;
  if (!url) {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        url = '/api';
      } else {
        url = DEFAULT_PRODUCTION_API;
      }
    } else {
      url = DEFAULT_PRODUCTION_API;
    }
  }

  // Guard against insecure HTTP when page is loaded over HTTPS (Mixed Content prevention)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    url = url.replace(/^http:\/\//, 'https://');
  }
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

/**
 * Pre-configured Axios instance for all API calls.
 * - Base URL dynamically selected based on environment
 * - Automatically attaches JWT auth token from localStorage
 * - Intercepts responses to handle error responses
 */
const api = axios.create({
  baseURL: getAgentBackendUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: attach auth token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agent_token') || localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle errors ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// In-flight GET request deduplication & user-scoped short-TTL response cache
const inFlightRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, { response: any; timestamp: number }>();

const getAuthScope = (): string => {
  try {
    const t = localStorage.getItem('agent_token') || localStorage.getItem('auth_token') || '';
    return t ? t.slice(-12) : 'anon';
  } catch {
    return 'anon';
  }
};

const getTtlForUrl = (url = ''): number => {
  const u = String(url).toLowerCase();
  if (u.includes('/hierarchy') || u.includes('/categories') || u.includes('/territory') || u.includes('/pincodes')) {
    return 120000;
  }
  if (u.includes('/notifications')) {
    return 15000;
  }
  return 20000;
};

export const clearAgentApiCache = () => {
  responseCache.clear();
  inFlightRequests.clear();
};

const originalRequest = api.request.bind(api);
api.request = function (configOrUrl: any, maybeConfig?: any) {
  const config = typeof configOrUrl === 'string'
    ? { ...(maybeConfig || {}), url: configOrUrl }
    : { ...(configOrUrl || {}) };
  const method = (config.method || 'get').toLowerCase();

  if (method === 'get') {
    const scope = getAuthScope();
    const key = `${scope}:${config.baseURL || ''}:${config.url || ''}:${config.params ? JSON.stringify(config.params) : ''}`;
    const skipCache = Boolean((config as any).skipCache || (config as any).force);
    const ttlMs = typeof (config as any).cacheTtl === 'number' ? (config as any).cacheTtl : getTtlForUrl(config.url);

    if (!skipCache && ttlMs > 0) {
      const cached = responseCache.get(key);
      if (cached && Date.now() - cached.timestamp < ttlMs) {
        return Promise.resolve(cached.response);
      }
    }

    const existing = inFlightRequests.get(key);
    if (existing) {
      return existing;
    }

    const requestPromise = originalRequest(config)
      .then((res) => {
        if (res && res.status === 200 && ttlMs > 0) {
          responseCache.set(key, { response: res, timestamp: Date.now() });
        }
        return res;
      })
      .finally(() => {
        inFlightRequests.delete(key);
      });
    inFlightRequests.set(key, requestPromise);
    return requestPromise;
  }

  // Write mutation: invalidate cached GET responses so subsequent reads reflect fresh DB state
  return originalRequest(config).then((res) => {
    responseCache.clear();
    return res;
  });
};

// Ensure api.get delegates through the deduplicated/cached api.request wrapper across Axios v1.x
api.get = function (url: string, config?: any) {
  return api.request({ ...(config || {}), method: 'get', url });
} as any;

export default api;
