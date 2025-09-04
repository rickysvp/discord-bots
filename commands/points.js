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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dmon')
    .setDescription('查看你的 $dMON 余额和游戏统计数据')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('要查看的用户（留空则查看自己）')
        .setRequired(false)),
  
  async execute(interaction) {
    // 获取目标用户（如果未指定则为命令执行者）
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const targetId = targetUser.id;
    const serverId = interaction.guildId;
    
    // 获取用户在当前服务器的 $dMON 数据
    const userData = getUserServerDMON(targetId, serverId);
    
    // 计算胜率
    const winRate = userData.totalGames > 0 
      ? ((userData.wins / userData.totalGames) * 100).toFixed(1) 
      : '0.0';
    
    // 创建嵌入消息
    const dmonEmbed = new EmbedBuilder()
      .setColor('#ffd700') // 金色
      .setTitle(`${targetUser.username} 的 $dMON 余额`)
      .setDescription(`在 ${interaction.guild.name} 服务器`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '当前余额', value: `${userData.dmon} $dMON`, inline: false },
        { name: '游戏统计', value: 
          `总场次: ${userData.totalGames}\n` +
          `胜利: ${userData.wins}\n` +
          `失败: ${userData.losses}\n` +
          `胜率: ${winRate}%`, 
          inline: false 
        }
      )
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    // 回复消息
    await interaction.reply({ embeds: [dmonEmbed], ephemeral: targetUser.id !== interaction.user.id });
  },
};
