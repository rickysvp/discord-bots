# MonadBot 部署指南 (bot-hosting.net)

本指南将帮助您将 MonadBot 部署到 bot-hosting.net 平台。

## 准备工作

1. 确保您已经在 Discord 开发者门户创建了应用程序并获取了机器人令牌
2. 确保您已经在 bot-hosting.net 注册了账号

## 部署步骤

### 1. 打包项目文件

将项目打包为 ZIP 文件，确保包含以下文件和目录：

- `index.js`
- `deploy-commands.js`
- `package.json`
- `.env` (包含您的机器人令牌和应用程序 ID)
- `commands/` 目录
- `events/` 目录
- `data/` 目录
- `docs/` 目录

### 2. 登录 bot-hosting.net

访问 [bot-hosting.net](https://bot-hosting.net/) 并登录您的账号。

### 3. 创建新的机器人实例

1. 在控制面板中，点击"创建新实例"或类似按钮
2. 选择 Node.js 作为运行环境
3. 选择适合的计划（根据您的需求和预算）

### 4. 上传项目文件

有两种方式上传项目文件：

#### 方式 1: ZIP 上传
1. 在控制面板中找到文件上传选项
2. 上传您准备好的 ZIP 文件
3. 等待上传完成并解压

#### 方式 2: Git 仓库
如果您的项目在 GitHub 或其他 Git 仓库：
1. 在控制面板中找到 Git 集成选项
2. 输入您的仓库 URL
3. 提供必要的访问凭证（如果是私有仓库）
4. 选择要部署的分支

### 5. 配置环境变量

在控制面板中找到环境变量设置，添加以下变量：

- `DISCORD_TOKEN`：您的 Discord 机器人令牌
- `CLIENT_ID`：您的 Discord 应用程序 ID
- `GUILD_ID`：（可选）您的 Discord 服务器 ID
- `PREFIX`：（可选）机器人前缀
- `DEVELOPER_ID`：您的 Discord 用户 ID

或者，您也可以直接上传 `.env` 文件（如果平台支持）。

### 6. 设置启动命令

在控制面板中找到启动命令设置，设置为：

```
npm start
```

### 7. 首次运行配置

首次部署时，需要注册斜杠命令。在控制面板的终端或命令执行界面中运行：

```
node deploy-commands.js
```

这只需要在首次部署或更改命令定义时执行。

### 8. 启动机器人

在控制面板中找到启动按钮，启动您的机器人实例。

### 9. 监控和日志

启动后，使用控制面板中的日志查看器监控机器人的运行状态，确保没有错误发生。

## 故障排除

### 机器人无法连接到 Discord

1. 检查 `DISCORD_TOKEN` 是否正确
2. 确保在 Discord 开发者门户中已启用机器人的所有必要权限
3. 检查机器人是否已被邀请到您的服务器，邀请链接格式为：
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
   ```

### 斜杠命令不可用

1. 确保已运行 `node deploy-commands.js`
2. 检查 `CLIENT_ID` 是否正确
3. 确保机器人有 `applications.commands` 权限

### 数据文件问题

如果遇到数据文件相关的错误：

1. 确保 `data/` 目录存在
2. 确保该目录中包含必要的 JSON 文件：`games.json`, `equipment.json`, `roles.json`
3. 如果文件不存在，可以手动创建它们，使用以下基本结构：

```json
{
  "users": {},
  "servers": {},
  "dailyGames": {},
  "checkins": {},
  "duels": {},
  "equipment": {},
  "hunts": {},
  "experience": {},
  "chatExp": {}
}
```

## 更新机器人

当您需要更新机器人时：

1. 上传新的代码文件
2. 如果命令定义有变化，重新运行 `node deploy-commands.js`
3. 重启机器人实例

## 备份数据

定期备份 `data/` 目录中的 JSON 文件，以防数据丢失。