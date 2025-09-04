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
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {}, equipment: {} };
  } catch (error) {
    console.error('读取游戏数据失败:', error);
    return { users: {}, servers: {}, dailyGames: {}, checkins: {}, duels: {}, equipment: {} };
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

// 装备物品
function equipItem(userId, serverId, inventoryIndex) {
  const gamesData = getGamesData();
  
  // 确保装备数据存在
  if (!gamesData.equipment || 
      !gamesData.equipment[serverId] || 
      !gamesData.equipment[serverId][userId]) {
    return { success: false, message: '你没有任何装备' };
  }
  
  const userEquipment = gamesData.equipment[serverId][userId];
  
  // 检查库存索引是否有效
  if (inventoryIndex < 0 || inventoryIndex >= userEquipment.inventory.length) {
    return { success: false, message: '无效的库存索引' };
  }
  
  const item = userEquipment.inventory[inventoryIndex];
  const itemType = item.type;
  
  // 如果已经装备了同类型的物品，将其放回库存
  if (userEquipment.equipped[itemType]) {
    userEquipment.inventory.push(userEquipment.equipped[itemType]);
  }
  
  // 装备新物品
  userEquipment.equipped[itemType] = item;
  
  // 从库存中移除
  userEquipment.inventory.splice(inventoryIndex, 1);
  
  // 保存数据
  saveGamesData(gamesData);
  
  return { success: true, message: `成功装备 ${item.name}`, item: item };
}

// 卸下装备
function unequipItem(userId, serverId, itemType) {
  const gamesData = getGamesData();
  
  // 确保装备数据存在
  if (!gamesData.equipment || 
      !gamesData.equipment[serverId] || 
      !gamesData.equipment[serverId][userId]) {
    return { success: false, message: '你没有任何装备' };
  }
  
  const userEquipment = gamesData.equipment[serverId][userId];
  
  // 检查是否装备了该类型的物品
  if (!userEquipment.equipped[itemType]) {
    return { success: false, message: `你没有装备 ${itemType}` };
  }
  
  const item = userEquipment.equipped[itemType];
  
  // 将物品放回库存
  userEquipment.inventory.push(item);
  
  // 卸下装备
  userEquipment.equipped[itemType] = null;
  
  // 保存数据
  saveGamesData(gamesData);
  
  return { success: true, message: `成功卸下 ${item.name}`, item: item };
}

// 计算装备提供的总 dmonBonus
function calculateEquipmentBonus(userId, serverId) {
  const userEquipment = getUserEquipment(userId, serverId);
  let totalBonus = 0;
  
  // 遍历所有已装备的物品
  for (const type in userEquipment.equipped) {
    const item = userEquipment.equipped[type];
    if (item && item.stats && item.stats.dmonBonus) {
      totalBonus += item.stats.dmonBonus;
    }
  }
  
  return totalBonus;
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
    .setName('equipment')
    .setDescription('装备系统')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('查看你的装备'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('equip')
        .setDescription('装备物品')
        .addIntegerOption(option =>
          option.setName('index')
            .setDescription('库存中的物品索引')
            .setRequired(true)
            .setMinValue(0)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('unequip')
        .setDescription('卸下装备')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('要卸下的装备类型')
            .setRequired(true)
            .addChoices(
              { name: '武器', value: 'weapon' },
              { name: '盾牌', value: 'shield' },
              { name: '头盔', value: 'helmet' },
              { name: '护甲', value: 'armor' },
              { name: '手套', value: 'gloves' },
              { name: '靴子', value: 'boots' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('shop')
        .setDescription('装备商店')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('要查看的装备类型')
            .setRequired(false)
            .addChoices(
              { name: '武器', value: 'weapon' },
              { name: '盾牌', value: 'shield' },
              { name: '头盔', value: 'helmet' },
              { name: '护甲', value: 'armor' },
              { name: '手套', value: 'gloves' },
              { name: '靴子', value: 'boots' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('buy')
        .setDescription('购买装备')
        .addStringOption(option =>
          option.setName('item_id')
            .setDescription('要购买的装备ID')
            .setRequired(true))),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const serverId = interaction.guildId;
    
    if (subcommand === 'list') {
      const userEquipment = getUserEquipment(userId, serverId);
      const equipmentBonus = calculateEquipmentBonus(userId, serverId);
      
      // 创建装备列表嵌入消息
      const equipmentEmbed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle(`${interaction.user.username} 的装备`)
        .setDescription(`装备提供的总 $dMON 奖励: ${equipmentBonus}`)
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 添加已装备的物品
      let equippedText = '';
      for (const type in userEquipment.equipped) {
        const item = userEquipment.equipped[type];
        if (item) {
          const rarityText = getRarityText(item.rarity);
          const typeText = getTypeText(type);
          equippedText += `**${typeText}**: [${rarityText}] ${item.name} (`;
          
          // 添加物品属性
          const stats = [];
          for (const stat in item.stats) {
            if (stat === 'attack') {
              stats.push(`攻击力+${item.stats[stat]}`);
            } else if (stat === 'defense') {
              stats.push(`防御力+${item.stats[stat]}`);
            } else if (stat === 'dmonBonus') {
              stats.push(`$dMON奖励+${item.stats[stat]}`);
            }
          }
          
          equippedText += stats.join(', ') + ')\n';
        } else {
          equippedText += `**${getTypeText(type)}**: 无\n`;
        }
      }
      
      equipmentEmbed.addFields({ name: '已装备', value: equippedText || '无装备' });
      
      // 添加库存物品
      if (userEquipment.inventory.length > 0) {
        let inventoryText = '';
        for (let i = 0; i < userEquipment.inventory.length; i++) {
          const item = userEquipment.inventory[i];
          const rarityText = getRarityText(item.rarity);
          const typeText = getTypeText(item.type);
          
          inventoryText += `**${i}**: [${rarityText}] ${item.name} (${typeText}) (`;
          
          // 添加物品属性
          const stats = [];
          for (const stat in item.stats) {
            if (stat === 'attack') {
              stats.push(`攻击力+${item.stats[stat]}`);
            } else if (stat === 'defense') {
              stats.push(`防御力+${item.stats[stat]}`);
            } else if (stat === 'dmonBonus') {
              stats.push(`$dMON奖励+${item.stats[stat]}`);
            }
          }
          
          inventoryText += stats.join(', ') + ')\n';
        }
        
        equipmentEmbed.addFields({ name: '库存', value: inventoryText });
      } else {
        equipmentEmbed.addFields({ name: '库存', value: '无物品' });
      }
      
      await interaction.reply({ embeds: [equipmentEmbed] });
      
    } else if (subcommand === 'equip') {
      const inventoryIndex = interaction.options.getInteger('index');
      
      // 装备物品
      const result = equipItem(userId, serverId, inventoryIndex);
      
      if (result.success) {
        const equipEmbed = new EmbedBuilder()
          .setColor(getColorCode(result.item.rarity))
          .setTitle('✅ 装备成功')
          .setDescription(`你成功装备了 ${result.item.name}`)
          .addFields(
            { name: '类型', value: getTypeText(result.item.type) },
            { name: '稀有度', value: getRarityText(result.item.rarity) }
          )
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        // 添加物品属性
        let statsText = '';
        for (const stat in result.item.stats) {
          if (stat === 'attack') {
            statsText += `攻击力: +${result.item.stats[stat]}\n`;
          } else if (stat === 'defense') {
            statsText += `防御力: +${result.item.stats[stat]}\n`;
          } else if (stat === 'dmonBonus') {
            statsText += `$dMON奖励: +${result.item.stats[stat]}\n`;
          }
        }
        
        equipEmbed.addFields({ name: '属性', value: statsText });
        
        await interaction.reply({ embeds: [equipEmbed] });
      } else {
        await interaction.reply({ content: result.message, ephemeral: true });
      }
      
    } else if (subcommand === 'unequip') {
      const itemType = interaction.options.getString('type');
      
      // 卸下装备
      const result = unequipItem(userId, serverId, itemType);
      
      if (result.success) {
        const unequipEmbed = new EmbedBuilder()
          .setColor(getColorCode(result.item.rarity))
          .setTitle('✅ 卸下成功')
          .setDescription(`你成功卸下了 ${result.item.name}`)
          .addFields(
            { name: '类型', value: getTypeText(result.item.type) },
            { name: '稀有度', value: getRarityText(result.item.rarity) }
          )
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        await interaction.reply({ embeds: [unequipEmbed] });
      } else {
        await interaction.reply({ content: result.message, ephemeral: true });
      }
      
    } else if (subcommand === 'shop') {
      const equipmentType = interaction.options.getString('type');
      const equipmentData = getEquipmentData();
      const userData = getUserServerDMON(userId, serverId);
      
      // 创建商店嵌入消息
      const shopEmbed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🛒 装备商店')
        .setDescription(`当前余额: ${userData.dmon} $dMON`)
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 过滤装备类型
      let itemsToShow = {};
      if (equipmentType) {
        itemsToShow[equipmentType] = equipmentData.items[equipmentType];
      } else {
        itemsToShow = equipmentData.items;
      }
      
      // 添加商店物品
      for (const type in itemsToShow) {
        let typeText = '';
        for (const itemId in itemsToShow[type]) {
          const item = itemsToShow[type][itemId];
          const rarityText = getRarityText(item.rarity);
          
          typeText += `**${itemId}**: [${rarityText}] ${item.name} - ${item.price} $dMON\n`;
          
          // 添加物品属性
          const stats = [];
          for (const stat in item.stats) {
            if (stat === 'attack') {
              stats.push(`攻击力+${item.stats[stat]}`);
            } else if (stat === 'defense') {
              stats.push(`防御力+${item.stats[stat]}`);
            } else if (stat === 'dmonBonus') {
              stats.push(`$dMON奖励+${item.stats[stat]}`);
            }
          }
          
          typeText += `属性: ${stats.join(', ')}\n`;
          typeText += `描述: ${item.description}\n\n`;
        }
        
        if (typeText) {
          shopEmbed.addFields({ name: getTypeText(type), value: typeText });
        }
      }
      
      await interaction.reply({ embeds: [shopEmbed], ephemeral: true });
      
    } else if (subcommand === 'buy') {
      const itemId = interaction.options.getString('item_id');
      const equipmentData = getEquipmentData();
      const userData = getUserServerDMON(userId, serverId);
      
      // 查找物品
      let itemFound = false;
      let itemType = null;
      let itemData = null;
      
      for (const type in equipmentData.items) {
        if (equipmentData.items[type][itemId]) {
          itemFound = true;
          itemType = type;
          itemData = equipmentData.items[type][itemId];
          break;
        }
      }
      
      if (!itemFound) {
        return interaction.reply({ 
          content: '找不到该装备。请使用 `/equipment shop` 查看可用装备。', 
          ephemeral: true 
        });
      }
      
      // 检查用户是否有足够的 $dMON
      if (userData.dmon < itemData.price) {
        return interaction.reply({ 
          content: `你的 $dMON 不足！当前余额: ${userData.dmon} $dMON，需要: ${itemData.price} $dMON`, 
          ephemeral: true 
        });
      }
      
      // 扣除用户的 $dMON
      updateUserServerDMON(userId, serverId, -itemData.price);
      
      // 添加装备到用户库存
      const result = addEquipmentToInventory(userId, serverId, itemId);
      
      if (result.success) {
        const buyEmbed = new EmbedBuilder()
          .setColor(getColorCode(itemData.rarity))
          .setTitle('✅ 购买成功')
          .setDescription(`你成功购买了 ${itemData.name}！`)
          .addFields(
            { name: '花费', value: `${itemData.price} $dMON` },
            { name: '当前余额', value: `${userData.dmon - itemData.price} $dMON` },
            { name: '类型', value: getTypeText(itemType) },
            { name: '稀有度', value: getRarityText(itemData.rarity) }
          )
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        // 添加物品属性
        let statsText = '';
        for (const stat in itemData.stats) {
          if (stat === 'attack') {
            statsText += `攻击力: +${itemData.stats[stat]}\n`;
          } else if (stat === 'defense') {
            statsText += `防御力: +${itemData.stats[stat]}\n`;
          } else if (stat === 'dmonBonus') {
            statsText += `$dMON奖励: +${itemData.stats[stat]}\n`;
          }
        }
        
        buyEmbed.addFields({ name: '属性', value: statsText });
        
        await interaction.reply({ embeds: [buyEmbed] });
      } else {
        // 如果添加失败，退还 $dMON
        updateUserServerDMON(userId, serverId, itemData.price);
        await interaction.reply({ content: result.message, ephemeral: true });
      }
    }
  },
  
  // 导出函数供其他命令使用
  getUserEquipment,
  calculateEquipmentBonus,
  addEquipmentToInventory
};