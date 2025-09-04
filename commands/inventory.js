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

// 计算装备回收价格
function calculateSellPrice(item) {
  const rarityMultiplier = {
    'common': 1,
    'uncommon': 2,
    'rare': 5,
    'epic': 10,
    'legendary': 20
  };
  
  // 基础价格10-100，根据稀有度调整
  const basePrice = Math.floor(Math.random() * 91) + 10;
  const multiplier = rarityMultiplier[item.rarity] || 1;
  
  return basePrice * multiplier;
}

// 从用户背包中移除装备
function removeItemFromInventory(userId, inventoryIndex) {
  const gamesData = getGamesData();
  
  if (!gamesData.equipment || !gamesData.equipment[userId] || !gamesData.equipment[userId].inventory) {
    return { success: false, message: '找不到用户背包' };
  }
  
  if (inventoryIndex < 0 || inventoryIndex >= gamesData.equipment[userId].inventory.length) {
    return { success: false, message: '无效的背包索引' };
  }
  
  // 获取要移除的装备
  const removedItem = gamesData.equipment[userId].inventory[inventoryIndex];
  
  // 从背包中移除装备
  gamesData.equipment[userId].inventory.splice(inventoryIndex, 1);
  
  // 保存数据
  saveGamesData(gamesData);
  
  return { success: true, item: removedItem };
}

// 添加装备到用户背包
function addItemToInventory(userId, item) {
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
  }
  
  // 检查背包是否已满
  if (gamesData.equipment[userId].inventory.length >= 12) {
    return { success: false, message: '背包已满（最多12个物品）' };
  }
  
  // 添加装备到背包
  gamesData.equipment[userId].inventory.push(item);
  
  // 保存数据
  saveGamesData(gamesData);
  
  return { success: true, message: `成功将 ${item.name} 添加到背包` };
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('管理你的背包和装备')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('查看你的背包'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('sell')
        .setDescription('出售背包中的装备')
        .addIntegerOption(option =>
          option.setName('index')
            .setDescription('要出售的装备索引')
            .setRequired(true)
            .setMinValue(0)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('gift')
        .setDescription('赠送背包中的装备给其他用户')
        .addIntegerOption(option =>
          option.setName('index')
            .setDescription('要赠送的装备索引')
            .setRequired(true)
            .setMinValue(0))
        .addUserOption(option =>
          option.setName('user')
            .setDescription('要赠送给的用户')
            .setRequired(true))),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const serverId = interaction.guildId;
    
    if (subcommand === 'view') {
      // 获取用户装备
      const userEquipment = getUserEquipment(userId);
      
      // 创建嵌入消息
      const embed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle(`🎒 ${interaction.user.username} 的背包`)
        .setDescription(`背包容量: ${userEquipment.inventory.length}/12`)
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 添加背包中的装备
      if (userEquipment.inventory.length > 0) {
        for (let i = 0; i < userEquipment.inventory.length; i++) {
          const item = userEquipment.inventory[i];
          let statsText = '';
          
          if (item.stats) {
            if (item.stats.attack) statsText += `攻击: +${item.stats.attack} `;
            if (item.stats.defense) statsText += `防御: +${item.stats.defense} `;
            if (item.stats.hp) statsText += `血量: +${item.stats.hp} `;
            if (item.stats.agility) statsText += `敏捷: +${item.stats.agility} `;
            if (item.stats.accuracy) statsText += `准确: +${item.stats.accuracy} `;
            if (item.stats.critical) statsText += `暴击率: +${item.stats.critical}% `;
          }
          
          // 计算出售价格
          const sellPrice = calculateSellPrice(item);
          
          embed.addFields({
            name: `[${i}] [${getRarityText(item.rarity)}] ${item.name} (${getTypeText(item.type)})`,
            value: `属性: ${statsText}\n出售价格: ${sellPrice} $dMON`
          });
        }
      } else {
        embed.addFields({ name: '空背包', value: '你的背包中没有装备' });
      }
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'sell') {
      const inventoryIndex = interaction.options.getInteger('index');
      
      // 获取用户装备
      const userEquipment = getUserEquipment(userId);
      
      // 检查索引是否有效
      if (inventoryIndex < 0 || inventoryIndex >= userEquipment.inventory.length) {
        return interaction.reply({
          content: '无效的背包索引，请使用 `/inventory view` 查看你的背包',
          flags: 64
        });
      }
      
      // 获取要出售的装备
      const item = userEquipment.inventory[inventoryIndex];
      
      // 计算出售价格
      const sellPrice = calculateSellPrice(item);
      
      // 从背包中移除装备
      const result = removeItemFromInventory(userId, inventoryIndex);
      
      if (!result.success) {
        return interaction.reply({
          content: `出售失败: ${result.message}`,
          flags: 64
        });
      }
      
      // 增加用户 $dMON
      updateUserServerDMON(userId, serverId, sellPrice);
      
      // 创建出售成功的嵌入消息
      const embed = new EmbedBuilder()
        .setColor(getColorCode(item.rarity))
        .setTitle('💰 出售成功')
        .setDescription(`你成功出售了 [${getRarityText(item.rarity)}] ${item.name}！`)
        .addFields(
          { name: '获得 $dMON', value: `+${sellPrice} $dMON` },
          { name: '装备类型', value: getTypeText(item.type) }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'gift') {
      const inventoryIndex = interaction.options.getInteger('index');
      const targetUser = interaction.options.getUser('user');
      
      // 检查目标用户是否为机器人自己
      if (targetUser.id === interaction.client.user.id) {
        return interaction.reply({
          content: '你不能赠送装备给机器人',
          flags: 64
        });
      }
      
      // 检查目标用户是否为自己
      if (targetUser.id === userId) {
        return interaction.reply({
          content: '你不能赠送装备给自己',
          flags: 64
        });
      }
      
      // 获取用户装备
      const userEquipment = getUserEquipment(userId);
      
      // 检查索引是否有效
      if (inventoryIndex < 0 || inventoryIndex >= userEquipment.inventory.length) {
        return interaction.reply({
          content: '无效的背包索引，请使用 `/inventory view` 查看你的背包',
          flags: 64
        });
      }
      
      // 获取要赠送的装备
      const item = userEquipment.inventory[inventoryIndex];
      
      // 检查目标用户的背包是否已满
      const targetEquipment = getUserEquipment(targetUser.id);
      
      if (targetEquipment.inventory.length >= 12) {
        return interaction.reply({
          content: `${targetUser.username} 的背包已满，无法接收装备`,
          flags: 64
        });
      }
      
      // 从背包中移除装备
      const removeResult = removeItemFromInventory(userId, inventoryIndex);
      
      if (!removeResult.success) {
        return interaction.reply({
          content: `赠送失败: ${removeResult.message}`,
          flags: 64
        });
      }
      
      // 添加装备到目标用户的背包
      const addResult = addItemToInventory(targetUser.id, item);
      
      if (!addResult.success) {
        // 如果添加失败，将装备放回原用户的背包
        addItemToInventory(userId, item);
        
        return interaction.reply({
          content: `赠送失败: ${addResult.message}`,
          flags: 64
        });
      }
      
      // 创建赠送成功的嵌入消息
      const embed = new EmbedBuilder()
        .setColor(getColorCode(item.rarity))
        .setTitle('🎁 赠送成功')
        .setDescription(`你成功将 [${getRarityText(item.rarity)}] ${item.name} 赠送给了 ${targetUser.username}！`)
        .addFields(
          { name: '装备类型', value: getTypeText(item.type) },
          { name: '接收者', value: targetUser.username }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};