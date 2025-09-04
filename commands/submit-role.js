const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
    .setName('submit-role')
    .setDescription('提交服务器中的高级角色供审核')
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('要提交的角色')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('角色描述（为什么这是一个高级角色）')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  async execute(interaction) {
    // 检查权限（只有管理员或有管理角色权限的用户可以提交）
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ 
        content: '你没有权限提交高级角色。此命令需要"管理角色"权限。', 
        ephemeral: true 
      });
    }
    
    // 获取角色信息
    const role = interaction.options.getRole('role');
    const description = interaction.options.getString('description');
    const serverId = interaction.guild.id;
    const serverName = interaction.guild.name;
    
    // 读取现有数据
    const rolesData = getRolesData();
    
    // 创建提交信息
    const submissionInfo = {
      roleId: role.id,
      roleName: role.name,
      description: description,
      serverId: serverId,
      serverName: serverName,
      submittedBy: interaction.user.id,
      submittedAt: new Date().toISOString()
    };
    
    // 添加到待审核列表
    if (!rolesData.pendingRoles[serverId]) {
      rolesData.pendingRoles[serverId] = {};
    }
    rolesData.pendingRoles[serverId][role.id] = submissionInfo;
    
    // 保存数据
    if (saveRolesData(rolesData)) {
      // 创建嵌入消息
      const submitEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('高级角色提交成功')
        .setDescription(`你已成功提交角色 **${role.name}** 供审核。`)
        .addFields(
          { name: '角色名称', value: role.name, inline: true },
          { name: '服务器', value: serverName, inline: true },
          { name: '描述', value: description },
          { name: '状态', value: '等待审核' }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      await interaction.reply({ embeds: [submitEmbed], ephemeral: true });
    } else {
      await interaction.reply({ 
        content: '提交角色时出错，请稍后再试。', 
        ephemeral: true 
      });
    }
  },
};