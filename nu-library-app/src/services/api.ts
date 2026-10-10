import { Capacitor } from '@capacitor/core';

/**
 * NU LIRC API Client
 * Dynamic, API-driven client with silent token refresh,
 * offline caching, and realtime SSE with polling fallback.
 */

const STORAGE_KEY_SERVER_URL = 'nu_lirc_server_url';
const STORAGE_KEY_ACCESS_TOKEN = 'nu_lirc_access_token';
const STORAGE_KEY_REFRESH_TOKEN = 'nu_lirc_refresh_token';
const STORAGE_KEY_USER = 'nu_lirc_student_user';
const STORAGE_KEY_DEVICE_ID = 'nu_lirc_device_id';
const CACHE_PREFIX = 'nu_lirc_cache_';

export function getDefaultServerUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (Capacitor.isNativePlatform()) return 'http://10.0.2.2:3000';
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    // In a browser, the portal and API are served by the same Express host.
    // This also works from LAN and tunnel URLs without a device-specific setting.
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'http://10.0.2.2:3000';
}

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `device_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, id);
  }
  return id;
}

export function getFileUrl(relativePath: string): string {
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${getServerUrl()}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}

export async function fetchAssetObjectUrl(relativePath: string): Promise<string> {
  const response = await fetch(getFileUrl(relativePath), {
    headers: { 'ngrok-skip-browser-warning': 'true', 'x-device-id': getDeviceId() },
  });
  if (!response.ok) throw new Error(`Attachment request failed (${response.status}).`);
  return URL.createObjectURL(await response.blob());
}

export function getServerUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  const saved = localStorage.getItem(STORAGE_KEY_SERVER_URL);
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }
  return getDefaultServerUrl();
}

export function getBaseUrl(): string {
  return getServerUrl();
}

export function resetBaseUrl(): void {
  localStorage.removeItem(STORAGE_KEY_SERVER_URL);
}

export function setServerUrl(url: string): void {
  const normalized = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY_SERVER_URL, normalized);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  }
}

export function clearStoredTokens(): void {
  localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
}

function getCacheKey(path: string): string {
  return `${CACHE_PREFIX}${path}`;
}

export function getCached<T>(path: string): { data: T; cachedAt: string } | null {
  try {
    const raw = localStorage.getItem(getCacheKey(path));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCached<T>(path: string, data: T): void {
  try {
    const entry = { data, cachedAt: new Date().toISOString() };
    localStorage.setItem(getCacheKey(path), JSON.stringify(entry));
  } catch {
    // LocalStorage quota may be exceeded; ignore
  }
}

export async function checkServerHealth(testUrl?: string): Promise<{ ok: boolean; version?: string; error?: string }> {
  const base = testUrl ? testUrl.trim().replace(/\/+$/, '') : getServerUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${base}/api/v1/health`, {
      signal: controller.signal,
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { ok: true, version: json.data?.version || '1.0.0' };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Server unreachable' };
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: any };
  isOffline?: boolean;
  cachedAt?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const base = getServerUrl();
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('x-device-id', getDeviceId());

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${base}/api/v1${path}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Silent Token Refresh on 401
    if (response.status === 401 && getStoredRefreshToken()) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry original request once with fresh token
        headers.set('Authorization', `Bearer ${getStoredToken()}`);
        const retryRes = await fetch(url, { ...options, headers });
        if (retryRes.ok) {
          const json = await retryRes.json();
          if (options.method === undefined || options.method === 'GET') {
            setCached(path, json.data);
          }
          return { success: true, data: json.data };
        }
      }
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const errMsg = errJson?.error?.message || `Request failed with status ${response.status}`;
      const errCode = errJson?.error?.code || 'HTTP_ERROR';
      return {
        success: false,
        data: null as any,
        error: { code: errCode, message: errMsg, details: errJson?.error?.details },
      };
    }

    const json = await response.json();
    if (options.method === undefined || options.method === 'GET') {
      setCached(path, json.data);
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    // Network failure / offline fallback
    if (options.method === undefined || options.method === 'GET') {
      const cached = getCached<T>(path);
      if (cached) {
        return {
          success: true,
          data: cached.data,
          isOffline: true,
          cachedAt: cached.cachedAt,
        };
      }
    }
    return {
      success: false,
      data: null as any,
      isOffline: true,
      error: { code: 'NETWORK_OFFLINE', message: 'Unable to reach library server. Check your connection or server settings.' },
    };
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;
  try {
    const base = getServerUrl();
    const res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearStoredTokens();
      return false;
    }
    const json = await res.json();
    if (json.data?.accessToken) {
      setStoredTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function generateIdempotencyKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = 'key_';
  for (let i = 0; i < 28; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==========================================
// API Methods
// ==========================================

export const Api = {
  // Helper functions for server URL management
  getBaseUrl() {
    return getServerUrl();
  },

  setBaseUrl(url: string): void {
    setServerUrl(url);
  },

  resetBaseUrl(): void {
    resetBaseUrl();
  },

  async getHealth(): Promise<{ ok: boolean; version?: string; error?: string }> {
    return checkServerHealth();
  },

  logout() {
    clearStoredTokens();
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Books / Catalog Search
  async searchBooks(params: { query?: string; category?: string; page?: number; pageSize?: number }) {
    const q = new URLSearchParams();
    if (params.query) q.set('query', params.query);
    if (params.category && params.category !== 'All') q.set('category', params.category);
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    return request<{ items: any[]; pagination: any }>(`/books?${q.toString()}`);
  },

  async getNewArrivals(params: { page?: number; pageSize?: number } = {}) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    return request<{ items: any[]; pagination: any }>(`/books/new-arrivals?${q.toString()}`);
  },

  async getBook(id: string) {
    return request<any>(`/books/${encodeURIComponent(id)}`);
  },

  async getBookCategories() {
    return request<{ items: { id: string; name: string }[] }>('/books/categories');
  },

  // Discussion Rooms
  async getRooms() {
    return request<{ items: any[] }>('/rooms');
  },

  async getRoomAvailability(roomId: string, date: string) {
    const q = new URLSearchParams({ roomId, date });
    return request<{ room: any; date: string; bookings: any[] }>(`/rooms/availability?${q.toString()}`);
  },

  async submitRoomRequest(payload: {
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    groupSize: number;
    studentName: string;
    studentEmail: string;
    enrollmentNo: string;
    studentPhone: string;
  }) {
    const key = generateIdempotencyKey();
    return request<any>('/room-requests', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(payload),
    });
  },

  async getMyRoomRequests() {
    return request<{ items: any[]; pagination: any }>('/room-requests/mine');
  },

  async cancelRoomRequest(requestId: string) {
    return request<any>(`/room-requests/${encodeURIComponent(requestId)}/cancel`, {
      method: 'PATCH',
    });
  },

  // Book Requests / Requisitions
  async submitBookRequest(payload: {
    title: string;
    author?: string;
    publisher?: string;
    edition?: string;
    isbn?: string;
    reason: string;
    catalogBookId?: string;
    studentName: string;
    studentEmail: string;
    enrollmentNo: string;
    studentPhone: string;
  }) {
    const key = generateIdempotencyKey();
    const result = await request<any>('/book-requests', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(payload),
    });
    if (!result.success) {
      const details = result.error?.details?.map((item: any) => `${item.field}: ${item.message}`).join('; ');
      throw new Error(details ? `${result.error?.message || 'Book request failed.'} ${details}` : result.error?.message || 'Book request failed.');
    }
    return result;
  },

  async getMyBookRequests() {
    return request<{ items: any[]; pagination: any }>('/book-requests/mine');
  },

  // News Clippings
  async getClippings(params: { date?: string; topic?: string; page?: number; pageSize?: number } = {}) {
    const q = new URLSearchParams();
    if (params.date) q.set('date', params.date);
    if (params.topic && params.topic !== 'All') q.set('topic', params.topic);
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    return request<{ items: any[]; pagination: any }>(`/clippings?${q.toString()}`);
  },

  // General Info & Timings
  async getGeneralInfo() {
    return request<any>('/general-info');
  },

  async getHolidays() {
    return request<{ items: any[] }>('/holidays');
  },

  // E-Resources
  async getEResources() {
    return request<{ items: any[] }>('/e-resources');
  },

  async getEResourceCategories() {
    return request<{ items: any[] }>('/e-resources/categories');
  },

  // Announcements
  async getAnnouncements() {
    return request<{ items: any[] }>('/announcements');
  },

  // Feedback
  async submitFeedback(payload: {
    subject: string;
    message: string;
    category?: 'bug' | 'feature' | 'general' | 'other';
    rating?: number;
  }) {
    return request<{ id: string; status: string }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyFeedback() {
    return request<{ items: any[] }>('/feedback/mine');
  },

  // Delta Sync
  async sync(sinceTimestamp: string) {
    const q = new URLSearchParams({ since: sinceTimestamp });
    return request<any>(`/sync?${q.toString()}`);
  },
};

// ==========================================
// Real-time EventSource & Polling Manager
// ==========================================

type RealtimeListener = (event: { module: string; action: string; recordId?: string; summary?: string }) => void;

class RealtimeManager {
  private streamController: AbortController | null = null;
  private reconnectTimer: any = null;
  private listeners: Set<RealtimeListener> = new Set();
  private pollInterval: any = null;
  private lastSyncTime: string = new Date().toISOString();
  private isConnected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.triggerPollSync();
        }
      });
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  public start() {
    this.stop();
    this.streamController = new AbortController();
    void this.readEventStream(this.streamController);

    // Polling fallback every 20 seconds
    this.pollInterval = setInterval(() => {
      this.triggerPollSync();
    }, 20000);
  }

  private async readEventStream(controller: AbortController) {
    try {
      const response = await fetch(`${getServerUrl()}/api/v1/updates/stream`, {
        headers: { 'ngrok-skip-browser-warning': 'true', 'x-device-id': getDeviceId() },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error('Realtime stream unavailable.');
      this.isConnected = true;
      window.dispatchEvent(new CustomEvent('lirc:online'));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() || '';
        for (const frame of frames) {
          const eventType = frame.match(/^event:\s*(.+)$/m)?.[1];
          const data = frame.match(/^data:\s*(.+)$/m)?.[1];
          if (eventType !== 'change' || !data) continue;
          try {
            const payload = JSON.parse(data);
            this.lastSyncTime = payload.timestamp || new Date().toISOString();
            this.notifyListeners(payload);
          } catch {}
        }
      }
      if (!controller.signal.aborted) throw new Error('Realtime stream closed.');
    } catch {
      if (controller.signal.aborted) return;
      this.isConnected = false;
      window.dispatchEvent(new CustomEvent('lirc:offline'));
      this.reconnectTimer = setTimeout(() => this.start(), 5000);
    }
  }

  public async triggerPollSync() {
    try {
      const res = await Api.sync(this.lastSyncTime);
      if (res.success && res.data?.changes && res.data.changes.length > 0) {
        this.lastSyncTime = res.data.serverTime || new Date().toISOString();
        for (const change of res.data.changes) {
          this.notifyListeners(change);
        }
      }
    } catch {}
  }

  private notifyListeners(event: any) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {}
    }
    // Also dispatch specific module events for backwards compatibility
    if (typeof window !== 'undefined' && event.module) {
      const moduleEvent = new CustomEvent(`lirc:realtime:${event.module}`, { detail: event });
      window.dispatchEvent(moduleEvent);
    }
  }

  public stop() {
    this.streamController?.abort();
    this.streamController = null;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isConnected = false;
  }

  public isOnline(): boolean {
    return this.isConnected;
  }
}

export const realtimeManager = new RealtimeManager();
export { RealtimeManager };
