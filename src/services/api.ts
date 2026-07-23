const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

// ---- Types ----
export interface SafeUser {
  id: string;
  username: string;
  avatar: string;
  createdAt: string;
}

export interface ServerSession {
  id: string;
  userId: string;
  treeId: string;
  treeName: string;
  category: string;
  durationMinutes: number;
  completed: boolean;
  isRare: boolean;
  note: string;
  createdAt: number;
}

export interface ServerSettings {
  userId: string;
  focusDuration: number;
  breakDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  theme: string;
  ambientSound: string;
  ambientVolume: number;
  soundNotifications: boolean;
}

// ---- HTTP helper ----
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data as T;
}

function getStoredToken(): string | null {
  return localStorage.getItem('focus_forest_token');
}

// ---- Auth ----
export async function register(username: string, password: string) {
  const data = await request<{ token: string; user: SafeUser }>('/api/auth/register', {
    method: 'POST', body: JSON.stringify({ username, password }),
  });
  persistAuth(data.token, data.user);
  return data;
}

export async function login(username: string, password: string) {
  const data = await request<{ token: string; user: SafeUser }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  });
  persistAuth(data.token, data.user);
  return data;
}

export async function getMe(): Promise<SafeUser | null> {
  try {
    const data = await request<{ user: SafeUser }>('/api/auth/me');
    return data.user;
  } catch { clearAuth(); return null; }
}

function persistAuth(token: string, user: SafeUser) {
  localStorage.setItem('focus_forest_token', token);
  localStorage.setItem('focus_forest_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('focus_forest_token');
  localStorage.removeItem('focus_forest_user');
}

export function logout() {
  clearAuth();
  localStorage.removeItem('focus_forest_logged_in');
}

export function getStoredUser(): SafeUser | null {
  try {
    const raw = localStorage.getItem('focus_forest_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ---- Sessions ----
export async function fetchSessions(): Promise<ServerSession[]> {
  const data = await request<{ sessions: ServerSession[] }>('/api/sessions');
  return data.sessions;
}

export async function createSession(session: {
  treeId: string;
  treeName: string;
  category: string;
  durationMinutes: number;
  completed: boolean;
  isRare?: boolean;
  note?: string;
}): Promise<ServerSession> {
  const data = await request<{ session: ServerSession }>('/api/sessions', {
    method: 'POST', body: JSON.stringify(session),
  });
  return data.session;
}

export async function deleteSessionRemote(id: string): Promise<void> {
  await request('/api/sessions/' + id, { method: 'DELETE' });
}

// ---- Settings ----
export async function fetchSettings(): Promise<ServerSettings> {
  const data = await request<{ settings: ServerSettings }>('/api/settings');
  return data.settings;
}

export async function saveSettingsRemote(settings: Partial<ServerSettings>): Promise<ServerSettings> {
  const data = await request<{ settings: ServerSettings }>('/api/settings', {
    method: 'PUT', body: JSON.stringify(settings),
  });
  return data.settings;
}
