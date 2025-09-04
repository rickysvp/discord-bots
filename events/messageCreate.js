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
  }
  
  return gamesData.experience[userId];
}

// 更新用户经验值
function updateUserExperience(userId, expGain) {
  const gamesData = getGamesData();
  
  // 确保经验值数据存在
  if (!gamesData.experience) {
    gamesData.experience = {};
  }
  
  if (!gamesData.experience[userId]) {
    gamesData.experience[userId] = {
      exp: expGain,
      level: 1,
      chatExpToday: 0,
      lastChatExpDate: ''
    };
  } else {
    gamesData.experience[userId].exp += expGain;
  }
  
  // 计算新等级
  const newLevel = Math.min(100, Math.floor(gamesData.experience[userId].exp / 10000) + 1);
  const oldLevel = gamesData.experience[userId].level;
  
  // 更新等级
  gamesData.experience[userId].level = newLevel;
  
  // 保存数据
  saveGamesData(gamesData);
  
  return {
    exp: gamesData.experience[userId].exp,
    level: newLevel,
    levelUp: newLevel > oldLevel
  };
}

// 更新用户聊天经验值
function updateChatExperience(userId) {
  const gamesData = getGamesData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 确保经验值数据存在
  if (!gamesData.experience) {
    gamesData.experience = {};
  }
  
  if (!gamesData.experience[userId]) {
    gamesData.experience[userId] = {
      exp: 0,
      level: 1,
      chatExpToday: 0,
      lastChatExpDate: today
    };
  }
  
  // 检查是否是新的一天
  if (gamesData.experience[userId].lastChatExpDate !== today) {
    gamesData.experience[userId].chatExpToday = 0;
    gamesData.experience[userId].lastChatExpDate = today;
  }
  
  // 检查是否达到每日上限
  if (gamesData.experience[userId].chatExpToday >= 1000) {
    return {
      success: false,
      reason: 'daily_limit',
      chatExpToday: gamesData.experience[userId].chatExpToday
    };
  }
  
  // 随机生成5-10点经验值
  const expGain = Math.floor(Math.random() * 6) + 5;
  
  // 确保不超过每日上限
  const actualExpGain = Math.min(expGain, 1000 - gamesData.experience[userId].chatExpToday);
  
  // 更新经验值
  gamesData.experience[userId].exp += actualExpGain;
  gamesData.experience[userId].chatExpToday += actualExpGain;
  
  // 计算新等级
  const newLevel = Math.min(100, Math.floor(gamesData.experience[userId].exp / 10000) + 1);
  const oldLevel = gamesData.experience[userId].level;
  
  // 更新等级
  gamesData.experience[userId].level = newLevel;
  
  // 保存数据
  saveGamesData(gamesData);
  
  return {
    success: true,
    expGain: actualExpGain,
    totalExp: gamesData.experience[userId].exp,
    chatExpToday: gamesData.experience[userId].chatExpToday,
    level: newLevel,
    levelUp: newLevel > oldLevel
  };
}

module.exports = {
  name: 'messageCreate',
  once: false,
  execute(message) {
    // 忽略机器人消息
    if (message.author.bot) return;
    
    // 忽略命令消息
    if (message.content.startsWith('/') || message.content.startsWith('!')) return;
    
    // 更新用户聊天经验值
    const result = updateChatExperience(message.author.id);
    
    // 如果升级了，发送通知
    if (result.success && result.levelUp) {
      message.channel.send(`🎉 恭喜 ${message.author.username} 升级到了 ${result.level} 级！`);
    }
  }
};