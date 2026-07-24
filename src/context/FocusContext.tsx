import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NavTab, FocusSession, UserProfile, AppSettings, TreeSpeciesId } from '../types';
import { loadSessions, saveSessions, loadUserProfile, saveUserProfile, loadSettings, saveSettings } from '../utils/storage';
import { soundEngine } from '../utils/audio';
import {
  fetchSessions,
  createSession as createSessionRemote,
  deleteSessionRemote,
  fetchSettings,
  saveSettingsRemote,
  getMe,
  getStoredToken,
  getStoredUser,
  logout as apiLogout,
  SafeUser,
} from '../services/api';

interface FocusContextType {
  navTab: NavTab;
  setNavTab: (tab: NavTab) => void;
  user: UserProfile;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  sessions: FocusSession[];
  addSession: (session: Omit<FocusSession, 'id' | 'createdAt'>) => void;
  deleteSession: (id: string) => void;
  toggleAmbientSound: (type?: AppSettings['ambientSound']) => void;
  currentSoundType: string;
  isLoggedIn: boolean;
  userName: string;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  login: (name: string, avatar: string) => void;
  logout: () => void;
  selectedSpeciesId: TreeSpeciesId;
  setSelectedSpeciesId: (id: TreeSpeciesId) => void;
  syncing: boolean;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navTab, setNavTab] = useState<NavTab>('focus');
  const [user, setUser] = useState<UserProfile>(loadUserProfile);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [sessions, setSessions] = useState<FocusSession[]>(loadSessions);
  const [currentSoundType, setCurrentSoundType] = useState<string>('none');
  const hasStoredToken = !!getStoredToken();
  const [syncing, setSyncing] = useState(hasStoredToken);

  // Auth state - only true after verified by server
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>(() => {
    const stored = getStoredUser();
    return stored?.username || '森林园丁';
  });
  const [userAvatar, setUserAvatarState] = useState<string>(() => {
    const stored = getStoredUser();
    return stored?.avatar || '🪴';
  });
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<TreeSpeciesId>('oak');

  // On mount: if token exists, verify and sync from server
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    // Verify token is still valid and hydrate data
    setSyncing(true);
    getMe()
      .then(user => {
        if (user) {
          setIsLoggedIn(true);
          setUserName(user.username);
          setUserAvatarState(user.avatar);
          return syncFromServer();
        } else {
          // Token invalid
          apiLogout();
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        // Server unreachable - stay logged in with cached data
        console.warn('Server unreachable, using cached data');
        if (getStoredToken()) {
          setIsLoggedIn(true);
        }
      })
      .finally(() => setSyncing(false));
  }, []);

  // Sync data from server
  const syncFromServer = useCallback(async () => {
    try {
      const [serverSessions, serverSettings] = await Promise.all([
        fetchSessions(),
        fetchSettings(),
      ]);

      const mapped: FocusSession[] = serverSessions.map(s => ({
        id: s.id,
        treeId: s.treeId as TreeSpeciesId,
        treeName: s.treeName,
        category: s.category,
        durationMinutes: s.durationMinutes,
        completed: s.completed,
        createdAt: s.createdAt,
        note: s.note,
        isRare: s.isRare,
      }));
      setSessions(mapped);
      saveSessions(mapped);

      if (serverSettings) {
        const mappedSettings: AppSettings = {
          focusDuration: serverSettings.focusDuration || 25,
          breakDuration: serverSettings.breakDuration || 5,
          shortBreakDuration: serverSettings.shortBreakDuration || 5,
          longBreakDuration: serverSettings.longBreakDuration || 15,
          longBreakInterval: serverSettings.longBreakInterval || 4,
          autoStartBreak: serverSettings.autoStartBreak !== false,
          autoStartFocus: serverSettings.autoStartFocus || false,
          theme: (serverSettings.theme as AppSettings['theme']) || 'light',
          ambientSound: (serverSettings.ambientSound as AppSettings['ambientSound']) || 'rain',
          ambientVolume: serverSettings.ambientVolume || 0.5,
          animationIntensity: 2 as const,
          soundNotifications: serverSettings.soundNotifications !== false,
        };
        setSettings(mappedSettings);
        saveSettings(mappedSettings);
      }
    } catch (e) {
      console.warn('Failed to sync from server, using local data', e);
    }
  }, []);

  // Login - called after API auth succeeds
  const login = useCallback((name: string, avatar: string) => {
    setUserName(name);
    setUserAvatarState(avatar);
    setIsLoggedIn(true);
    setSyncing(true);
    syncFromServer().finally(() => setSyncing(false));
  }, [syncFromServer]);

  // Logout
  const logout = useCallback(() => {
    apiLogout();
    setIsLoggedIn(false);
    setSessions([]);
    saveSessions([]);
  }, []);

  const setUserAvatar = useCallback((avatar: string) => {
    setUserAvatarState(avatar);
  }, []);

  // Calculate today's completed sessions
  const sessionsCompletedToday = sessions.filter(s => {
    if (!s.completed) return false;
    const d = new Date(s.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  // Apply theme from settings
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    }
  }, [settings.theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.toggle('dark', e.matches);
      root.classList.toggle('light', !e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  // Handle ambient sound playback
  const toggleAmbientSound = useCallback((type?: AppSettings['ambientSound']) => {
    const target = type || settings.ambientSound;
    if (currentSoundType === target) {
      soundEngine.stopAmbient();
      setCurrentSoundType('none');
    } else {
      soundEngine.playAmbient(target, settings.ambientVolume);
      setCurrentSoundType(target);
    }
  }, [currentSoundType, settings.ambientSound, settings.ambientVolume]);

  // Add session — API first, then local
  const addSession = useCallback((sessionData: Omit<FocusSession, 'id' | 'createdAt'>) => {
    const newSession: FocusSession = {
      ...sessionData,
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };

    setSessions(prev => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });

    // Push to server (fire-and-forget)
    createSessionRemote({
      treeId: newSession.treeId,
      treeName: newSession.treeName,
      category: newSession.category,
      durationMinutes: newSession.durationMinutes,
      completed: newSession.completed,
      isRare: newSession.isRare,
      note: newSession.note,
    }).catch(e => console.warn('Failed to sync session to server', e));

    // Update user profile stats
    setUser(prevUser => {
      const newTotal = prevUser.totalTreesPlanted + (sessionData.completed ? 1 : 0);
      const newLevel = Math.floor(newTotal / 10) + 1;
      const updatedUser: UserProfile = {
        ...prevUser,
        totalTreesPlanted: newTotal,
        level: newLevel,
        lastActiveDate: new Date().toISOString().split('T')[0],
      };
      saveUserProfile(updatedUser);
      return updatedUser;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSessions(updated);
      return updated;
    });
    deleteSessionRemote(id).catch(e => console.warn('Failed to delete session on server', e));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      saveSettingsRemote({
        focusDuration: updated.focusDuration,
        breakDuration: updated.breakDuration,
        shortBreakDuration: updated.shortBreakDuration,
        longBreakDuration: updated.longBreakDuration,
        longBreakInterval: updated.longBreakInterval,
        autoStartBreak: updated.autoStartBreak,
        autoStartFocus: updated.autoStartFocus,
        theme: updated.theme,
        ambientSound: updated.ambientSound,
        ambientVolume: updated.ambientVolume,
        soundNotifications: updated.soundNotifications,
      }).catch(e => console.warn('Failed to sync settings to server', e));
      return updated;
    });
  }, []);

  return (
    <FocusContext.Provider
      value={{
        navTab,
        setNavTab,
        user,
        settings,
        updateSettings,
        sessions,
        addSession,
        deleteSession,
        toggleAmbientSound,
        currentSoundType,
        isLoggedIn,
        userName,
        userAvatar,
        setUserAvatar,
        login,
        logout,
        selectedSpeciesId,
        setSelectedSpeciesId,
        syncing,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};
