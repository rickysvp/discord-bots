const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('回复 Pong!'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: '正在计算延迟...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    
    await interaction.editReply(`Pong! 机器人延迟: ${latency}ms. API 延迟: ${Math.round(interaction.client.ws.ping)}ms`);
  },
};