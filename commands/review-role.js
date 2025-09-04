const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 数据文件路径
const dataPath = path.join(__dirname, '..', 'data', 'roles.json');

// 读取角色数据
function getRolesData() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return { approvedRoles: {}, pendingRoles: {} };
  } catch (error) {
    console.error('读取角色数据失败:', error);
    return { approvedRoles: {}, pendingRoles: {} };
  }
}

// 保存角色数据
function saveRolesData(data) {
  try {
    const dirPath = path.dirname(dataPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存角色数据失败:', error);
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review-role')
    .setDescription('审核提交的高级角色（仅限机器人开发者）')
    .addStringOption(option => 
      option.setName('server-id')
        .setDescription('服务器ID')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('role-id')
        .setDescription('角色ID')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('action')
        .setDescription('审核操作')
        .setRequired(true)
        .addChoices(
          { name: '批准', value: 'approve' },
          { name: '拒绝', value: 'reject' }
        ))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('批准/拒绝的原因')
        .setRequired(false)),
  
  async execute(interaction) {
    // 检查是否为开发者
    const developerId = process.env.DEVELOPER_ID; // 在 .env 文件中设置开发者ID
    if (interaction.user.id !== developerId) {
      return interaction.reply({ 
        content: '只有机器人开发者可以使用此命令。', 
        flags: 64 
      });
    }
    
    // 获取参数
    const serverId = interaction.options.getString('server-id');
    const roleId = interaction.options.getString('role-id');
    const action = interaction.options.getString('action');
    const reason = interaction.options.getString('reason') || '无原因提供';
    
    // 读取角色数据
    const rolesData = getRolesData();
    
    // 检查角色是否存在
    if (!rolesData.pendingRoles[serverId] || !rolesData.pendingRoles[serverId][roleId]) {
      return interaction.reply({ 
        content: `找不到待审核的角色。服务器ID: ${serverId}, 角色ID: ${roleId}`, 
        flags: 64 
      });
    }
    
    // 获取角色信息
    const roleInfo = rolesData.pendingRoles[serverId][roleId];
    
    if (action === 'approve') {
      // 批准角色
      // 为每个拥有此角色的用户添加到已批准列表
      // 注意：这里需要实际获取拥有此角色的用户列表
      // 在本地测试中，我们模拟一些用户
      const mockUsers = ['123456789012345678', '234567890123456789']; // 模拟的用户ID
      
      for (const userId of mockUsers) {
        if (!rolesData.approvedRoles[userId]) {
          rolesData.approvedRoles[userId] = [];
        }
        
        // 检查是否已经有此角色
        const existingRole = rolesData.approvedRoles[userId].find(
          r => r.serverId === serverId && r.roleId === roleId
        );
        
        if (!existingRole) {
          rolesData.approvedRoles[userId].push({
            roleId: roleInfo.roleId,
            roleName: roleInfo.roleName,
            description: roleInfo.description,
            serverId: roleInfo.serverId,
            serverName: roleInfo.serverName,
            approvedAt: new Date().toISOString()
          });
        }
      }
      
      // 从待审核列表中移除
      delete rolesData.pendingRoles[serverId][roleId];
      if (Object.keys(rolesData.pendingRoles[serverId]).length === 0) {
        delete rolesData.pendingRoles[serverId];
      }
      
      // 保存数据
      if (saveRolesData(rolesData)) {
        const approveEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('高级角色已批准')
          .setDescription(`你已批准服务器 **${roleInfo.serverName}** 中的角色 **${roleInfo.roleName}**。`)
          .addFields(
            { name: '角色名称', value: roleInfo.roleName, inline: true },
            { name: '服务器', value: roleInfo.serverName, inline: true },
            { name: '描述', value: roleInfo.description },
            { name: '批准原因', value: reason }
          )
          .setTimestamp();
        
        await interaction.reply({ embeds: [approveEmbed], flags: 64 });
      } else {
        await interaction.reply({ 
          content: '保存数据时出错，请稍后再试。', 
          flags: 64 
        });
      }
    } else if (action === 'reject') {
      // 拒绝角色
      // 从待审核列表中移除
      delete rolesData.pendingRoles[serverId][roleId];
      if (Object.keys(rolesData.pendingRoles[serverId]).length === 0) {
        delete rolesData.pendingRoles[serverId];
      }
      
      // 保存数据
      if (saveRolesData(rolesData)) {
        const rejectEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('高级角色已拒绝')
          .setDescription(`你已拒绝服务器 **${roleInfo.serverName}** 中的角色 **${roleInfo.roleName}**。`)
          .addFields(
            { name: '角色名称', value: roleInfo.roleName, inline: true },
            { name: '服务器', value: roleInfo.serverName, inline: true },
            { name: '描述', value: roleInfo.description },
            { name: '拒绝原因', value: reason }
          )
          .setTimestamp();
        
        await interaction.reply({ embeds: [rejectEmbed], flags: 64 });
      } else {
        await interaction.reply({ 
          content: '保存数据时出错，请稍后再试。', 
          flags: 64 
        });
      }
    }
  },
};