/**
 * Focus Forest — GitHub Webhook Auto-Deploy
 * Listens for push events from GitHub, then pulls + builds + restarts.
 */
import http from 'http';
import crypto from 'crypto';
import { execSync } from 'child_process';

const PORT = 3456;
const SECRET = process.env.WEBHOOK_SECRET || 'focus-forest-deploy-secret-change-me';
const REPO_DIR = '/opt/focus-forest';

function run(cmd: string): string {
  try {
    return execSync(cmd, { cwd: REPO_DIR, encoding: 'utf-8', timeout: 120_000 });
  } catch (e: any) {
    return `ERROR: ${e.message}\n${e.stdout || ''}\n${e.stderr || ''}`;
  }
}

function deploy(): string {
  const log: string[] = [];
  const t = () => new Date().toLocaleString('zh-CN');

  log.push(`[${t()}] 🚀 Deploy started`);

  // Pull latest code
  const pull = run('git pull origin master 2>&1');
  log.push(`📥 git pull:\n${pull}`);

  // Install deps (if changed)
  const install = run('source /root/.nvm/nvm.sh && nvm use 22 && npm install 2>&1');
  log.push(`📦 npm install:\n${install}`);

  // Build
  const build = run('source /root/.nvm/nvm.sh && nvm use 22 && npm run build 2>&1');
  log.push(`🔨 build:\n${build}`);

  // Restart
  const restart = run('export PATH=/root/.nvm/versions/node/v22.23.1/bin:$PATH && pm2 restart focus-forest 2>&1');
  log.push(`🔄 restart:\n${restart}`);

  log.push(`[${t()}] ✅ Deploy finished`);
  return log.join('\n\n');
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Focus Forest Deploy Hook</h1><p>POST /deploy with GitHub webhook</p>');
    return;
  }

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    // Verify signature
    const sig = req.headers['x-hub-signature-256'] as string;
    const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');

    if (!sig || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      console.log(`[${new Date().toISOString()}] ❌ Invalid signature`);
      res.writeHead(403);
      res.end('Invalid signature');
      return;
    }

    let payload: any;
    try { payload = JSON.parse(body); } catch {
      res.writeHead(400);
      res.end('Bad JSON');
      return;
    }

    // Only deploy on push to master
    const ref = payload?.ref || '';
    if (ref !== 'refs/heads/master') {
      console.log(`[${new Date().toISOString()}] ℹ️  Ignored ref: ${ref}`);
      res.writeHead(200);
      res.end(`Ignored: ${ref}`);
      return;
    }

    console.log(`[${new Date().toISOString()}] 🚀 Triggered by push to master`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // Run deploy asynchronously
    const result = deploy();
    console.log(result);
    res.end(result);
  });
});

server.listen(PORT, () => {
  console.log(`🔗 Deploy webhook listening on :${PORT}`);
  console.log(`   GitHub webhook URL: http://YOUR_IP:${PORT}/deploy`);
  console.log(`   Secret: ${SECRET.slice(0, 8)}...`);
});
