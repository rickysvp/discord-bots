# Bot-Hosting.net 部署指南

根据您收到的错误信息，我们需要调整部署方式。以下是在 bot-hosting.net 上成功部署 MonadBot 的详细步骤：

## 错误分析

您收到的错误是：
```
Error: Cannot find module '/home/container/index.js'
```

这表明 bot-hosting.net 期望在 `/home/container/` 目录下找到 `index.js` 文件，但没有找到。

## 解决方案

### 1. 检查环境变量设置

在 bot-hosting.net 控制面板中，您需要确保以下环境变量设置正确：

- `BOT_JS_FILE`: 应该设置为 `index.js` 或您的主入口文件名
- `NODE_PACKAGES`: 可以设置为 `discord.js dotenv` 以确保安装必要的包

### 2. 正确上传文件

确保您的文件上传到了正确的位置：

1. 在 bot-hosting.net 控制面板中，找到文件管理器
2. 上传所有文件到根目录 (`/home/container/`)
3. 确保 `index.js` 文件直接位于根目录下，而不是在子文件夹中

### 3. 文件结构检查

确保您的文件结构如下：

```
/home/container/
├── index.js
├── deploy-commands.js
├── package.json
├── .env
├── commands/
│   ├── ping.js
│   ├── help.js
│   └── ...
├── events/
│   ├── ready.js
│   ├── interactionCreate.js
│   └── ...
└── data/
    ├── games.json
    ├── equipment.json
    └── roles.json
```

### 4. 使用设置脚本

我们已经创建了一个设置脚本 `bot-hosting-setup.sh`，您可以在服务器启动后运行它：

1. 在控制面板中找到终端或命令执行界面
2. 运行以下命令：
   ```
   chmod +x bot-hosting-setup.sh
   ./bot-hosting-setup.sh
   ```

这个脚本会：
- 创建必要的目录
- 检查必要的文件
- 安装依赖
- 创建数据文件（如果不存在）
- 注册斜杠命令

### 5. 手动设置步骤

如果脚本不起作用，您可以手动执行以下步骤：

1. 确保所有文件都已上传
2. 运行 `npm install` 安装依赖
3. 创建必要的数据目录和文件：
   ```
   mkdir -p data
   echo '{"users":{},"servers":{},"dailyGames":{},"checkins":{},"duels":{},"equipment":{},"hunts":{},"experience":{},"chatExp":{}}' > data/games.json
   echo '{"shop":{},"templates":{}}' > data/equipment.json
   echo '{"pending":{},"approved":{}}' > data/roles.json
   ```
4. 运行 `node deploy-commands.js` 注册斜杠命令
5. 运行 `node index.js` 启动机器人

### 6. 修改启动命令

在 bot-hosting.net 控制面板中，您可能需要修改启动命令。找到启动命令设置，并确保它设置为：

```
node index.js
```

### 7. 检查日志

启动后，密切关注日志输出，查找任何错误信息。如果出现新的错误，根据错误信息进行相应调整。

## 常见问题解决

### 找不到模块

如果出现 "Cannot find module" 错误：

1. 确保 `package.json` 文件中列出了所有依赖
2. 运行 `npm install` 安装所有依赖
3. 检查模块路径是否正确

### 权限问题

如果出现权限相关错误：

1. 确保数据目录和文件具有正确的读写权限
2. 运行 `chmod -R 755 .` 设置适当的权限

### 连接问题

如果机器人无法连接到 Discord：

1. 检查 `.env` 文件中的 `DISCORD_TOKEN` 是否正确
2. 确保机器人已被邀请到您的服务器
3. 检查 bot-hosting.net 是否允许外部连接

## 联系支持

如果您仍然遇到问题，请联系 bot-hosting.net 的支持团队，提供以下信息：

1. 完整的错误日志
2. 您的文件结构
3. 您尝试过的解决方案

他们应该能够帮助您解决特定于他们平台的问题。