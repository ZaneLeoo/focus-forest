export type NavTab = 'focus' | 'forest' | 'stats' | 'settings';
export type ViewMode = NavTab | 'timer' | 'forest' | 'stats' | 'settings';

export type TreeSpeciesId = 'oak' | 'pine' | 'sakura' | 'ginkgo';

export interface TreeSpecies {
  id: TreeSpeciesId;
  name: string;
  icon: string;
  color: string;
  bgColor?: string;
  bgClass?: string;
  description: string;
  rarity?: 'common' | 'rare' | 'legendary';
  isRare?: boolean;
  minLevelRequired?: number;
  minDuration?: number;
}

export type CategoryTag = '工作' | '学习' | '阅读' | '设计' | '运动' | '冥想' | '其他' | '专注' | '兴趣';

export interface CategoryOption {
  name: CategoryTag;
  color: string;
  bgColor?: string;
  icon: string;
}

export interface FocusSession {
  id: string;
  treeId: TreeSpeciesId;
  treeName: string;
  category: CategoryTag | string;
  durationMinutes: number;
  completed: boolean;
  createdAt: number; // timestamp
  note?: string;
  isRare?: boolean;
}

export interface PlantedTree {
  id: string;
  speciesId?: TreeSpeciesId;
  name: string;
  icon: string;
  color: string;
  durationMinutes: number;
  category: string;
  isRare?: boolean;
  status: 'completed' | 'abandoned';
  plantedAt?: string;
  timestamp: number;
  note?: string;
}

export interface UserProfile {
  name: string;
  title: string;
  avatarUrl: string;
  level: number;
  totalTreesPlanted: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface AppSettings {
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  shortBreakDuration?: number; // in minutes
  longBreakDuration?: number; // in minutes
  longBreakInterval?: number; // every N focus sessions
  autoStartBreak: boolean;
  autoStartFocus?: boolean;
  theme: 'light' | 'dark' | 'system';
  ambientSound: 'rain' | 'wind' | 'creek' | 'birds' | 'fire' | 'none' | 'rainforest' | 'breeze' | 'stream';
  ambientVolume: number; // 0 to 1
  animationIntensity: 0 | 1 | 2 | 'none' | 'reduced' | 'natural';
  soundNotifications: boolean;
}

export type UserSettings = AppSettings;

export interface TimerState {
  mode: 'focus' | 'shortBreak' | 'longBreak';
  status: 'idle' | 'running' | 'paused' | 'completed';
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  selectedCategory: CategoryTag | string;
  selectedTreeId: TreeSpeciesId;
  sessionNote: string;
  sessionsCompletedToday: number;
}
