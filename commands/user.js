const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('显示用户信息')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('要查看的用户')
        .setRequired(false)),
  async execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild.members.cache.get(target.id);
    
    // 获取用户加入服务器的日期
    const joinedAt = member?.joinedAt.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // 获取用户创建账号的日期
    const createdAt = target.createdAt.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // 创建嵌入消息
    const userEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${target.username} 的用户信息`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '用户 ID', value: target.id, inline: true },
        { name: '账号创建日期', value: createdAt, inline: true },
        { name: '加入服务器日期', value: joinedAt || '未知', inline: true },
        { name: '身份组', value: member?.roles.cache.map(r => r.toString()).join(' ') || '无身份组', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    await interaction.reply({ embeds: [userEmbed] });
  },
};