import { FocusSession, UserProfile, AppSettings } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'focus_forest_sessions_v1',
  USER_PROFILE: 'focus_forest_user_v1',
  SETTINGS: 'focus_forest_settings_v1',
};

export const DEFAULT_USER: UserProfile = {
  name: '园丁',
  title: '高级林业师',
  avatarUrl: '',
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
  theme: 'light',
  ambientSound: 'rainforest',
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
