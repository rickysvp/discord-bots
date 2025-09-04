// 本地测试脚本 - 模拟 Discord 机器人交互
require('dotenv').config();
const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('=== Discord 机器人本地测试模式 ===');
console.log('这个脚本允许你在本地测试机器人的命令，而不需要连接到 Discord API');
console.log('输入命令格式: /命令名 [参数名:参数值]\n');

// 创建模拟的客户端
const client = {
  commands: new Collection(),
  user: {
    id: '000000000000000000',
    tag: 'MonadBot#0000',
    username: 'MonadBot',
    discriminator: '0000',
    displayAvatarURL: () => 'https://example.com/avatar.png'
  },
  guilds: {
    cache: {
      size: 1
    }
  },
  ws: {
    ping: 42
  }
};

// 加载命令
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`已加载命令: ${command.data.name}`);
  } else {
    console.log(`[警告] ${filePath} 中的命令缺少必要的 "data" 或 "execute" 属性。`);
  }
}

// 创建模拟的交互对象
function createMockInteraction(commandName, options = {}) {
  const now = Date.now();
  const userId = '123456789012345678';
  const guildId = '987654321098765432';
  
  // 创建模拟用户
  const mockUser = {
    id: userId,
    username: 'TestUser',
    discriminator: '1234',
    tag: 'TestUser#1234',
    displayAvatarURL: () => 'https://example.com/user-avatar.png'
  };
  
  // 创建模拟服务器
  const mockGuild = {
    id: guildId,
    name: '测试服务器',
    memberCount: 42,
    ownerId: userId,
    createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000), // 30天前
    channels: { cache: { size: 10 } },
    emojis: { cache: { size: 5 } },
    premiumTier: 1,
    premiumSubscriptionCount: 3,
    iconURL: () => 'https://example.com/guild-icon.png'
  };
  
  // 创建模拟目标用户
  const mockTargetUser = {
    id: '234567890123456789',
    username: 'TargetUser',
    discriminator: '4321',
    tag: 'TargetUser#4321',
    displayAvatarURL: () => 'https://example.com/user-avatar.png'
  };
  
  return {
    commandName,
    client,
    user: mockUser,
    guild: mockGuild,
    guildId: guildId,
    member: {
      user: mockUser,
      displayName: mockUser.username,
      permissions: {
        has: () => true
      },
      roles: {
        cache: new Collection(),
        add: () => Promise.resolve(),
        remove: () => Promise.resolve()
      }
    },
    options: {
      getUser: (name) => options[name] ? mockTargetUser : null,
      getString: (name) => options[name] || null,
      getInteger: (name) => options[name] ? parseInt(options[name]) : null,
      getBoolean: (name) => options[name] === 'true',
      getSubcommand: () => options['subcommand'] || null,
      getMentionable: (name) => options[name] ? mockTargetUser : null
    },
    createdTimestamp: now,
    replied: false,
    deferred: false,
    reply: async (response) => {
      console.log('\n=== 机器人回复 ===');
      if (response.content) {
        console.log(response.content);
      }
      if (response.embeds) {
        for (const embed of response.embeds) {
          console.log('\n[嵌入消息]');
          if (embed.title) console.log(`标题: ${embed.title}`);
          if (embed.description) console.log(`描述: ${embed.description}`);
          if (embed.fields && embed.fields.length > 0) {
            console.log('字段:');
            for (const field of embed.fields) {
              console.log(`  ${field.name}: ${field.value}`);
            }
          }
          if (embed.footer) {
            console.log(`页脚: ${embed.footer.text}`);
          }
          if (embed.timestamp) {
            console.log(`时间戳: ${new Date(embed.timestamp).toLocaleString()}`);
          }
        }
      }
      if (response.components) {
        console.log('\n[交互组件]');
        console.log('组件已显示（按钮、选择菜单等）');
      }
      if (response.ephemeral) {
        console.log('(仅发送者可见)');
      }
      console.log('=================\n');
      return { createdTimestamp: Date.now() };
    },
    editReply: async (response) => {
      console.log('\n=== 机器人编辑回复 ===');
      if (response.content) {
        console.log(response.content);
      }
      if (response.embeds) {
        for (const embed of response.embeds) {
          console.log('\n[嵌入消息]');
          if (embed.title) console.log(`标题: ${embed.title}`);
          if (embed.description) console.log(`描述: ${embed.description}`);
          if (embed.fields && embed.fields.length > 0) {
            console.log('字段:');
            for (const field of embed.fields) {
              console.log(`  ${field.name}: ${field.value}`);
            }
          }
        }
      }
      console.log('=================\n');
    },
    followUp: async (response) => {
      console.log('\n=== 机器人后续回复 ===');
      if (response.content) {
        console.log(response.content);
      }
      if (response.embeds) {
        for (const embed of response.embeds) {
          console.log('\n[嵌入消息]');
          if (embed.title) console.log(`标题: ${embed.title}`);
          if (embed.description) console.log(`描述: ${embed.description}`);
          if (embed.fields && embed.fields.length > 0) {
            console.log('字段:');
            for (const field of embed.fields) {
              console.log(`  ${field.name}: ${field.value}`);
            }
          }
        }
      }
      console.log('=================\n');
    },
    isChatInputCommand: () => true,
    isButton: () => false,
    isSelectMenu: () => false
  };
}

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 处理用户输入
function promptUser() {
  rl.question('> ', async (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('退出测试模式');
      rl.close();
      return;
    }
    
    // 模拟聊天消息以获取经验值
    if (!input.startsWith('/')) {
      console.log(`[聊天] TestUser: ${input}`);
      
      // 尝试加载并执行 messageCreate 事件处理器
      try {
        const messageCreatePath = path.join(__dirname, 'events', 'messageCreate.js');
        if (fs.existsSync(messageCreatePath)) {
          const messageCreateHandler = require(messageCreatePath);
          
          // 创建模拟消息对象
          const mockMessage = {
            content: input,
            author: {
              id: '123456789012345678',
              username: 'TestUser',
              discriminator: '1234',
              tag: 'TestUser#1234',
              bot: false
            },
            channel: {
              send: (text) => {
                console.log(`[频道] ${text}`);
                return Promise.resolve();
              }
            }
          };
          
          // 执行消息处理
          await messageCreateHandler.execute(mockMessage);
        }
      } catch (error) {
        console.error('处理聊天消息时出错:', error);
      }
      
      promptUser();
      return;
    }
    
    // 解析命令
    const parts = input.substring(1).split(' ');
    const commandName = parts[0];
    const options = {};
    
    // 解析子命令和选项 (格式: 子命令 参数名:参数值)
    if (parts.length > 1) {
      // 检查第二个部分是否可能是子命令
      if (!parts[1].includes(':')) {
        options['subcommand'] = parts[1];
        // 从第三个部分开始解析选项
        for (let i = 2; i < parts.length; i++) {
          const optionPart = parts[i];
          const colonIndex = optionPart.indexOf(':');
          
          if (colonIndex > 0) {
            const name = optionPart.substring(0, colonIndex);
            const value = optionPart.substring(colonIndex + 1);
            options[name] = value;
          }
        }
      } else {
        // 没有子命令，直接解析选项
        for (let i = 1; i < parts.length; i++) {
          const optionPart = parts[i];
          const colonIndex = optionPart.indexOf(':');
          
          if (colonIndex > 0) {
            const name = optionPart.substring(0, colonIndex);
            const value = optionPart.substring(colonIndex + 1);
            options[name] = value;
          }
        }
      }
    }
    
    console.log('执行命令:', commandName);
    if (options['subcommand']) {
      console.log('子命令:', options['subcommand']);
    }
    console.log('选项:', options);
    
    // 执行命令
    const command = client.commands.get(commandName);
    
    if (command) {
      try {
        const interaction = createMockInteraction(commandName, options);
        await command.execute(interaction);
      } catch (error) {
        console.error(`执行命令 ${commandName} 时出错:`, error);
      }
    } else {
      console.log(`未找到命令: ${commandName}`);
      console.log('可用命令: ' + Array.from(client.commands.keys()).join(', '));
    }
    
    promptUser();
  });
}

