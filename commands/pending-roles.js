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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pending-roles')
    .setDescription('查看待审核的高级角色（仅限机器人开发者）'),
  
  async execute(interaction) {
    // 检查是否为开发者
    const developerId = process.env.DEVELOPER_ID;
    if (interaction.user.id !== developerId) {
      return interaction.reply({ 
        content: '只有机器人开发者可以使用此命令。', 
        flags: 64 
      });
    }
    
    // 读取角色数据
    const rolesData = getRolesData();
    const pendingRoles = rolesData.pendingRoles;
    
    // 检查是否有待审核的角色
    if (Object.keys(pendingRoles).length === 0) {
      return interaction.reply({ 
        content: '当前没有待审核的高级角色。', 
        flags: 64 
      });
    }
    
    // 创建嵌入消息
    const pendingEmbed = new EmbedBuilder()
      .setColor('#ffaa00')
      .setTitle('待审核的高级角色')
      .setDescription('以下是等待审核的高级角色列表。使用 `/review-role` 命令进行审核。')
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    // 添加待审核角色信息
    let count = 0;
    for (const serverId in pendingRoles) {
      for (const roleId in pendingRoles[serverId]) {
        const roleInfo = pendingRoles[serverId][roleId];
        count++;
        
        pendingEmbed.addFields({
          name: `${count}. ${roleInfo.serverName} - ${roleInfo.roleName}`,
          value: `服务器ID: \`${serverId}\`\n角色ID: \`${roleId}\`\n描述: ${roleInfo.description}\n提交时间: ${new Date(roleInfo.submittedAt).toLocaleString()}`
        });
      }
    }
    
    // 添加使用说明
    pendingEmbed.addFields({
      name: '如何审核',
      value: '使用 `/review-role server-id:服务器ID role-id:角色ID action:approve/reject reason:原因` 命令进行审核'
    });
    
    await interaction.reply({ embeds: [pendingEmbed], flags: 64 });
  },
};