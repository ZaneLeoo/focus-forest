const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PORT = 3456;
const SECRET = 'focus-forest-deploy-secret-change-me';

function run(cmd) {
  try {
    return execSync(cmd, { cwd: '/opt/focus-forest', encoding: 'utf-8', timeout: 120000 });
  } catch (e) {
    return 'ERROR: ' + e.message;
  }
}

function deploy() {
  const log = [];
  log.push('[DEPLOY] git pull:\n' + run('git pull origin master 2>&1'));
  log.push('[DEPLOY] npm install:\n' + run('source /root/.nvm/nvm.sh && nvm use 22 && npm install 2>&1'));
  log.push('[DEPLOY] build:\n' + run('source /root/.nvm/nvm.sh && nvm use 22 && npm run build 2>&1'));
  log.push('[DEPLOY] restart:\n' + run('export PATH=/root/.nvm/versions/node/v22.23.1/bin:$PATH && pm2 restart focus-forest 2>&1'));
  return log.join('\n\n');
}

http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Focus Forest Deploy Hook</h1><p>POST /deploy with GitHub webhook</p>');
    return;
  }

  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const sig = req.headers['x-hub-signature-256'] || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');

    if (!sig || sig !== expected) {
      res.writeHead(403);
      res.end('Invalid signature');
      return;
    }

    let payload;
    try { payload = JSON.parse(body); } catch {
      res.writeHead(400);
      res.end('Bad JSON');
      return;
    }

    if (payload.ref !== 'refs/heads/master') {
      res.writeHead(200);
      res.end('Ignored: ' + payload.ref);
      return;
    }

    console.log(new Date().toISOString(), 'Deploy triggered by push to master');
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    const result = deploy();
    console.log(result);
    res.end(result);
  });
}).listen(PORT, () => {
  console.log('Webhook listening on :' + PORT);
});
