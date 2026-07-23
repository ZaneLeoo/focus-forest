import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'forest.db');

let db: SqlJsDatabase;

export async function initDb(): Promise<void> {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      avatar TEXT DEFAULT '🌳',
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      tree_id TEXT NOT NULL,
      tree_name TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 1,
      is_rare INTEGER NOT NULL DEFAULT 0,
      note TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      focus_duration INTEGER DEFAULT 25,
      break_duration INTEGER DEFAULT 5,
      short_break_duration INTEGER DEFAULT 5,
      long_break_duration INTEGER DEFAULT 15,
      long_break_interval INTEGER DEFAULT 4,
      auto_start_break INTEGER DEFAULT 1,
      auto_start_focus INTEGER DEFAULT 0,
      theme TEXT DEFAULT 'light',
      ambient_sound TEXT DEFAULT 'rain',
      ambient_volume REAL DEFAULT 0.5,
      sound_notifications INTEGER DEFAULT 1
    )
  `);

  saveToDisk();
}

function saveToDisk() {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

// ---- Types ----
export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  createdAt: string;
}

export interface StoredSession {
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

export interface StoredSettings {
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

// ---- User queries ----
export function findUserByUsername(username: string): StoredUser | null {
  const row = db.exec('SELECT * FROM users WHERE username = ?', [username]);
  if (!row.length || !row[0].values.length) return null;
  return rowToUser(row[0].values[0]);
}

export function findUserById(id: string): StoredUser | null {
  const row = db.exec('SELECT * FROM users WHERE id = ?', [id]);
  if (!row.length || !row[0].values.length) return null;
  return rowToUser(row[0].values[0]);
}

export function createUser(user: StoredUser): StoredUser {
  db.run(
    'INSERT INTO users (id, username, password_hash, salt, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [user.id, user.username, user.passwordHash, user.salt, user.avatar, user.createdAt]
  );
  saveToDisk();
  return user;
}

function rowToUser(row: any[]): StoredUser {
  return {
    id: row[0], username: row[1], passwordHash: row[2], salt: row[3],
    avatar: row[4], createdAt: row[5],
  };
}

// ---- Session queries ----
export function getSessionsByUser(userId: string): StoredSession[] {
  const result = db.exec('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  if (!result.length) return [];
  return result[0].values.map(rowToSession);
}

export function createSession(session: StoredSession): StoredSession {
  db.run(
    'INSERT INTO sessions (id, user_id, tree_id, tree_name, category, duration_minutes, completed, is_rare, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [session.id, session.userId, session.treeId, session.treeName, session.category,
     session.durationMinutes, session.completed ? 1 : 0, session.isRare ? 1 : 0,
     session.note, session.createdAt]
  );
  saveToDisk();
  return session;
}

export function deleteSession(id: string, userId: string): boolean {
  const result = db.run('DELETE FROM sessions WHERE id = ? AND user_id = ?', [id, userId]);
  saveToDisk();
  return result.changes > 0;
}

export function clearSessionsByUser(userId: string) {
  db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  saveToDisk();
}

function rowToSession(row: any[]): StoredSession {
  return {
    id: row[0], userId: row[1], treeId: row[2], treeName: row[3],
    category: row[4], durationMinutes: row[5], completed: !!row[6],
    isRare: !!row[7], note: row[8] || '', createdAt: row[9],
  };
}

// ---- Settings queries ----
export function getSettingsByUser(userId: string): StoredSettings | null {
  const result = db.exec('SELECT * FROM settings WHERE user_id = ?', [userId]);
  if (!result.length || !result[0].values.length) return null;
  return rowToSettings(result[0].values[0]);
}

export function upsertSettings(settings: StoredSettings): StoredSettings {
  const existing = getSettingsByUser(settings.userId);
  if (existing) {
    db.run(
      `UPDATE settings SET focus_duration=?, break_duration=?, short_break_duration=?, long_break_duration=?,
       long_break_interval=?, auto_start_break=?, auto_start_focus=?, theme=?, ambient_sound=?,
       ambient_volume=?, sound_notifications=? WHERE user_id=?`,
      [settings.focusDuration, settings.breakDuration, settings.shortBreakDuration, settings.longBreakDuration,
       settings.longBreakInterval, settings.autoStartBreak ? 1 : 0, settings.autoStartFocus ? 1 : 0,
       settings.theme, settings.ambientSound, settings.ambientVolume, settings.soundNotifications ? 1 : 0,
       settings.userId]
    );
  } else {
    db.run(
      `INSERT INTO settings (user_id, focus_duration, break_duration, short_break_duration, long_break_duration,
       long_break_interval, auto_start_break, auto_start_focus, theme, ambient_sound, ambient_volume, sound_notifications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [settings.userId, settings.focusDuration, settings.breakDuration, settings.shortBreakDuration,
       settings.longBreakDuration, settings.longBreakInterval, settings.autoStartBreak ? 1 : 0,
       settings.autoStartFocus ? 1 : 0, settings.theme, settings.ambientSound, settings.ambientVolume,
       settings.soundNotifications ? 1 : 0]
    );
  }
  saveToDisk();
  return settings;
}

function rowToSettings(row: any[]): StoredSettings {
  return {
    userId: row[0], focusDuration: row[1], breakDuration: row[2], shortBreakDuration: row[3],
    longBreakDuration: row[4], longBreakInterval: row[5], autoStartBreak: !!row[6],
    autoStartFocus: !!row[7], theme: row[8], ambientSound: row[9],
    ambientVolume: row[10], soundNotifications: !!row[11],
  };
}
