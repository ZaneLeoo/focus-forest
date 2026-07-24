# Focus Forest — 功能说明

> 🌳 把专注变成种树，和朋友们一起建造一片数字森林。

---

## 一、核心功能

### 🌱 番茄钟专注

- 自定义专注时长（15 / 25 / 45 / 60 分钟，或手动输入）
- 3D 树木实时生长动画，随进度从幼苗→小树→大树
- 支持四种树种：橡树、松树、樱花（稀有）、银杏（稀有）
- 专注完成后自动进入休息模式，支持自动开始
- **提前结束**：已专注超过 1 分钟可提前收成
- **放弃**：中断记录但不种树
- 专注完成时弹出**浏览器通知** + 撒花特效

### 🌲 我的森林

- 网格视图展示所有种植的树木
- 支持按日/周/月/全部筛选
- 搜索树名或分类
- 点击树木查看详情（树种、时长、分类、种植时间）
- **成长亮点**：连续专注天数 + 本周统计

### 📊 数据统计

- 总专注时长、平均单次时长、完成率
- 7/30 天专注趋势折线图
- 分类分布饼图
- 26 周种植热力图

### 🏆 排行榜

- 所有用户按总专注时长或种树数排名
- 前三名显示金银铜牌
- 点击冠军触发撒花庆祝 🎉

### ⚙️ 设置

- 专注时长、休息时长自定义
- 自动开始休息/专注开关
- **浅色 / 深色 / 跟随系统** 主题切换
- 环境音选择（雨林 / 微风 / 小溪 / 鸟鸣 / 篝火）
- 动画强度调节
- 声音提醒开关
- CSV 数据导出

---

## 二、技术架构

```
前端：React 19 + Vite + Tailwind CSS v4 + Three.js
后端：Express + SQLite (sql.js)
部署：Ubuntu + Nginx + PM2 + GitHub Webhook 自动部署
```

| 层 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS v4（class 策略暗色模式） |
| 3D | Three.js 0.185 |
| 图表 | Recharts |
| 动画 | Motion (Framer Motion) |
| 后端 | Express 4 |
| 数据库 | SQLite（sql.js，WASM 实现） |
| 认证 | JWT（HMAC-SHA256，7天过期） |
| 部署 | PM2 + Nginx + GitHub Webhook |

---

## 三、API 接口

| 方法 | 路径 | 说明 | 需要认证 |
|------|------|------|----------|
| POST | `/api/auth/register` | 注册 | ❌ |
| POST | `/api/auth/login` | 登录 | ❌ |
| GET | `/api/auth/me` | 获取当前用户 | ✅ |
| GET | `/api/sessions` | 获取专注记录 | ✅ |
| POST | `/api/sessions` | 创建专注记录 | ✅ |
| DELETE | `/api/sessions/:id` | 删除记录 | ✅ |
| GET | `/api/settings` | 获取设置 | ✅ |
| PUT | `/api/settings` | 更新设置 | ✅ |
| GET | `/api/rankings` | 排行榜 | ❌ |
| DELETE | `/api/users/:id` | 删除用户 | ✅ |
| POST | `/api/users/:id/reset-password` | 重置密码 | ✅ |

---

## 四、数据库表结构

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| username | TEXT UNIQUE | 用户名 |
| password_hash | TEXT | PBKDF2+SHA512 加密 |
| salt | TEXT | 密码盐 |
| avatar | TEXT | 随机 emoji 头像 |
| created_at | TEXT | 注册时间 |

### sessions
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 会话 ID |
| user_id | TEXT FK | 关联用户 |
| tree_id | TEXT | 树种 ID |
| tree_name | TEXT | 树种名称 |
| category | TEXT | 专注分类 |
| duration_minutes | INTEGER | 时长（分钟） |
| completed | INTEGER | 是否完成 |
| is_rare | INTEGER | 是否稀有 |
| note | TEXT | 备注 |
| created_at | INTEGER | 时间戳 |

### settings
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | TEXT PK FK | 关联用户 |
| focus_duration | INTEGER | 专注时长（默认 25） |
| break_duration | INTEGER | 休息时长（默认 5） |
| theme | TEXT | 主题（light/dark/system） |
| ambient_sound | TEXT | 环境音 |
| ambient_volume | REAL | 音量（0-1） |

---

## 五、部署信息

| 项目 | 值 |
|---|---|
| 服务器 IP | `8.134.77.221` |
| 访问地址 | http://8.134.77.221 |
| 项目目录 | `/opt/focus-forest` |
| 进程管理 | PM2（focus-forest + focus-webhook） |
| 自动部署 | GitHub Webhook → `/deploy` |

---

## 六、v2.0 更新内容

1. 🌙 **深色主题** — 一键切换暗色模式，深夜护眼
2. 🏆 **排行榜** — 按时长/次数排名，支持撒花庆祝
3. 🔔 **浏览器通知** — 专注完成时弹出系统提醒
4. 📡 **后端全面对接** — 数据持久化到服务器，换设备也能恢复
5. 🐛 **修复多项 Bug** — 3D 树初始不显示、刷新需重新登录等
