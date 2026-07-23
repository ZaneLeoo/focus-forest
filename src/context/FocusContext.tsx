import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { NavTab, FocusSession, UserProfile, AppSettings, TimerState, CategoryTag, TreeSpeciesId } from '../types';
import { loadSessions, saveSessions, loadUserProfile, saveUserProfile, loadSettings, saveSettings } from '../utils/storage';
import { soundEngine } from '../utils/audio';
import { TREE_SPECIES } from '../constants/trees';
import { fetchSessions, createSession as createSessionRemote, deleteSessionRemote, fetchSettings, saveSettingsRemote } from '../services/api';

interface FocusContextType {
  navTab: NavTab;
  setNavTab: (tab: NavTab) => void;
  user: UserProfile;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  sessions: FocusSession[];
  addSession: (session: Omit<FocusSession, 'id' | 'createdAt'>) => void;
  deleteSession: (id: string) => void;
  timer: TimerState;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  giveUpTimer: () => void;
  completeTimer: () => void;
  setCustomTime: (minutes: number) => void;
  setSelectedCategory: (cat: CategoryTag) => void;
  setSelectedTree: (treeId: TreeSpeciesId) => void;
  toggleAmbientSound: (type?: AppSettings['ambientSound']) => void;
  currentSoundType: string;
  // App-level state
  isLoggedIn: boolean;
  userName: string;
  userAvatar: string;
  setUserAvatar: (avatar: string) => void;
  login: (name: string, avatar: string) => void;
  logout: () => void;
  selectedSpeciesId: TreeSpeciesId;
  setSelectedSpeciesId: (id: TreeSpeciesId) => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navTab, setNavTab] = useState<NavTab>('focus');
  const [user, setUser] = useState<UserProfile>(loadUserProfile);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [sessions, setSessions] = useState<FocusSession[]>(loadSessions);
  const [currentSoundType, setCurrentSoundType] = useState<string>('none');

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('focus_forest_logged_in') === 'true';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('focus_forest_user_name') || '森林园丁';
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('focus_forest_user_avatar') || '🪴';
  });
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<TreeSpeciesId>('oak');

  // Login / Logout
  const login = useCallback((name: string, avatar: string) => {
    setUserName(name);
    setUserAvatar(avatar);
    setIsLoggedIn(true);
    localStorage.setItem('focus_forest_logged_in', 'true');
    localStorage.setItem('focus_forest_user_name', name);
    localStorage.setItem('focus_forest_user_avatar', avatar);
    // Fetch data from server after login
    syncFromServer();
  }, []);

  const syncFromServer = useCallback(async () => {
    try {
      const [serverSessions, serverSettings] = await Promise.all([
        fetchSessions(),
        fetchSettings(),
      ]);
      // Map server sessions to local format
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
      // Sync settings
      if (serverSettings) {
        const mappedSettings: AppSettings = {
          focusDuration: serverSettings.focusDuration || 25,
          breakDuration: serverSettings.breakDuration || 5,
          shortBreakDuration: serverSettings.shortBreakDuration || 5,
          longBreakDuration: serverSettings.longBreakDuration || 15,
          longBreakInterval: serverSettings.longBreakInterval || 4,
          autoStartBreak: serverSettings.autoStartBreak !== false,
          autoStartFocus: serverSettings.autoStartFocus || false,
          theme: serverSettings.theme as AppSettings['theme'] || 'light',
          ambientSound: serverSettings.ambientSound as AppSettings['ambientSound'] || 'rain',
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

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('focus_forest_logged_in');
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    saveSessions([]);
  }, []);

  const [timer, setTimer] = useState<TimerState>({
    mode: 'focus',
    status: 'idle',
    timeRemaining: settings.focusDuration * 60,
    totalTime: settings.focusDuration * 60,
    selectedCategory: '工作',
    selectedTreeId: 'oak',
    sessionNote: '',
    sessionsCompletedToday: 0,
  });

  // Calculate today's completed sessions
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const count = sessions.filter(s => s.completed && new Date(s.createdAt).toDateString() === todayStr).length;
    setTimer(prev => ({ ...prev, sessionsCompletedToday: count }));
  }, [sessions]);

  // Always use light theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  // Sync Timer settings if idle
  useEffect(() => {
    if (timer.status === 'idle' && timer.mode === 'focus') {
      setTimer(prev => ({
        ...prev,
        timeRemaining: settings.focusDuration * 60,
        totalTime: settings.focusDuration * 60,
      }));
    }
  }, [settings.focusDuration, timer.status, timer.mode]);

  // Handle ambient sound playback synchronization
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

  // Add Session helper — pushes to server + local
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

    // Update User Profile Stats
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
      // Sync to server
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

  // Timer Handlers
  const completeTimer = useCallback(() => {
    // Play celebratory sound & confetti if focus mode
    if (settings.soundNotifications) {
      soundEngine.playCompletionChime();
    }

    if (timer.mode === 'focus') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#125238', '#b1f0cd', '#346942', '#ffdea5'],
      });

      const tree = TREE_SPECIES.find(t => t.id === timer.selectedTreeId) || TREE_SPECIES[0];

      addSession({
        treeId: timer.selectedTreeId,
        treeName: tree.name,
        category: timer.selectedCategory,
        durationMinutes: Math.round(timer.totalTime / 60),
        completed: true,
        note: timer.sessionNote || `完成${timer.selectedCategory}专注`,
        isRare: tree.rarity === 'rare' || tree.rarity === 'legendary',
      });

      // Switch to break mode if auto start break enabled
      const nextMode = (timer.sessionsCompletedToday + 1) % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
      const breakMins = nextMode === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration;

      setTimer(prev => ({
        ...prev,
        mode: nextMode,
        status: settings.autoStartBreak ? 'running' : 'idle',
        timeRemaining: breakMins * 60,
        totalTime: breakMins * 60,
      }));
    } else {
      // Break completed -> back to focus mode
      setTimer(prev => ({
        ...prev,
        mode: 'focus',
        status: settings.autoStartFocus ? 'running' : 'idle',
        timeRemaining: settings.focusDuration * 60,
        totalTime: settings.focusDuration * 60,
      }));
    }
  }, [addSession, settings, timer]);

  const startTimer = useCallback(() => {
    soundEngine.playClickSound();
    setTimer(prev => ({ ...prev, status: 'running' }));
  }, []);

  const pauseTimer = useCallback(() => {
    soundEngine.playClickSound();
    setTimer(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resumeTimer = useCallback(() => {
    soundEngine.playClickSound();
    setTimer(prev => ({ ...prev, status: 'running' }));
  }, []);

  const giveUpTimer = useCallback(() => {
    soundEngine.playClickSound();
    // Record incomplete session if elapsed > 1 min
    const elapsedMinutes = Math.floor((timer.totalTime - timer.timeRemaining) / 60);
    if (timer.mode === 'focus' && elapsedMinutes >= 1) {
      const tree = TREE_SPECIES.find(t => t.id === timer.selectedTreeId) || TREE_SPECIES[0];
      addSession({
        treeId: timer.selectedTreeId,
        treeName: `${tree.name} (未完成)`,
        category: timer.selectedCategory,
        durationMinutes: elapsedMinutes,
        completed: false,
        note: '中途放弃',
      });
    }

    setTimer(prev => ({
      ...prev,
      status: 'idle',
      mode: 'focus',
      timeRemaining: settings.focusDuration * 60,
      totalTime: settings.focusDuration * 60,
    }));
  }, [addSession, settings.focusDuration, timer]);

  const setCustomTime = useCallback((minutes: number) => {
    soundEngine.playClickSound();
    setTimer(prev => ({
      ...prev,
      status: 'idle',
      timeRemaining: minutes * 60,
      totalTime: minutes * 60,
    }));
  }, []);

  const setSelectedCategory = useCallback((cat: CategoryTag) => {
    soundEngine.playClickSound();
    setTimer(prev => ({ ...prev, selectedCategory: cat }));
  }, []);

  const setSelectedTree = useCallback((treeId: TreeSpeciesId) => {
    soundEngine.playClickSound();
    setTimer(prev => ({ ...prev, selectedTreeId: treeId }));
  }, []);

  // Main Timer Countdown Loop
  useEffect(() => {
    let interval: number | null = null;
    if (timer.status === 'running') {
      interval = window.setInterval(() => {
        setTimer(prev => {
          if (prev.timeRemaining <= 1) {
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.status]);

  // Check if timer finished
  useEffect(() => {
    if (timer.status === 'running' && timer.timeRemaining === 0) {
      completeTimer();
    }
  }, [timer.status, timer.timeRemaining, completeTimer]);

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
        timer,
        startTimer,
        pauseTimer,
        resumeTimer,
        giveUpTimer,
        completeTimer,
        setCustomTime,
        setSelectedCategory,
        setSelectedTree,
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
