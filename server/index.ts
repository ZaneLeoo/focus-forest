import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import * as db from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

// ---- Startup ----
async function start() {
  await db.initDb();
  console.log('📂 SQLite database ready');

// ---- Helpers ----
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

function createToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 3600 * 1000 });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const [b64, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(b64).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId };
  } catch { return null; }
}

function toSafeUser(u: db.StoredUser) {
  return { id: u.id, username: u.username, avatar: u.avatar, createdAt: u.createdAt };
}

// ---- Middleware ----
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (_req.method === 'OPTIONS') { res.sendStatus(200); return; }
  next();
});
app.use(express.json());

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: '未登录' }); return; }
  const result = verifyToken(header.slice(7));
  if (!result) { res.status(401).json({ error: '登录已过期' }); return; }
  (req as any).userId = result.userId;
  next();
}

// ===== AUTH ROUTES =====
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.length < 2 || username.length > 20) {
    res.status(400).json({ error: '用户名需要 2-20 个字符' }); return;
  }
  if (password.length < 4) { res.status(400).json({ error: '密码至少 4 位' }); return; }
  if (db.findUserByUsername(username)) { res.status(409).json({ error: '用户名已被占用' }); return; }

  const AVATARS = ['🌵', '🪴', '🌿', '🍀', '🌻', '🌸', '🌺', '🐱', '🐶', '🐕', '🐈', '🐩', '🐾', '🦊', '🐰', '🐼'];
  const { hash, salt } = hashPassword(password);
  const user = db.createUser({
    id: crypto.randomUUID(),
    username,
    passwordHash: hash,
    salt,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ token: createToken(user.id), user: toSafeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.findUserByUsername(username);
  if (!user) { res.status(401).json({ error: '用户名或密码错误' }); return; }
  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) { res.status(401).json({ error: '用户名或密码错误' }); return; }
  res.json({ token: createToken(user.id), user: toSafeUser(user) });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.findUserById((req as any).userId);
  if (!user) { res.status(404).json({ error: '用户不存在' }); return; }
  res.json({ user: toSafeUser(user) });
});

// ===== SESSIONS ROUTES =====
app.get('/api/sessions', authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const sessions = db.getSessionsByUser(userId);
  res.json({ sessions });
});

app.post('/api/sessions', authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const { treeId, treeName, category, durationMinutes, completed, isRare, note } = req.body;
  if (!treeId || !treeName || !category) {
    res.status(400).json({ error: '缺少必填字段' }); return;
  }
  const session = db.createSession({
    id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    treeId: treeId || 'oak',
    treeName,
    category,
    durationMinutes: durationMinutes || 0,
    completed: completed !== false,
    isRare: isRare || false,
    note: note || '',
    createdAt: Date.now(),
  });
  res.status(201).json({ session });
});

app.delete('/api/sessions/:id', authMiddleware, (req, res) => {
  const ok = db.deleteSession(req.params.id, (req as any).userId);
  if (!ok) { res.status(404).json({ error: '记录不存在' }); return; }
  res.json({ success: true });
});

// ===== SETTINGS ROUTES =====
app.get('/api/settings', authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const settings = db.getSettingsByUser(userId);
  res.json({ settings: settings || getDefaultSettings(userId) });
});

app.put('/api/settings', authMiddleware, (req, res) => {
  const userId = (req as any).userId;
  const existing = db.getSettingsByUser(userId) || getDefaultSettings(userId);
  const updated = db.upsertSettings({ ...existing, ...req.body, userId });
  res.json({ settings: updated });
});

function getDefaultSettings(userId: string): db.StoredSettings {
  return {
    userId,
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
    soundNotifications: true,
  };
}

// ===== STATIC (production) =====
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => { res.sendFile(join(distPath, 'index.html')); });
}

app.listen(PORT, () => {
  console.log(`🌳 Focus Forest server → http://localhost:${PORT}`);
});
}

start();
