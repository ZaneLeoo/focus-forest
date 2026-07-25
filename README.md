# 🌳 Focus Forest — 专注森林

> 把专注变成种树，和朋友们一起建造一片数字森林。

## 本地运行

**前置条件：** Node.js 18+

```bash
# 1. 安装依赖
npm install

# 2. 启动后端服务（端口 3001）
npm run dev:server

# 3. 另开一个终端，启动前端开发服务器（端口 3000）
npm run dev
```

浏览器访问 `http://localhost:3000` 即可使用。

## 生产构建

```bash
npm run build
npm start
```

访问 `http://localhost:3001`。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS v4 |
| 3D | Three.js |
| 图表 | Recharts |
| 动画 | Motion (Framer Motion) |
| 后端 | Express 4 |
| 数据库 | SQLite（sql.js WASM） |
| 认证 | JWT（HMAC-SHA256） |
