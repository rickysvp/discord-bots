#!/bin/bash

# 这个脚本用于在 bot-hosting.net 上设置 MonadBot

# 确保所有目录存在
mkdir -p commands
mkdir -p events
mkdir -p data
mkdir -p docs

# 检查必要的文件是否存在
if [ ! -f "index.js" ]; then
  echo "错误: index.js 文件不存在!"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "错误: package.json 文件不存在!"
  exit 1
fi

# 安装依赖
echo "安装依赖..."
npm install

# 创建必要的数据文件（如果不存在）
if [ ! -f "data/games.json" ]; then
  echo "创建 games.json..."
  echo '{
    "users": {},
    "servers": {},
    "dailyGames": {},
    "checkins": {},
    "duels": {},
    "equipment": {},
    "hunts": {},
    "experience": {},
    "chatExp": {}
  }' > data/games.json
fi

if [ ! -f "data/equipment.json" ]; then
  echo "创建 equipment.json..."
  echo '{
    "shop": {},
    "templates": {}
  }' > data/equipment.json
fi

if [ ! -f "data/roles.json" ]; then
  echo "创建 roles.json..."
  echo '{
    "pending": {},
    "approved": {}
  }' > data/roles.json
fi

# 注册斜杠命令
echo "注册斜杠命令..."
node deploy-commands.js

echo "设置完成! 现在可以启动机器人了。"
echo "使用 'node index.js' 启动机器人。"