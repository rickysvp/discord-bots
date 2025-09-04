const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 数据文件路径
const gamesDataPath = path.join(__dirname, '..', 'data', 'games.json');

// 读取游戏数据
function getGamesData() {
  try {
    if (fs.existsSync(gamesDataPath)) {
      const data = fs.readFileSync(gamesDataPath, 'utf8');
      return JSON.parse(data);
    }
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {}, equipment: {}, hunts: {}, experience: {}, chatExp: {} };
  } catch (error) {
    console.error('读取游戏数据失败:', error);
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {}, equipment: {}, hunts: {}, experience: {}, chatExp: {} };
  }
}

// 保存游戏数据
function saveGamesData(data) {
  try {
    const dirPath = path.dirname(gamesDataPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(gamesDataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存游戏数据失败:', error);
    return false;
  }
}

// 获取用户经验值和等级
function getUserExperience(userId) {
  const gamesData = getGamesData();
  
  // 确保经验值数据存在
  if (!gamesData.experience) {
    gamesData.experience = {};
  }
  
  if (!gamesData.experience[userId]) {
    gamesData.experience[userId] = {
      exp: 0,
      level: 1,
      chatExpToday: 0,
      lastChatExpDate: ''
    };
    
    // 保存数据
    saveGamesData(gamesData);
  }
  
  return gamesData.experience[userId];
}

// 计算等级
function calculateLevel(exp) {
  // 每10000点经验升一级，最高100级
  const level = Math.min(100, Math.floor(exp / 10000) + 1);
  return level;
}

// 获取下一级所需经验
function getNextLevelExp(level) {
  return level * 10000;
}

// 获取用户装备
function getUserEquipment(userId) {
  const gamesData = getGamesData();
  
  // 确保装备数据存在
  if (!gamesData.equipment) {
    gamesData.equipment = {};
  }
  
  if (!gamesData.equipment[userId]) {
    gamesData.equipment[userId] = {
      equipped: {
        weapon: null,
        shield: null,
        helmet: null,
        armor: null,
        gloves: null,
        boots: null
      },
      inventory: []
    };
    
    // 保存数据
    saveGamesData(gamesData);
  }
  
  return gamesData.equipment[userId];
}

// 获取装备颜色代码
function getColorCode(rarity) {
  switch (rarity) {
    case 'common':
      return '#FFFFFF'; // 白色
    case 'uncommon':
      return '#1EFF00'; // 绿色
    case 'rare':
      return '#0070DD'; // 蓝色
    case 'epic':
      return '#A335EE'; // 紫色
    case 'legendary':
      return '#FF8000'; // 橙色
    default:
      return '#FFFFFF'; // 默认白色
  }
}

// 获取装备稀有度文本
function getRarityText(rarity) {
  switch (rarity) {
    case 'common':
      return '普通';
    case 'uncommon':
      return '优秀';
    case 'rare':
      return '稀有';
    case 'epic':
      return '史诗';
    case 'legendary':
      return '传说';
    default:
      return '未知';
  }
}

// 获取装备类型文本
function getTypeText(type) {
  switch (type) {
    case 'weapon':
      return '武器';
    case 'shield':
      return '盾牌';
    case 'helmet':
      return '头盔';
    case 'armor':
      return '护甲';
    case 'gloves':
      return '手套';
    case 'boots':
      return '靴子';
    default:
      return '未知';
  }
}

// 计算用户战斗属性
function calculateUserStats(userId) {
  const userEquipment = getUserEquipment(userId);
  let stats = {
    attack: 10, // 基础攻击力
    defense: 5, // 基础防御力
    hp: 1000, // 基础血量
    agility: 5, // 基础敏捷
    accuracy: 70, // 基础准确
    critical: 5 // 基础暴击率
  };
  
  // 遍历所有已装备的物品
  for (const type in userEquipment.equipped) {
    const item = userEquipment.equipped[type];
    if (item && item.stats) {
      if (item.stats.attack) stats.attack += item.stats.attack;
      if (item.stats.defense) stats.defense += item.stats.defense;
      if (item.stats.hp) stats.hp += item.stats.hp;
      if (item.stats.agility) stats.agility += item.stats.agility;
      if (item.stats.accuracy) stats.accuracy += item.stats.accuracy;
      if (item.stats.critical) stats.critical += item.stats.critical;
    }
  }
  
  return stats;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('查看等级和经验值')
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('查看你的等级和经验值'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('查看你的战斗属性')),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    
    if (subcommand === 'info') {
      // 获取用户经验值和等级
      const userExp = getUserExperience(userId);
      const level = userExp.level;
      const exp = userExp.exp;
      const nextLevelExp = getNextLevelExp(level);
      const expNeeded = nextLevelExp - exp;
      
      // 创建嵌入消息
      const embed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle(`📊 ${interaction.user.username} 的等级信息`)
        .addFields(
          { name: '当前等级', value: `${level} / 100` },
          { name: '当前经验值', value: `${exp} 点` },
          { name: '距离下一级', value: level < 100 ? `还需 ${expNeeded} 点经验` : '已达到最高等级' },
          { name: '今日聊天经验', value: `${userExp.chatExpToday || 0} / 1000 点` }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 添加经验获取方式说明
      embed.addFields({
        name: '经验获取方式',
        value: 
          '1. 聊天: 每条消息 5-10 点经验 (每天限制 1000 点)\n' +
          '2. PVE: 击杀怪物 100-1000 点经验 (每天限制 3 次)\n' +
          '3. PVP: 决斗获胜 100-200 点，失败 10-50 点'
      });
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'stats') {
      // 获取用户经验值和等级
      const userExp = getUserExperience(userId);
      const level = userExp.level;
      
      // 获取用户装备和战斗属性
      const userEquipment = getUserEquipment(userId);
      const stats = calculateUserStats(userId);
      
      // 创建嵌入消息
      const embed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle(`⚔️ ${interaction.user.username} 的战斗属性`)
        .addFields(
          { name: '等级', value: `${level} / 100` },
          { name: '攻击力', value: `${stats.attack}` },
          { name: '防御力', value: `${stats.defense}` },
          { name: '血量', value: `${stats.hp}` },
          { name: '敏捷', value: `${stats.agility}` },
          { name: '准确', value: `${stats.accuracy}` },
          { name: '暴击率', value: `${stats.critical}%` }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 添加已装备的装备信息
      let equippedText = '';
      for (const type in userEquipment.equipped) {
        const item = userEquipment.equipped[type];
        if (item) {
          equippedText += `${getTypeText(type)}: [${getRarityText(item.rarity)}] ${item.name}\n`;
        } else {
          equippedText += `${getTypeText(type)}: 无\n`;
        }
      }
      
      if (equippedText) {
        embed.addFields({ name: '已装备', value: equippedText });
      } else {
        embed.addFields({ name: '已装备', value: '无装备' });
      }
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};