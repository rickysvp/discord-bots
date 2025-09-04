const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`已成功登录为 ${client.user.tag}！`);
    console.log(`机器人正在为 ${client.guilds.cache.size} 个服务器提供服务`);
    
    // 设置机器人状态
    client.user.setActivity('使用斜杠命令', { type: 'PLAYING' });
  },
};