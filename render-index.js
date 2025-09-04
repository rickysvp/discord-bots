// 导入必要的模块
const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

// 创建Express应用用于健康检查
const app = express();
const PORT = process.env.PORT || 10000;

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    bot: client.user ? client.user.tag : 'Not ready',
    guilds: client.guilds ? client.guilds.cache.size : 0,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'MonadBot is running!',
    status: client.user ? 'Connected' : 'Connecting...',
    bot: client.user ? client.user.tag : 'Not ready'
  });
});

// 启动HTTP服务器
app.listen(PORT, () => {
  console.log(`HTTP服务器运行在端口 ${PORT}`);
});

// 创建新的客户端实例
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  rest: {
    timeout: 60000,
    retries: 5
  }
});

// 命令集合
client.commands = new Collection();
client.cooldowns = new Collection();

// 注册斜杠命令的函数
async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  
  try {
    if (!fs.existsSync(commandsPath)) {
      console.log('命令目录不存在，跳过命令注册');
      return;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
        }
      } catch (error) {
        console.log(`加载命令 ${file} 时出错:`, error.message);
      }
    }

    if (commands.length === 0) {
      console.log('没有找到有效的命令文件');
      return;
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    console.log(`开始注册 ${commands.length} 个斜杠命令...`);

    let data;
    if (process.env.GUILD_ID) {
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      console.log(`成功在服务器中注册了 ${data.length} 个斜杠命令`);
    } else {
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log(`成功全局注册了 ${data.length} 个斜杠命令`);
    }
  } catch (error) {
    console.error('注册斜杠命令时出错:', error);
  }
}

// 加载命令
const commandsPath = path.join(__dirname, 'commands');
try {
  if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.log(`[警告] ${filePath} 中的命令缺少必要的 "data" 或 "execute" 属性。`);
        }
      } catch (error) {
        console.log(`加载命令 ${file} 时出错:`, error.message);
      }
    }
  }
} catch (error) {
  console.error('加载命令时出错:', error);
}

// 加载事件
const eventsPath = path.join(__dirname, 'events');
try {
  if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      try {
        const event = require(filePath);
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
      } catch (error) {
        console.log(`加载事件 ${file} 时出错:`, error.message);
      }
    }
  }
} catch (error) {
  console.error('加载事件时出错:', error);
}

// 当客户端准备就绪时，运行此代码
client.once(Events.ClientReady, async readyClient => {
  console.log(`准备就绪！已登录为 ${readyClient.user.tag}`);
  console.log(`机器人正在为 ${readyClient.guilds.cache.size} 个服务器提供服务`);
  
  // 注册斜杠命令
  await deployCommands();
});

// 处理交互命令
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`未找到命令 ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '执行此命令时出错！', ephemeral: true });
    } else {
      await interaction.reply({ content: '执行此命令时出错！', ephemeral: true });
    }
  }
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 连接到Discord
async function connectToDiscord() {
  try {
    console.log('正在连接到Discord API...');
    await client.login(process.env.DISCORD_TOKEN);
    console.log('成功连接到Discord API!');
  } catch (error) {
    console.error('连接Discord时出错:', error);
    // 在生产环境中，让进程退出，Render会自动重启
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// 开始连接
connectToDiscord();