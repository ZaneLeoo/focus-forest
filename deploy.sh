#!/bin/bash
# Focus Forest 一键部署脚本
# 在服务器上运行: bash deploy.sh

set -e

echo "🌳 Focus Forest 部署开始..."

# 1. 安装 Node.js (如果没装)
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node $(node -v) | npm $(npm -v)"

# 2. 安装 PM2 (进程守护)
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 3. 克隆项目
APP_DIR="/opt/focus-forest"
if [ -d "$APP_DIR" ]; then
    echo "📂 目录已存在，拉取更新..."
    cd "$APP_DIR"
    git pull origin master
else
    echo "📂 克隆项目..."
    git clone git@github.com:ZaneLeoo/focus-forest.git "$APP_DIR"
    cd "$APP_DIR"
fi

# 4. 安装依赖 + 构建
echo "📦 安装依赖..."
npm install

echo "🔨 构建前端..."
npm run build

# 5. 环境变量
export NODE_ENV=production
export PORT=3001

# 6. 启动/重启
echo "🚀 启动服务..."
pm2 delete focus-forest 2>/dev/null || true
pm2 start server/index.ts --name focus-forest --interpreter tsx --env production
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "✅ 部署完成！"
echo "   访问: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP'):3001"
echo "   管理: pm2 status"
echo "   日志: pm2 logs focus-forest"
echo "   更新: cd $APP_DIR && git pull && npm install && npm run build && pm2 restart focus-forest"
