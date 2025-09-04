const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 数据文件路径
const gamesDataPath = path.join(__dirname, '..', 'data', 'games.json');
const rolesDataPath = path.join(__dirname, '..', 'data', 'roles.json');

// 读取游戏数据
function getGamesData() {
  try {
    if (fs.existsSync(gamesDataPath)) {
      const data = fs.readFileSync(gamesDataPath, 'utf8');
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

// 读取角色数据
function getRolesData() {
  try {
    if (fs.existsSync(rolesDataPath)) {
      const data = fs.readFileSync(rolesDataPath, 'utf8');
      return JSON.parse(data);
    }
    return { roles: {}, pendingRoles: {} };
  } catch (error) {
    console.error('读取角色数据失败:', error);
    return { roles: {}, pendingRoles: {} };
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
function updateUserServerDMON(userId, serverId, dmonChange, isWin = null) {
  const gamesData = getGamesData();
  
  // 确保服务器数据存在
  if (!gamesData.servers[serverId]) {
    gamesData.servers[serverId] = {};
  }
  
  // 确保用户在该服务器的数据存在
  if (!gamesData.servers[serverId][userId]) {
    gamesData.servers[serverId][userId] = {
      dmon: dmonChange,
      totalGames: isWin !== null ? 1 : 0,
      wins: isWin === true ? 1 : 0,
      losses: isWin === false ? 1 : 0
    };
  } else {
    gamesData.servers[serverId][userId].dmon += dmonChange;
    
    if (isWin !== null) {
      gamesData.servers[serverId][userId].totalGames += 1;
      
      if (isWin) {
        gamesData.servers[serverId][userId].wins += 1;
      } else {
        gamesData.servers[serverId][userId].losses += 1;
      }
    }
  }
  
  // 保存数据
  saveGamesData(gamesData);
  
  return gamesData.servers[serverId][userId];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('$dMON 商店，购买服务器高级角色')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('查看可购买的高级角色列表'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('buy')
        .setDescription('购买高级角色')
        .addStringOption(option =>
          option.setName('role_id')
            .setDescription('角色ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('添加可购买的角色 (仅管理员)')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('要添加的角色')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('price')
            .setDescription('角色价格 ($dMON)')
            .setRequired(true)
            .setMinValue(1))
        .addIntegerOption(option =>
          option.setName('quantity')
            .setDescription('可购买数量 (-1表示无限)')
            .setRequired(false)
            .setMinValue(-1))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('角色描述')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('编辑可购买的角色 (仅管理员)')
        .addStringOption(option =>
          option.setName('role_id')
            .setDescription('角色ID')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('price')
            .setDescription('新的角色价格 ($dMON)')
            .setRequired(false)
            .setMinValue(1))
        .addIntegerOption(option =>
          option.setName('quantity')
            .setDescription('新的可购买数量 (-1表示无限)')
            .setRequired(false)
            .setMinValue(-1))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('新的角色描述')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('移除可购买的角色 (仅管理员)')
        .addStringOption(option =>
          option.setName('role_id')
            .setDescription('角色ID')
            .setRequired(true))),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const serverId = interaction.guildId;
    const userId = interaction.user.id;
    
    if (subcommand === 'list') {
      // 获取角色数据
      const rolesData = getRolesData();
      
      // 获取当前服务器的角色
      const serverRoles = rolesData.roles[serverId] || {};
      
      // 获取用户的 $dMON
      const userData = getUserServerDMON(userId, serverId);
      
      // 创建角色列表嵌入消息
      const shopEmbed = new EmbedBuilder()
        .setColor('#9370db')
        .setTitle('🛒 $dMON 商店 - 高级角色')
        .setDescription(`在这里你可以使用 $dMON 购买服务器的高级角色。\n当前余额: ${userData.dmon} $dMON`)
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 添加可购买的角色
      const availableRoles = Object.entries(serverRoles).filter(([roleId, roleData]) => 
        roleData.price && interaction.guild.roles.cache.has(roleId)
      );
      
      if (availableRoles.length > 0) {
        for (const [roleId, roleData] of availableRoles) {
          const role = interaction.guild.roles.cache.get(roleId);
          const quantityText = roleData.quantity === -1 ? 
            '无限' : 
            `${roleData.quantity} 个${roleData.quantity <= 0 ? ' (已售罄)' : ''}`;
          
          // 检查用户是否已拥有该角色
          const alreadyOwned = roleData.purchasedBy && roleData.purchasedBy.includes(userId);
          
          shopEmbed.addFields({
            name: `${role.name} - ${roleData.price} $dMON${alreadyOwned ? ' (已拥有)' : ''}`,
            value: `ID: ${roleId}\n数量: ${quantityText}\n${roleData.description || '无描述'}`
          });
        }
      } else {
        shopEmbed.addFields({
          name: '暂无可购买角色',
          value: '请联系服务器管理员添加可购买的角色。'
        });
      }
      
      await interaction.reply({ embeds: [shopEmbed], flags: 64 });
      
    } else if (subcommand === 'buy') {
      // 获取角色ID
      const roleId = interaction.options.getString('role_id');
      
      // 获取角色数据
      const rolesData = getRolesData();
      
      // 获取当前服务器的角色
      const serverRoles = rolesData.roles[serverId] || {};
      
      // 检查角色是否存在且可购买
      if (!serverRoles[roleId] || !serverRoles[roleId].price) {
        return interaction.reply({ 
          content: '该角色不存在或不可购买。请使用 `/shop list` 查看可购买的角色。', 
          flags: 64 
        });
      }
      
      const roleData = serverRoles[roleId];
      
      // 检查角色数量是否已达上限
      if (roleData.quantity !== -1 && roleData.quantity <= 0) {
        return interaction.reply({ 
          content: `角色 **${roleData.name}** 已售罄。请联系服务器管理员添加更多库存。`, 
          flags: 64 
        });
      }
      
      // 检查用户是否已经拥有该角色
      if (roleData.purchasedBy && roleData.purchasedBy.includes(userId)) {
        return interaction.reply({ 
          content: `你已经拥有角色 **${roleData.name}**。`, 
          flags: 64 
        });
      }
      
      // 获取角色价格
      const rolePrice = roleData.price;
      
      // 获取用户的 $dMON
      const userData = getUserServerDMON(userId, serverId);
      
      // 检查用户是否有足够的 $dMON
      if (userData.dmon < rolePrice) {
        return interaction.reply({ 
          content: `你的 $dMON 不足！当前余额: ${userData.dmon} $dMON，需要: ${rolePrice} $dMON`, 
          flags: 64 
        });
      }
      
      // 检查角色是否存在于服务器中
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) {
        return interaction.reply({ 
          content: '该角色在服务器中不存在。请联系服务器管理员。', 
          flags: 64 
        });
      }
      
      try {
        // 给用户添加角色
        await interaction.member.roles.add(role);
        
        // 扣除用户的 $dMON
        updateUserServerDMON(userId, serverId, -rolePrice);
        
        // 更新角色数据
        if (!roleData.purchasedBy) {
          roleData.purchasedBy = [];
        }
        roleData.purchasedBy.push(userId);
        
        // 如果角色有数量限制，减少数量
        if (roleData.quantity !== -1) {
          roleData.quantity -= 1;
        }
        
        // 保存角色数据
        fs.writeFileSync(rolesDataPath, JSON.stringify(rolesData, null, 2), 'utf8');
        
        // 创建购买成功的嵌入消息
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ 购买成功')
          .setDescription(`你已成功购买角色 **${role.name}**！`)
          .addFields(
            { name: '花费', value: `${rolePrice} $dMON` },
            { name: '当前余额', value: `${userData.dmon - rolePrice} $dMON` }
          )
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        await interaction.reply({ embeds: [successEmbed], flags: 64 });
      } catch (error) {
        console.error('添加角色失败:', error);
        return interaction.reply({ 
          content: '添加角色失败。可能是权限问题，请联系服务器管理员。', 
          flags: 64 
        });
      }
      
    } else if (subcommand === 'add') {
      // 检查用户是否有管理员权限
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '你没有权限添加商店角色。此操作需要管理员权限。', 
          flags: 64 
        });
      }
      
      // 获取角色信息
      const role = interaction.options.getRole('role');
      const price = interaction.options.getInteger('price');
      const quantity = interaction.options.getInteger('quantity') ?? -1; // 默认为无限
      const description = interaction.options.getString('description') || '可在商店购买的高级角色';
      
      // 获取角色数据
      const rolesData = getRolesData();
      
      // 确保服务器数据存在
      if (!rolesData.roles[serverId]) {
        rolesData.roles[serverId] = {};
      }
      
      // 检查角色是否已存在
      if (rolesData.roles[serverId][role.id]) {
        return interaction.reply({ 
          content: `角色 **${role.name}** 已经在商店中。请使用 \`/shop edit\` 命令编辑它。`, 
          flags: 64 
        });
      }
      
      // 添加角色
      rolesData.roles[serverId][role.id] = {
        name: role.name,
        price: price,
        quantity: quantity,
        description: description,
        purchasedBy: [] // 记录购买此角色的用户
      };
      
      // 保存角色数据
      try {
        fs.writeFileSync(rolesDataPath, JSON.stringify(rolesData, null, 2), 'utf8');
        
        // 创建添加成功的嵌入消息
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ 添加成功')
          .setDescription(`已成功将角色 **${role.name}** 添加到商店。`)
          .addFields(
            { name: '价格', value: `${price} $dMON` },
            { name: '数量', value: quantity === -1 ? '无限' : `${quantity}` },
            { name: '描述', value: description }
          )
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        await interaction.reply({ embeds: [successEmbed], flags: 64 });
      } catch (error) {
        console.error('保存角色数据失败:', error);
        return interaction.reply({ 
          content: '添加角色失败。请稍后再试。', 
          flags: 64 
        });
      }
    } else if (subcommand === 'edit') {
      // 检查用户是否有管理员权限
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '你没有权限编辑商店角色。此操作需要管理员权限。', 
          flags: 64 
        });
      }
      
      // 获取角色ID和新信息
      const roleId = interaction.options.getString('role_id');
      const price = interaction.options.getInteger('price');
      const quantity = interaction.options.getInteger('quantity');
      const description = interaction.options.getString('description');
      
      // 获取角色数据
      const rolesData = getRolesData();
      
      // 确保服务器数据存在
      if (!rolesData.roles[serverId]) {
        rolesData.roles[serverId] = {};
      }
      
      // 检查角色是否存在
      if (!rolesData.roles[serverId][roleId]) {
        return interaction.reply({ 
          content: `找不到ID为 ${roleId} 的角色。请使用 \`/shop list\` 查看可用角色。`, 
          flags: 64 
        });
      }
      
      // 获取角色信息
      const roleData = rolesData.roles[serverId][roleId];
      const role = interaction.guild.roles.cache.get(roleId);
      
      if (!role) {
        return interaction.reply({ 
          content: `服务器中不存在ID为 ${roleId} 的角色。该角色可能已被删除。`, 
          flags: 64 
        });
      }
      
      // 更新角色信息
      if (price !== null) {
        roleData.price = price;
      }
      
      if (quantity !== null) {
        roleData.quantity = quantity;
      }
      
      if (description) {
        roleData.description = description;
      }
      
      // 保存角色数据
      try {
        fs.writeFileSync(rolesDataPath, JSON.stringify(rolesData, null, 2), 'utf8');
        
        // 创建编辑成功的嵌入消息
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ 编辑成功')
          .setDescription(`已成功编辑角色 **${role.name}**。`)
          .addFields(
            { name: '价格', value: `${roleData.price} $dMON` },
            { name: '数量', value: roleData.quantity === -1 ? '无限' : `${roleData.quantity}` },
            { name: '描述', value: roleData.description }
          )
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        await interaction.reply({ embeds: [successEmbed], flags: 64 });
      } catch (error) {
        console.error('保存角色数据失败:', error);
        return interaction.reply({ 
          content: '编辑角色失败。请稍后再试。', 
          flags: 64 
        });
      }
    } else if (subcommand === 'remove') {
      // 检查用户是否有管理员权限
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '你没有权限移除商店角色。此操作需要管理员权限。', 
          flags: 64 
        });
      }
      
      // 获取角色ID
      const roleId = interaction.options.getString('role_id');
      
      // 获取角色数据
      const rolesData = getRolesData();
      
      // 确保服务器数据存在
      if (!rolesData.roles[serverId]) {
        rolesData.roles[serverId] = {};
      }
      
      // 检查角色是否存在
      if (!rolesData.roles[serverId][roleId]) {
        return interaction.reply({ 
          content: `找不到ID为 ${roleId} 的角色。请使用 \`/shop list\` 查看可用角色。`, 
          flags: 64 
        });
      }
      
      // 获取角色名称
      const roleName = rolesData.roles[serverId][roleId].name;
      
      // 删除角色
      delete rolesData.roles[serverId][roleId];
      
      // 保存角色数据
      try {
        fs.writeFileSync(rolesDataPath, JSON.stringify(rolesData, null, 2), 'utf8');
        
        // 创建移除成功的嵌入消息
        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ 移除成功')
          .setDescription(`已成功从商店中移除角色 **${roleName}**。`)
          .setTimestamp()
          .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
        
        await interaction.reply({ embeds: [successEmbed], flags: 64 });
      } catch (error) {
        console.error('保存角色数据失败:', error);
        return interaction.reply({ 
          content: '移除角色失败。请稍后再试。', 
          flags: 64 
        });
      }
    }
  },
};