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
    .setName('profile')
    .setDescription('显示你的个人资料和在各服务器中的高级角色')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('要查看的用户（留空则查看自己）')
        .setRequired(false)),
  
  async execute(interaction) {
    // 获取目标用户（如果未指定则为命令执行者）
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const targetId = targetUser.id;
    
    // 获取角色数据
    const rolesData = getRolesData();
    const userApprovedRoles = rolesData.approvedRoles[targetId] || [];
    
    // 创建嵌入消息
    const profileEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${targetUser.username} 的个人资料`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setDescription('以下是该用户在各服务器中获得的高级角色')
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    // 添加高级角色信息
    if (userApprovedRoles.length > 0) {
      for (const roleInfo of userApprovedRoles) {
        profileEmbed.addFields({
          name: `${roleInfo.serverName}`,
          value: `角色: ${roleInfo.roleName}\n描述: ${roleInfo.description || '无描述'}`
        });
      }
    } else {
      profileEmbed.addFields({
        name: '暂无高级角色',
        value: '该用户目前没有获得任何已审核通过的高级角色'
      });
    }
    
    // 回复消息
    await interaction.reply({ embeds: [profileEmbed], ephemeral: targetUser.id !== interaction.user.id });
  },
};