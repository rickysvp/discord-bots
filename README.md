# MonadBot 🤖

一个功能丰富的 Discord 机器人，包含角色管理、游戏系统、装备系统和经验值系统。

## ✨ 功能特性

- **🎭 角色管理**：提交、审核和查看高级角色
- **🎮 游戏系统**：骰子游戏、决斗系统、狩猎系统
- **⚔️ 装备系统**：获取、管理和交易装备
- **📈 经验值系统**：通过聊天、狩猎和决斗获取经验值
- **🎒 背包系统**：管理和交易装备
- **🛒 商店系统**：购买和出售装备和角色

## 🚀 快速开始

### 本地运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/你的用户名/MonadBot.git
   cd MonadBot
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入你的Discord机器人信息
   ```

4. **运行机器人**
   ```bash
   npm start
   ```

### 部署到 Render.com

详细部署指南请查看 [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

## 📋 环境变量

```env
DISCORD_TOKEN=你的Discord机器人令牌
CLIENT_ID=你的Discord应用程序ID
GUILD_ID=你的Discord服务器ID (可选)
DEVELOPER_ID=你的Discord用户ID (可选)
```

## 🎯 主要命令

| 命令 | 描述 |
|------|------|
| `/ping` | 测试机器人响应 |
| `/help` | 显示所有可用命令 |
| `/profile` | 查看个人资料 |
| `/checkin` | 每日签到获取奖励 |
| `/dice` | 骰子游戏 |
| `/duel @用户` | 与其他用户决斗 |
| `/hunt` | 狩猎获取经验和装备 |
| `/shop` | 访问商店 |
| `/inventory` | 查看背包 |

## 📄 许可证

本项目采用 MIT 许可证

---

⭐ 如果这个项目对你有帮助，请给它一个星标！