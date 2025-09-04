// 导入必要的模块
const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();

// 创建HTTP服务器用于健康检查
const server = http.createServer((req, res) => {
  try {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        bot: client.user ? client.user.tag : 'Not ready',
        guilds: client.guilds ? client.guilds.cache.size : 0,
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } catch (error) {
    console.error('HTTP服务器错误:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP服务器运行在端口 ${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
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
    timeout: 60000, // 增加超时时间到60秒
    retries: 5 // 增加重试次数
  }
});

// 命令集合
client.commands = new Collection();
client.cooldowns = new Collection();

// 加载命令
const commandsPath = path.join(__dirname, 'commands');
try {
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    console.log('已创建命令目录');
  }
  
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // 设置一个新的 item 到 Collection 中，key 是命令名，value 是导出的模块
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[警告] ${filePath} 中的命令缺少必要的 "data" 或 "execute" 属性。`);
    }
  }
} catch (error) {
  console.error('加载命令时出错:', error);
}

// 加载事件
const eventsPath = path.join(__dirname, 'events');
try {
  if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
    console.log('已创建事件目录');
  }
  
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
} catch (error) {
  console.error('加载事件时出错:', error);
}

// 当客户端准备就绪时，运行此代码（仅运行一次）
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

// 检查是否有代理设置
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  console.log('检测到代理设置:');
  console.log(`HTTP_PROXY: ${process.env.HTTP_PROXY || '未设置'}`);
  console.log(`HTTPS_PROXY: ${process.env.HTTPS_PROXY || '未设置'}`);
}

// 设置重试逻辑
const MAX_RETRIES = 3;
let retryCount = 0;

function connectWithRetry() {
  console.log(`尝试连接到 Discord API (尝试 ${retryCount + 1}/${MAX_RETRIES})...`);
  
  // 登录到 Discord
  client.login(process.env.DISCORD_TOKEN)
    .then(() => {
      console.log('成功连接到 Discord API!');
    })
    .catch(error => {
      console.error('连接错误:', error);
      
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const retryDelay = retryCount * 5000; // 递增延迟，从5秒开始
        console.log(`将在 ${retryDelay/1000} 秒后重试...`);
        
        setTimeout(connectWithRetry, retryDelay);
      } else {
        console.error('达到最大重试次数，无法连接到 Discord API。');
        console.log('请检查:');
        console.log('1. 网络连接是否正常');
        console.log('2. Discord API 是否可用');
        console.log('3. 机器人令牌是否正确');
        console.log('4. 是否需要使用代理或 VPN');
      }
    });
}

// 注册斜杠命令的函数
async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  
  try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      }
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

// 开始连接
connectWithRetry();