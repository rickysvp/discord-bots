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
    return { users: {}, servers: {}, dailyGames: {}, checkins: {} };
  } catch (error) {
    console.error('读取游戏数据失败:', error);
    return { users: {}, servers: {}, dailyGames: {}, checkins: {} };
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
  }
  
  // 保存数据
  saveGamesData(gamesData);
  
  return gamesData.servers[serverId][userId];
}

// 检查用户是否可以签到
function canUserCheckin(userId) {
  const gamesData = getGamesData();
  
  // 确保checkins对象存在
  if (!gamesData.checkins) {
    gamesData.checkins = {};
  }
  
  // 获取当前时间
  const now = Date.now();
  
  // 如果用户从未签到过，或者上次签到时间已经过去12小时
  if (!gamesData.checkins[userId] || (now - gamesData.checkins[userId]) >= 12 * 60 * 60 * 1000) {
    return {
      canCheckin: true,
      nextCheckinTime: 0
    };
  }
  
  // 计算下次可签到时间
  const nextCheckinTime = gamesData.checkins[userId] + (12 * 60 * 60 * 1000);
  
  return {
    canCheckin: false,
    nextCheckinTime: nextCheckinTime
  };
}

// 记录用户签到
function recordCheckin(userId) {
  const gamesData = getGamesData();
  
  // 确保checkins对象存在
  if (!gamesData.checkins) {
    gamesData.checkins = {};
  }
  
  // 记录当前时间为签到时间
  gamesData.checkins[userId] = Date.now();
  
  // 保存数据
  saveGamesData(gamesData);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkin')
    .setDescription('每12小时签到一次获取 $dMON'),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const serverId = interaction.guildId;
    
    // 检查用户是否可以签到
    const checkinStatus = canUserCheckin(userId);
    
    if (checkinStatus.canCheckin) {
      // 可以签到，给予 $dMON 奖励（80-120的随机数）
      const checkinDMON = Math.floor(Math.random() * 41) + 80; // 80-120的随机数
      
      // 更新用户 $dMON
      const userData = updateUserServerDMON(userId, serverId, checkinDMON);
      
      // 记录签到
      recordCheckin(userId);
      
      // 创建签到成功的嵌入消息
      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ 签到成功')
        .setDescription(`恭喜你完成了签到！`)
        .addFields(
          { name: '获得 $dMON', value: `${checkinDMON} $dMON` },
          { name: '当前余额', value: `${userData.dmon} $dMON` },
          { name: '下次签到', value: '12小时后' }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      await interaction.reply({ embeds: [successEmbed] });
    } else {
      // 不能签到，显示剩余时间
      const remainingTime = checkinStatus.nextCheckinTime - Date.now();
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      
      // 创建签到失败的嵌入消息
      const failureEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ 签到失败')
        .setDescription(`你已经签到过了，需要等待才能再次签到。`)
        .addFields(
          { name: '剩余时间', value: `${hours}小时${minutes}分钟` },
          { name: '当前余额', value: `${getUserServerDMON(userId, serverId).dmon} $dMON` }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      await interaction.reply({ embeds: [failureEmbed], flags: 64 });
    }
  },
};
