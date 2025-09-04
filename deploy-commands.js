const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
// 获取命令文件
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// 从每个命令文件中获取命令数据
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[警告] ${filePath} 中的命令缺少必要的 "data" 或 "execute" 属性。`);
  }
}

// 构造并准备 REST 实例
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// 部署命令
(async () => {
  try {
    console.log(`开始刷新 ${commands.length} 个应用程序 (/) 命令。`);

    // 检查是否提供了客户端 ID 和公会 ID
    if (!process.env.CLIENT_ID) {
      throw new Error('缺少 CLIENT_ID 环境变量。请在 .env 文件中添加您的机器人客户端 ID。');
    }

    let data;
    
    // 如果提供了公会 ID，则只在特定公会中注册命令
    if (process.env.GUILD_ID) {
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      console.log(`成功在公会 ${process.env.GUILD_ID} 中注册了 ${data.length} 个应用程序 (/) 命令。`);
    } else {
      // 否则，全局注册命令（可能需要等待长达一小时才能生效）
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log(`成功全局注册了 ${data.length} 个应用程序 (/) 命令。`);
    }
  } catch (error) {
    console.error(error);
  }
})();