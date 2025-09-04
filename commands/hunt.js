const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 数据文件路径
const gamesDataPath = path.join(__dirname, '..', 'data', 'games.json');
const equipmentDataPath = path.join(__dirname, '..', 'data', 'equipment.json');

// 读取游戏数据
function getGamesData() {
  try {
    if (fs.existsSync(gamesDataPath)) {
      const data = fs.readFileSync(gamesDataPath, 'utf8');
      return JSON.parse(data);
    }
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {}, equipment: {}, hunts: {} };
  } catch (error) {
    console.error('读取游戏数据失败:', error);
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {}, equipment: {}, hunts: {} };
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

// 读取装备数据
function getEquipmentData() {
  try {
    if (fs.existsSync(equipmentDataPath)) {
      const data = fs.readFileSync(equipmentDataPath, 'utf8');
      return JSON.parse(data);
    }
    return { items: {}, monsters: {} };
  } catch (error) {
    console.error('读取装备数据失败:', error);
    return { items: {}, monsters: {} };
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

// 检查用户今日狩猎次数
function checkDailyHunts(userId, serverId) {
  const gamesData = getGamesData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 确保狩猎数据存在
  if (!gamesData.hunts) {
    gamesData.hunts = {};
  }
  
  if (!gamesData.hunts[today]) {
    gamesData.hunts[today] = {};
  }
  
  if (!gamesData.hunts[today][serverId]) {
    gamesData.hunts[today][serverId] = {};
  }
  
  if (!gamesData.hunts[today][serverId][userId]) {
    gamesData.hunts[today][serverId][userId] = 0;
  }
  
  return {
    count: gamesData.hunts[today][serverId][userId],
    remaining: 10 - gamesData.hunts[today][serverId][userId],
    limit: 10
  };
}

// 增加用户今日狩猎次数
function incrementDailyHunts(userId, serverId) {
  const gamesData = getGamesData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 确保狩猎数据存在
  if (!gamesData.hunts) {
    gamesData.hunts = {};
  }
  
  if (!gamesData.hunts[today]) {
    gamesData.hunts[today] = {};
  }
  
  if (!gamesData.hunts[today][serverId]) {
    gamesData.hunts[today][serverId] = {};
  }
  
  if (!gamesData.hunts[today][serverId][userId]) {
    gamesData.hunts[today][serverId][userId] = 0;
  }
  
  gamesData.hunts[today][serverId][userId] += 1;
  
  // 保存数据
  saveGamesData(gamesData);
  
  return {
    count: gamesData.hunts[today][serverId][userId],
    remaining: 10 - gamesData.hunts[today][serverId][userId],
    limit: 10
  };
}

// 获取用户装备
function getUserEquipment(userId, serverId) {
  const gamesData = getGamesData();
  
  // 确保装备数据存在
  if (!gamesData.equipment) {
    gamesData.equipment = {};
  }
  
  if (!gamesData.equipment[serverId]) {
    gamesData.equipment[serverId] = {};
  }
  
  if (!gamesData.equipment[serverId][userId]) {
    gamesData.equipment[serverId][userId] = {
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
  
  return gamesData.equipment[serverId][userId];
}

// 计算用户战斗力
function calculateUserPower(userId, serverId) {
  const userEquipment = getUserEquipment(userId, serverId);
  let attack = 10; // 基础攻击力
  let defense = 5; // 基础防御力
  
  // 遍历所有已装备的物品
  for (const type in userEquipment.equipped) {
    const item = userEquipment.equipped[type];
    if (item && item.stats) {
      if (item.stats.attack) {
        attack += item.stats.attack;
      }
      if (item.stats.defense) {
        defense += item.stats.defense;
      }
    }
  }
  
  return { attack, defense };
}

// 添加装备到用户库存
function addEquipmentToInventory(userId, serverId, itemId) {
  const gamesData = getGamesData();
  const equipmentData = getEquipmentData();
  
  // 确保装备数据存在
  if (!gamesData.equipment) {
    gamesData.equipment = {};
  }
  
  if (!gamesData.equipment[serverId]) {
    gamesData.equipment[serverId] = {};
  }
  
  if (!gamesData.equipment[serverId][userId]) {
    gamesData.equipment[serverId][userId] = {
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
  }
  
  // 查找物品类型
  let itemType = null;
  let itemData = null;
  
  for (const type in equipmentData.items) {
    if (equipmentData.items[type][itemId]) {
      itemType = type;
      itemData = equipmentData.items[type][itemId];
      break;
    }
  }
  
  if (!itemType || !itemData) {
    return { success: false, message: '找不到该装备' };
  }
  
  // 添加到库存
  gamesData.equipment[serverId][userId].inventory.push({
    id: itemId,
    type: itemType,
    name: itemData.name,
    rarity: itemData.rarity,
    stats: itemData.stats
  });
  
  // 保存数据
  saveGamesData(gamesData);
  
  return { 
    success: true, 
    message: `成功添加 ${itemData.name} 到库存`, 
    item: {
      id: itemId,
      type: itemType,
      name: itemData.name,
      rarity: itemData.rarity,
      stats: itemData.stats
    }
  };
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hunt')
    .setDescription('狩猎怪物获取装备和 $dMON')
    .addStringOption(option =>
      option.setName('monster')
        .setDescription('要狩猎的怪物')
        .setRequired(true)
        .addChoices(
          { name: '哥布林 (等级 1)', value: 'goblin' },
          { name: '狼 (等级 2)', value: 'wolf' },
          { name: '强盗 (等级 5)', value: 'bandit' },
          { name: '兽人 (等级 10)', value: 'orc' },
          { name: '巨魔 (等级 15)', value: 'troll' },
          { name: '龙 (等级 30)', value: 'dragon' }
        )),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    const serverId = interaction.guildId;
    const monsterType = interaction.options.getString('monster');
    
    // 检查今日狩猎次数
    const hunts = checkDailyHunts(userId, serverId);
    
    if (hunts.remaining <= 0) {
      return interaction.reply({ 
        content: `你今天已经狩猎了 ${hunts.limit} 次，请明天再来！`, 
        ephemeral: true 
      });
    }
    
    // 获取怪物数据
    const equipmentData = getEquipmentData();
    const monster = equipmentData.monsters[monsterType];
    
    if (!monster) {
      return interaction.reply({ 
        content: '找不到该怪物。', 
        ephemeral: true 
      });
    }
    
    // 计算用户战斗力
    const userPower = calculateUserPower(userId, serverId);
    
    // 创建狩猎开始的嵌入消息
    const huntStartEmbed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`🏹 狩猎 ${monster.name}`)
      .setDescription(`${interaction.user.username} 正在狩猎 ${monster.name}！\n战斗将在 3 秒后开始...`)
      .addFields(
        { name: '怪物信息', value: 
          `等级: ${monster.level}\n` +
          `生命值: ${monster.hp}\n` +
          `攻击力: ${monster.attack}\n` +
          `防御力: ${monster.defense}`
        },
        { name: '你的战斗力', value: 
          `攻击力: ${userPower.attack}\n` +
          `防御力: ${userPower.defense}`
        }
      )
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    // 回复狩猎开始消息
    await interaction.reply({ embeds: [huntStartEmbed] });
    
    // 增加今日狩猎次数
    incrementDailyHunts(userId, serverId);
    
    // 等待 3 秒
    setTimeout(async () => {
      // 计算战斗结果
      let userHp = 100 + userPower.defense * 2;
      let monsterHp = monster.hp;
      let rounds = 0;
      let battleLog = [];
      
      while (userHp > 0 && monsterHp > 0 && rounds < 20) {
        rounds++;
        
        // 用户攻击
        const userDamage = Math.max(1, userPower.attack - monster.defense / 2);
        monsterHp -= userDamage;
        battleLog.push(`回合 ${rounds}: ${interaction.user.username} 对 ${monster.name} 造成 ${userDamage} 点伤害！`);
        
        if (monsterHp <= 0) break;
        
        // 怪物攻击
        const monsterDamage = Math.max(1, monster.attack - userPower.defense / 2);
        userHp -= monsterDamage;
        battleLog.push(`回合 ${rounds}: ${monster.name} 对 ${interaction.user.username} 造成 ${monsterDamage} 点伤害！`);
      }
      
      const userWins = monsterHp <= 0;
      
      // 创建战斗日志嵌入消息
      const battleLogEmbed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle(`⚔️ 战斗日志 - ${userWins ? '胜利！' : '失败！'}`)
        .setDescription(battleLog.join('\n'))
        .addFields(
          { name: '最终状态', value: 
            `${interaction.user.username}: ${Math.max(0, userHp)} HP\n` +
            `${monster.name}: ${Math.max(0, monsterHp)} HP`
          }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 回复战斗日志消息
      await interaction.followUp({ embeds: [battleLogEmbed] });
      
      // 处理战斗结果
      if (userWins) {
        // 计算 $dMON 奖励
        const dmonReward = Math.floor(Math.random() * (monster.dmonReward.max - monster.dmonReward.min + 1)) + monster.dmonReward.min;
        
        // 更新用户 $dMON
        updateUserServerDMON(userId, serverId, dmonReward);
        
        // 检查是否掉落装备
        let droppedItem = null;
        if (Math.random() < monster.dropChance) {
          // 随机选择一个可能的掉落物
          const possibleDrops = monster.possibleDrops;
          const randomItemId = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
          
          // 添加装备到用户库存
          const result = addEquipmentToInventory(userId, serverId, randomItemId);
          
          if (result.success) {
            droppedItem = result.item;
          }
        }
        
        // 创建战利品嵌入消息
        const lootEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎁 战利品')
          .setDescription(`恭喜你击败了 ${monster.name}！`)
          .addFields(
            { name: '$dMON 奖励', value: `+${dmonReward} $dMON` }
          )
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        if (droppedItem) {
          lootEmbed.addFields({
            name: '获得装备',
            value: `[${getRarityText(droppedItem.rarity)}] ${droppedItem.name}`
          });
        } else {
          lootEmbed.addFields({
            name: '获得装备',
            value: '无'
          });
        }
        
        // 回复战利品消息
        await interaction.followUp({ embeds: [lootEmbed] });
      } else {
        // 创建失败消息
        const failEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ 狩猎失败')
          .setDescription(`你被 ${monster.name} 击败了！`)
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        // 回复失败消息
        await interaction.followUp({ embeds: [failEmbed] });
      }
    }, 3000); // 3秒后执行
  }
};