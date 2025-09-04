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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equipment-shop')
    .setDescription('装备商店')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('查看可购买的装备')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('装备类型')
            .setRequired(false)
            .addChoices(
              { name: '武器', value: 'weapon' },
              { name: '盾牌', value: 'shield' },
              { name: '头盔', value: 'helmet' },
              { name: '护甲', value: 'armor' },
              { name: '手套', value: 'gloves' },
              { name: '靴子', value: 'boots' }
            ))
        .addStringOption(option =>
          option.setName('rarity')
            .setDescription('装备稀有度')
            .setRequired(false)
            .addChoices(
              { name: '普通', value: 'common' },
              { name: '优秀', value: 'uncommon' },
              { name: '稀有', value: 'rare' },
              { name: '史诗', value: 'epic' },
              { name: '传说', value: 'legendary' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('buy')
        .setDescription('购买装备')
        .addStringOption(option =>
          option.setName('item_id')
            .setDescription('装备ID')
            .setRequired(true))),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const serverId = interaction.guildId;
    
    if (subcommand === 'list') {
      const typeFilter = interaction.options.getString('type');
      const rarityFilter = interaction.options.getString('rarity');
      
      const equipmentData = getEquipmentData();
      let availableItems = [];
      
      // 遍历所有装备类型
      for (const type in equipmentData.items) {
        // 如果指定了类型过滤器，跳过不匹配的类型
        if (typeFilter && type !== typeFilter) continue;
        
        // 遍历该类型的所有装备
        for (const itemId in equipmentData.items[type]) {
          const item = equipmentData.items[type][itemId];
          
          // 如果指定了稀有度过滤器，跳过不匹配的稀有度
          if (rarityFilter && item.rarity !== rarityFilter) continue;
          
          // 只添加可购买的装备
          if (item.purchasable) {
            availableItems.push({
              id: itemId,
              type: type,
              name: item.name,
              rarity: item.rarity,
              price: item.price,
              stats: item.stats
            });
          }
        }
      }
      
      // 如果没有可购买的装备
      if (availableItems.length === 0) {
        return interaction.reply({
          content: '没有找到符合条件的装备。',
          ephemeral: true
        });
      }
      
      // 按稀有度和价格排序
      availableItems.sort((a, b) => {
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        }
        return b.price - a.price;
      });
      
      // 创建嵌入消息
      const embed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle('🛒 装备商店')
        .setDescription('以下是可购买的装备:')
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 获取用户 $dMON
      const userData = getUserServerDMON(userId, serverId);
      embed.addFields({ name: '你的 $dMON', value: `${userData.dmon}` });
      
      // 添加装备信息
      for (const item of availableItems) {
        let statsText = '';
        if (item.stats.attack) statsText += `攻击: +${item.stats.attack} `;
        if (item.stats.defense) statsText += `防御: +${item.stats.defense} `;
        
        embed.addFields({
          name: `[${getRarityText(item.rarity)}] ${item.name} (${getTypeText(item.type)})`,
          value: `ID: ${item.id}\n价格: ${item.price} $dMON\n属性: ${statsText}`
        });
      }
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'buy') {
      const itemId = interaction.options.getString('item_id');
      
      // 获取装备数据
      const equipmentData = getEquipmentData();
      let itemType = null;
      let itemData = null;
      
      // 查找物品
      for (const type in equipmentData.items) {
        if (equipmentData.items[type][itemId]) {
          itemType = type;
          itemData = equipmentData.items[type][itemId];
          break;
        }
      }
      
      // 如果找不到物品
      if (!itemType || !itemData) {
        return interaction.reply({
          content: '找不到该装备。',
          ephemeral: true
        });
      }
      
      // 如果物品不可购买
      if (!itemData.purchasable) {
        return interaction.reply({
          content: '该装备不可购买。',
          ephemeral: true
        });
      }
      
      // 获取用户 $dMON
      const userData = getUserServerDMON(userId, serverId);
      
      // 检查用户是否有足够的 $dMON
      if (userData.dmon < itemData.price) {
        return interaction.reply({
          content: `你没有足够的 $dMON 购买该装备。需要 ${itemData.price} $dMON，你只有 ${userData.dmon} $dMON。`,
          ephemeral: true
        });
      }
      
      // 扣除 $dMON
      updateUserServerDMON(userId, serverId, -itemData.price);
      
      // 添加装备到库存
      const result = addEquipmentToInventory(userId, serverId, itemId);
      
      if (!result.success) {
        // 如果添加失败，退还 $dMON
        updateUserServerDMON(userId, serverId, itemData.price);
        
        return interaction.reply({
          content: `购买失败: ${result.message}`,
          ephemeral: true
        });
      }
      
      // 创建购买成功的嵌入消息
      const embed = new EmbedBuilder()
        .setColor(getColorCode(itemData.rarity))
        .setTitle('🛍️ 购买成功')
        .setDescription(`你成功购买了 [${getRarityText(itemData.rarity)}] ${itemData.name}！`)
        .addFields(
          { name: '花费', value: `${itemData.price} $dMON` },
          { name: '剩余 $dMON', value: `${userData.dmon - itemData.price}` },
          { name: '装备类型', value: getTypeText(itemType) }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 添加装备属性
      let statsText = '';
      if (itemData.stats.attack) statsText += `攻击: +${itemData.stats.attack} `;
      if (itemData.stats.defense) statsText += `防御: +${itemData.stats.defense} `;
      
      embed.addFields({ name: '装备属性', value: statsText || '无' });
      
      return interaction.reply({ embeds: [embed] });
    }
  }
};