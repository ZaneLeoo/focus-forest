# Focus Forest — 服务器运维参考

> 最后更新：2026-07-24  
> 本文档供开发者（人类 & AI）快速了解服务器架构和日常操作。

---

## 一、连接信息

| 项目 | 值 |
|---|---|
| 公网 IP | `8.134.77.221` |
| SSH 用户 | `root` |
| SSH 密码 | `Yjxsz2001!` |
| SSH 端口 | `22` |
| 访问地址 | http://8.134.77.221 |
| GitHub 仓库 | git@github.com:ZaneLeoo/focus-forest.git（master 分支） |

SSH 连接命令：
```bash
ssh root@8.134.77.221
# 密码: Yjxsz2001!
```

---

## 二、服务器规格

| 项目 | 值 |
|---|---|
| 操作系统 | Ubuntu 22.04.5 LTS |
| CPU 核心 | 2 |
| 内存 | 1.6 GB（可用约 1.0 GB） |
| 磁盘 | 40 GB（已用 6.2 GB，32 GB 可用） |
| Swap | 无 |
| 系统 Node.js | v12.22.9（**不要用，太旧**） |
| NVM Node.js | v22.23.1（位于 `/root/.nvm/versions/node/v22.23.1/bin/`） |
| Java | OpenJDK 17.0.19 |

---

## 三、运行中的服务（PM2 管理）

| 进程名 | 端口 | 用途 | 启动方式 |
|---|---|---|---|
| `focus-forest` | `3001` | 主应用（Express + 静态文件） | `pm2 start server/index.ts --interpreter ./node_modules/.bin/tsx` |
| `focus-webhook` | `3456` | GitHub Webhook 自动部署 | `pm2 start server/webhook.cjs --interpreter /root/.nvm/.../node` |

常用命令：
```bash
pm2 status              # 查看所有进程
pm2 logs focus-forest   # 查看主应用日志
pm2 logs focus-webhook  # 查看 webhook 日志
pm2 restart focus-forest
pm2 restart focus-webhook
```

---

## 四、Nginx 配置

配置文件：`/etc/nginx/sites-enabled/focus-forest`

```
:80/deploy  →  proxy_pass http://127.0.0.1:3456  (webhook)
:80/        →  proxy_pass http://127.0.0.1:3001  (主应用)
```

操作命令：
```bash
nginx -t              # 测试配置
nginx -s reload       # 重载配置
cat /etc/nginx/sites-enabled/focus-forest  # 查看配置
```

---

## 五、项目目录结构

```
/opt/focus-forest/
├── server/
│   ├── index.ts       # Express 主服务（API + 静态文件）
│   ├── db.ts          # SQLite 数据库操作
│   ├── webhook.ts     # （已废弃）TypeScript 版 webhook
│   └── webhook.cjs    # GitHub Webhook 自动部署服务
├── src/               # React 前端源码
│   ├── App.tsx        # 主入口
│   ├── components/    # UI 组件
│   ├── services/      # API 调用、音频等
│   └── context/       # React Context
├── dist/              # 前端构建产物（Vite build）
├── data/              # SQLite 数据库文件
├── package.json       # 依赖配置
└── vite.config.ts     # Vite 构建配置
```

---

## 六、自动化部署流程

```
开发者 git push master
    ↓
GitHub 发送 webhook → http://8.134.77.221/deploy
    ↓
focus-webhook 验证签名
    ↓
cd /opt/focus-forest
git pull origin master
npm install
npm run build
pm2 restart focus-forest
```

### GitHub Webhook 配置

| 字段 | 值 |
|---|---|
| Payload URL | `http://8.134.77.221/deploy` |
| Content type | `application/json` |
| Secret | `focus-forest-deploy-secret-change-me` |
| Events | Push（仅 master 分支） |

### 手动部署（备用）

```bash
ssh root@8.134.77.221
cd /opt/focus-forest
git pull origin master
npm install
npm run build
pm2 restart focus-forest
```

---

## 七、重要注意事项

1. **Node.js 版本**：系统默认是 v12，所有命令必须使用 NVM 的 v22：
   ```bash
   export PATH=/root/.nvm/versions/node/v22.23.1/bin:$PATH
   ```
   或先执行 `. /root/.nvm/nvm.sh && nvm use 22`

2. **Shell 类型**：`execSync` 等工具默认使用 `/bin/sh`（dash，不是 bash），不支持 `source`。用 `export PATH=...` 代替。

3. **PM2 路径**：PM2 安装在 NVM Node 下，完整路径：
   ```
   /root/.nvm/versions/node/v22.23.1/bin/pm2
   ```

4. **内存紧张**：总共 1.6 GB，两个 Node 进程占用约 110 MB。不要安装 Jenkins 等重型服务。

5. **数据库**：SQLite，数据文件在 `/opt/focus-forest/data/`，注意备份。

6. **构建产物**：Vite 代码分割配置在 `vite.config.ts` 中，`three`(519KB)、`recharts`(388KB)、`motion`(63KB) 分别拆成独立 chunk，ForestView/StatsView/SettingsView 懒加载。

---

## 八、常见问题

### Q: 前端报 "Failed to fetch"
检查 `src/services/api.ts`，生产构建 (`import.meta.env.PROD`) 时 API_BASE 必须为空字符串（同源请求）。

### Q: 手机访问卡顿
- 3D 渲染循环通过 `visibilitychange` 在页面隐藏时暂停
- 非当前视图会被卸载（条件渲染而非 CSS hidden）
- 手机端关闭抗锯齿、阴影、降低像素比

### Q: Webhook 部署失败
查看日志：`pm2 logs focus-webhook`
常见原因：`source` 命令不兼容 → 已改用 `export PATH`
