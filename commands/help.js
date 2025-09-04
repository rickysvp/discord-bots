const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('显示所有可用的命令'),
  async execute(interaction) {
    const commands = interaction.client.commands;
    
    const helpEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('MonadBot 帮助')
      .setDescription('以下是所有可用的命令:')
      .setTimestamp()
      .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
    
    commands.forEach(command => {
      helpEmbed.addFields({ name: `/${command.data.name}`, value: command.data.description });
    });
    
    await interaction.reply({ embeds: [helpEmbed] });
  },
};