// 确保数据目录和文件存在
function ensureDataFilesExist() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  // 确保 games.json 存在
  const gamesPath = path.join(dataDir, 'games.json');
  if (!fs.existsSync(gamesPath)) {
    fs.writeFileSync(gamesPath, JSON.stringify({
      users: {},
      servers: {},
      dailyGames: {},
      checkins: {},
      duels: {},
      equipment: {},
      hunts: {},
      experience: {},
      chatExp: {}
    }, null, 2));
    console.log('创建了 games.json 文件');
  }
  
  // 确保 equipment.json 存在
  const equipmentPath = path.join(dataDir, 'equipment.json');
  if (!fs.existsSync(equipmentPath)) {
    fs.writeFileSync(equipmentPath, JSON.stringify({
      items: {
        weapon: {},
        shield: {},
        helmet: {},
        armor: {},
        gloves: {},
        boots: {}
      },
      monsters: {
        salmonad: {
          name: "Salmonad",
          level: 1,
          hp: 200,
          attack: 100,
          defense: 100,
          agility: 100,
          accuracy: 50,
          critical: 50,
          dmonReward: { min: 50, max: 150 },
          dropChance: 0.7,
          possibleDrops: ["weapon_common_1", "shield_common_1", "helmet_common_1"]
        },
        moyaki: {
          name: "Moyaki",
          level: 2,
          hp: 400,
          attack: 200,
          defense: 200,
          agility: 200,
          accuracy: 100,
          critical: 100,
          dmonReward: { min: 100, max: 300 },
          dropChance: 0.75,
          possibleDrops: ["weapon_uncommon_1", "shield_uncommon_1", "helmet_uncommon_1"]
        },
        lamouch: {
          name: "Lamouch",
          level: 3,
          hp: 800,
          attack: 300,
          defense: 300,
          agility: 300,
          accuracy: 150,
          critical: 150,
          dmonReward: { min: 200, max: 500 },
          dropChance: 0.8,
          possibleDrops: ["weapon_rare_1", "shield_rare_1", "helmet_rare_1"]
        },
        chog: {
          name: "Chog",
          level: 4,
          hp: 1600,
          attack: 400,
          defense: 400,
          agility: 400,
          accuracy: 200,
          critical: 200,
          dmonReward: { min: 400, max: 800 },
          dropChance: 0.85,
          possibleDrops: ["weapon_epic_1", "shield_epic_1", "helmet_epic_1"]
        },
        molandak: {
          name: "Molandak",
          level: 5,
          hp: 3200,
          attack: 500,
          defense: 500,
          agility: 500,
          accuracy: 250,
          critical: 250,
          dmonReward: { min: 800, max: 1500 },
          dropChance: 0.9,
          possibleDrops: ["weapon_legendary_1", "shield_legendary_1", "helmet_legendary_1"]
        }
      }
    }, null, 2));
    console.log('创建了 equipment.json 文件');
  }
  
  // 确保 roles.json 存在
  const rolesPath = path.join(dataDir, 'roles.json');
  if (!fs.existsSync(rolesPath)) {
    fs.writeFileSync(rolesPath, JSON.stringify({
      pendingRoles: [],
      approvedRoles: []
    }, null, 2));
    console.log('创建了 roles.json 文件');
  }
}

// 启动测试界面
ensureDataFilesExist();
console.log('\n测试环境已准备就绪！');
console.log('可用命令: ' + Array.from(client.commands.keys()).join(', '));
console.log('你也可以直接输入文本来模拟聊天获取经验值');
console.log('输入 "exit" 或 "quit" 退出\n');
promptUser();
