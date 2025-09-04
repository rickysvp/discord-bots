const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 数据文件路径
const dataPath = path.join(__dirname, '..', 'data', 'games.json');

// 读取游戏数据
function getGamesData() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {} };
  } catch (error) {
    console.error('读取游戏数据失败:', error);
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {} };
  }
}

// 保存游戏数据
function saveGamesData(data) {
  try {
    const dirPath = path.dirname(dataPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存游戏数据失败:', error);
    return false;
  }
}

// 获取用户在特定服务器的 $dMON
function getUserServerDMON(userId, serverId) {
  const gamesData = getGamesData();
  
  // 确保服务器数据存在
  if (!gamesData.servers[serverId]) {
    gamesData.servers[serverId] = {};
  }
  
  // 确保用户在该服务器的数据存在
  if (!gamesData.servers[serverId][userId]) {
    gamesData.servers[serverId][userId] = {
      dmon: 0,
      totalGames: 0,
      wins: 0,
      losses: 0
    };
    
    // 保存数据
    saveGamesData(gamesData);
  }
  
  return gamesData.servers[serverId][userId];
}

// 更新用户在特定服务器的 $dMON
function updateUserServerDMON(userId, serverId, dmonChange) {
  const gamesData = getGamesData();
  
  // 确保服务器数据存在
  if (!gamesData.servers[serverId]) {
    gamesData.servers[serverId] = {};
  }
  
  // 确保用户在该服务器的数据存在
  if (!gamesData.servers[serverId][userId]) {
    gamesData.servers[serverId][userId] = {
      dmon: dmonChange,
      totalGames: 0,
      wins: 0,
      losses: 0
    };
  } else {
    gamesData.servers[serverId][userId].dmon += dmonChange;
    // 确保 dmon 不会小于 0
    if (gamesData.servers[serverId][userId].dmon < 0) {
      gamesData.servers[serverId][userId].dmon = 0;
    }
  }
  
  // 保存数据
  saveGamesData(gamesData);
  
  return gamesData.servers[serverId][userId];
}

// 检查用户今日决斗次数
function checkDailyDuels(userId, serverId, type) {
  const gamesData = getGamesData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 确保决斗数据存在
  if (!gamesData.duels) {
    gamesData.duels = {};
  }
  
  if (!gamesData.duels[today]) {
    gamesData.duels[today] = {};
  }
  
  if (!gamesData.duels[today][serverId]) {
    gamesData.duels[today][serverId] = {};
  }
  
  if (!gamesData.duels[today][serverId][userId]) {
    gamesData.duels[today][serverId][userId] = {
      initiated: 0,
      received: 0
    };
  }
  
  const duelData = gamesData.duels[today][serverId][userId];
  
  if (type === 'initiated') {
    return {
      count: duelData.initiated,
      remaining: 3 - duelData.initiated,
      limit: 3
    };
  } else if (type === 'received') {
    return {
      count: duelData.received,
      remaining: 3 - duelData.received,
      limit: 3
    };
  }
  
  return {
    initiated: {
      count: duelData.initiated,
      remaining: 3 - duelData.initiated,
      limit: 3
    },
    received: {
      count: duelData.received,
      remaining: 3 - duelData.received,
      limit: 3
    }
  };
}

// 增加用户今日决斗次数
function incrementDailyDuels(userId, serverId, type) {
  const gamesData = getGamesData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 确保决斗数据存在
  if (!gamesData.duels) {
    gamesData.duels = {};
  }
  
  if (!gamesData.duels[today]) {
    gamesData.duels[today] = {};
  }
  
  if (!gamesData.duels[today][serverId]) {
    gamesData.duels[today][serverId] = {};
  }
  
  if (!gamesData.duels[today][serverId][userId]) {
    gamesData.duels[today][serverId][userId] = {
      initiated: 0,
      received: 0
    };
  }
  
  if (type === 'initiated') {
    gamesData.duels[today][serverId][userId].initiated += 1;
  } else if (type === 'received') {
    gamesData.duels[today][serverId][userId].received += 1;
  }
  
  // 保存数据
  saveGamesData(gamesData);
  
  return checkDailyDuels(userId, serverId, type);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duel')
    .setDescription('向其他用户发起决斗')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('你想要挑战的用户')
        .setRequired(true)),
  
  async execute(interaction) {
    const challenger = interaction.user;
    const target = interaction.options.getUser('target');
    const serverId = interaction.guildId;
    
    // 检查是否自己挑战自己
    if (challenger.id === target.id) {
      return interaction.reply({
        content: '你不能向自己发起决斗！',
        flags: 64
      });
    }
    
    // 检查目标是否是机器人
    if (target.bot) {
      return interaction.reply({
        content: '你不能向机器人发起决斗！',
        flags: 64
      });
    }
    
    // 检查挑战者今日发起决斗次数
    const challengerDuels = checkDailyDuels(challenger.id, serverId, 'initiated');
    
    if (challengerDuels.remaining <= 0) {
      return interaction.reply({
        content: `你今天已经发起了 ${challengerDuels.limit} 次决斗，请明天再来！`,
        flags: 64
      });
    }
    
    // 检查目标今日被决斗次数
    const targetDuels = checkDailyDuels(target.id, serverId, 'received');
    
    if (targetDuels.remaining <= 0) {
      return interaction.reply({
        content: `${target.username} 今天已经被决斗了 ${targetDuels.limit} 次，请明天再来！`,
        flags: 64
      });
    }
    
    // 获取双方的 $dMON
    const challengerData = getUserServerDMON(challenger.id, serverId);
    const targetData = getUserServerDMON(target.id, serverId);
    
    // 创建决斗开始的嵌入消息
    const duelStartEmbed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('⚔️ 决斗挑战')
      .setDescription(`${challenger.username} 向 ${target.username} 发起了决斗！\n决斗将在 5 秒后开始...`)
      .addFields(
        { name: `${challenger.username} 的 $dMON`, value: `${challengerData.dmon} $dMON` },
        { name: `${target.username} 的 $dMON`, value: `${targetData.dmon} $dMON` }
      )
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    // 回复决斗开始消息
    await interaction.reply({ embeds: [duelStartEmbed] });
    
    // 增加双方的决斗次数
    incrementDailyDuels(challenger.id, serverId, 'initiated');
    incrementDailyDuels(target.id, serverId, 'received');
    
    // 等待 5 秒
    setTimeout(async () => {
      // 随机决定胜利者
      const challengerWins = Math.random() < 0.5;
      
      let dmonChange = 0;
      let challengerChange = 0;
      let targetChange = 0;
      
      if (challengerWins) {
        // 挑战者获胜
        if (Math.random() < 0.5) {
          // 50% 概率抢走对方 0-150 dmon
          if (targetData.dmon >= 100) {
            dmonChange = Math.floor(Math.random() * 151); // 0-150
            challengerChange = dmonChange;
            targetChange = -dmonChange;
          } else {
            dmonChange = 0;
            challengerChange = 0;
            targetChange = 0;
          }
        } else {
          dmonChange = 0;
          challengerChange = 0;
          targetChange = 0;
        }
      } else {
        // 目标获胜
        if (Math.random() < 0.5) {
          // 50% 概率抢走挑战者 0-200 dmon
          dmonChange = Math.floor(Math.random() * 201); // 0-200
          challengerChange = -dmonChange;
          targetChange = dmonChange;
        } else {
          dmonChange = 0;
          challengerChange = 0;
          targetChange = 0;
        }
      }
      
      // 更新双方的 $dMON
      const updatedChallengerData = updateUserServerDMON(challenger.id, serverId, challengerChange);
      const updatedTargetData = updateUserServerDMON(target.id, serverId, targetChange);
      
      // 创建决斗结果的嵌入消息
      const duelResultEmbed = new EmbedBuilder()
        .setColor(challengerWins ? '#00ff00' : '#ff0000')
        .setTitle(`⚔️ 决斗结果 - ${challengerWins ? `${challenger.username} 获胜！` : `${target.username} 获胜！`}`)
        .setDescription(`${challenger.username} 和 ${target.username} 的决斗结束了！`)
        .addFields(
          { name: '胜利者', value: challengerWins ? challenger.username : target.username },
          { name: '战利品', value: dmonChange > 0 ? `${dmonChange} $dMON` : '无' },
          { name: `${challenger.username} 的 $dMON 变化`, value: `${challengerChange >= 0 ? '+' : ''}${challengerChange} $dMON (当前: ${updatedChallengerData.dmon} $dMON)` },
          { name: `${target.username} 的 $dMON 变化`, value: `${targetChange >= 0 ? '+' : ''}${targetChange} $dMON (当前: ${updatedTargetData.dmon} $dMON)` }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 回复决斗结果消息
      await interaction.followUp({ embeds: [duelResultEmbed] });
    }, 5000); // 5秒后执行
  },
};