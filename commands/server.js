const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('显示服务器信息'),
  async execute(interaction) {
    const guild = interaction.guild;
    
    // 获取服务器创建日期
    const createdAt = guild.createdAt.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // 创建嵌入消息
    const serverEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${guild.name} 服务器信息`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '服务器 ID', value: guild.id, inline: true },
        { name: '创建日期', value: createdAt, inline: true },
        { name: '服务器拥有者', value: `<@${guild.ownerId}>`, inline: true },
        { name: '成员数量', value: `${guild.memberCount} 名成员`, inline: true },
        { name: '频道数量', value: `${guild.channels.cache.size} 个频道`, inline: true },
        { name: '表情数量', value: `${guild.emojis.cache.size} 个表情`, inline: true },
        { name: '服务器加成等级', value: `${guild.premiumTier ? `第 ${guild.premiumTier} 级` : '无加成'}`, inline: true },
        { name: '加成数量', value: `${guild.premiumSubscriptionCount || '0'} 个加成`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    await interaction.reply({ embeds: [serverEmbed] });
  },
};