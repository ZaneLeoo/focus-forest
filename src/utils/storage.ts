import { FocusSession, UserProfile, AppSettings } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'focus_forest_sessions_v1',
  USER_PROFILE: 'focus_forest_user_v1',
  SETTINGS: 'focus_forest_settings_v1',
};

export const DEFAULT_USER: UserProfile = {
  name: '园丁',
  title: '高级林业师',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl4vssSUZmSd8YRtpqsDlxTyOxVhkBmJ92vSTbuWQ_XcdpJqi5GPdAsTn_AKirGXvl26U7VUw2cqaFJi1NhQLVmQbP0UDF9aVPbq4-YO2l_0pHsjvSTKbb74uBaZ3XeyUSSRS43cPAqwL5EbfDeApdTOoB4ZLC8IBSVIU2PaKlZZGfxAP0tv0GYmqFewY-h04iERDL7L4JI8y-zPe-iXrxIHSMyeYsno91mAn8BGxroE5vGd-URM2N',
  level: 4,
  totalTreesPlanted: 38,
  streakDays: 8,
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export const DEFAULT_SETTINGS: AppSettings = {
  focusDuration: 25,
  breakDuration: 5,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreak: true,
  autoStartFocus: false,
  theme: 'light',
  ambientSound: 'rain',
  ambientVolume: 0.5,
  animationIntensity: 2,
  soundNotifications: true,
};

// Generate initial sessions (returns empty array for clean start)
function generateInitialSessions(): FocusSession[] {
  return [];
}

export function loadSessions(): FocusSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) {
      const initial = generateInitialSessions();
      saveSessions(initial);
      return initial;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load sessions', e);
    return [];
  }
}

// Safe localStorage wrapper with quota handling
const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      console.warn('localStorage quota exceeded, attempting cleanup...');
      const sessions = loadSessions();
      if (sessions.length > 10) {
        try {
          localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions.slice(0, Math.floor(sessions.length / 2))));
        } catch {}
      }
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.error('Storage still full after cleanup');
        return false;
      }
    }
    console.error('Failed to save to localStorage:', e);
    return false;
  }
};

export function saveSessions(sessions: FocusSession[]): void {
  try {
    safeSetItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!data) {
      saveUserProfile(DEFAULT_USER);
      return DEFAULT_USER;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_USER;
  }
}

export function saveUserProfile(user: UserProfile): void {
  try {
    safeSetItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export const getStoredSettings = loadSettings;

export function saveSettings(settings: AppSettings): void {
  try {
    safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function exportDataAsJSON(): void {
  const data = {
    userProfile: loadUserProfile(),
    settings: loadSettings(),
    sessions: loadSessions(),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focus-forest-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSessionsAsCSV(): void {
  const sessions = loadSessions();
  const headers = ['Session ID', 'Tree Name', 'Category', 'Duration (min)', 'Completed', 'Date'];
  const rows = sessions.map(s => [
    s.id,
    s.treeName,
    s.category,
    s.durationMinutes.toString(),
    s.completed ? 'Yes' : 'No',
    new Date(s.createdAt).toLocaleString('zh-CN'),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.map(field => `"${field}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focus-forest-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
