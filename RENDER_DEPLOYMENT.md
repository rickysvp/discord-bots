# Render.com 部署指南

## 准备工作

1. 确保你有一个 [Render.com](https://render.com) 账户
2. 确保你的Discord机器人已在Discord开发者门户创建
3. 准备好以下环境变量：
   - `DISCORD_TOKEN`: 你的Discord机器人令牌
   - `CLIENT_ID`: Discord应用程序ID
   - `GUILD_ID`: (可选) Discord服务器ID
   - `DEVELOPER_ID`: (可选) 开发者Discord用户ID

## 部署步骤

### 方法1: 使用Git仓库部署

1. **创建Git仓库**
   - 将MonadBot代码推送到GitHub、GitLab或Bitbucket
   - 确保包含所有必要文件

2. **在Render.com创建新服务**
   - 登录Render.com控制台
   - 点击"New +" → "Web Service"
   - 连接你的Git仓库
   - 选择MonadBot项目

3. **配置服务设置**
   - **Name**: `monadbot` (或你喜欢的名称)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node render-index.js`
   - **Plan**: 选择Free或付费计划

4. **设置环境变量**
   在Environment Variables部分添加：
   ```
   DISCORD_TOKEN=你的机器人令牌
   CLIENT_ID=你的应用程序ID
   GUILD_ID=你的服务器ID (可选)
   DEVELOPER_ID=你的用户ID (可选)
   NODE_ENV=production
   ```

5. **部署**
   - 点击"Create Web Service"
   - 等待部署完成

### 方法2: 手动上传文件

1. **准备文件**
   - 压缩MonadBot文件夹为ZIP文件
   - 确保包含所有必要文件

2. **创建服务**
   - 在Render.com选择"Deploy from Git"
   - 上传ZIP文件

3. **配置和部署**
   - 按照方法1的步骤3-5进行配置

## 重要配置说明

### 启动命令
使用 `node render-index.js` 而不是 `node index.js`，因为：
- `render-index.js` 包含Express服务器用于健康检查
- Render需要HTTP端点来确认服务正常运行
- 包含更好的错误处理和重启机制

### 环境变量
- **必需**: `DISCORD_TOKEN`, `CLIENT_ID`
- **可选**: `GUILD_ID` (用于服务器特定命令), `DEVELOPER_ID`
- **自动**: `PORT` (Render自动设置)

### 健康检查
服务会在以下端点提供健康检查：
- `/health` - JSON格式的详细状态
- `/` - 简单的状态页面

## 部署后验证

1. **检查服务状态**
   - 在Render控制台查看日志
   - 确认看到 "准备就绪！已登录为 [机器人名称]"

2. **测试机器人**
   - 在Discord服务器中输入 `/ping`
   - 使用 `/help` 查看所有命令

3. **监控日志**
   - 在Render控制台的Logs标签页监控运行状态
   - 查看是否有错误或警告

## 故障排除

### 常见问题

1. **机器人离线**
   - 检查DISCORD_TOKEN是否正确
   - 确认机器人已被邀请到服务器

2. **命令不可用**
   - 等待1-2分钟让斜杠命令注册
   - 检查CLIENT_ID是否正确

3. **服务重启**
   - Render免费计划在无活动时会休眠
   - 考虑升级到付费计划以保持24/7运行

4. **内存或CPU限制**
   - 免费计划有资源限制
   - 监控资源使用情况

### 日志查看
在Render控制台的Logs部分查看：
- 启动日志
- Discord连接状态
- 命令注册结果
- 错误信息

## 升级和维护

1. **代码更新**
   - 推送新代码到Git仓库
   - Render会自动重新部署

2. **环境变量更新**
   - 在Render控制台更新环境变量
   - 服务会自动重启

3. **监控**
   - 定期检查服务状态
   - 监控资源使用情况

## 成本考虑

- **免费计划**: 有限资源，服务会休眠
- **付费计划**: 24/7运行，更多资源
- **建议**: 对于生产环境使用付费计划

## 支持

如果遇到问题：
1. 查看Render.com文档
2. 检查Discord.js文档
3. 查看项目的GitHub Issues
4. 联系Render支持团队