const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // 处理斜杠命令
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`未找到命令 ${interaction.commandName}`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`执行命令 ${interaction.commandName} 时出错`);
        console.error(error);
        
        const content = '执行此命令时出错！';
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, flags: 64 });
          } else {
            await interaction.reply({ content, flags: 64 });
          }
        } catch (replyError) {
          console.error('回复交互时出错:', replyError);
        }
      }
    }
    
    // 处理按钮交互
    else if (interaction.isButton()) {
      // 处理皇家大乱斗游戏的按钮
      if (interaction.customId === 'rumble_join') {
        try {
          // 获取皇家大乱斗命令
          const rumbleCommand = interaction.client.commands.get('rumble');
          if (rumbleCommand) {
            // 调用按钮处理函数
            if (typeof rumbleCommand.handleJoinButton === 'function') {
              await rumbleCommand.handleJoinButton(interaction);
            } else {
              console.error('皇家大乱斗命令中缺少 handleJoinButton 方法');
              if (!interaction.replied) {
                await interaction.reply({ content: '处理按钮时出错！', flags: 64 });
              }
            }
          } else {
            console.error('未找到皇家大乱斗命令');
            if (!interaction.replied) {
              await interaction.reply({ content: '处理按钮时出错！', flags: 64 });
            }
          }
        } catch (error) {
          console.error('处理皇家大乱斗按钮时出错:', error);
          if (!interaction.replied) {
            try {
              await interaction.reply({ content: '处理按钮时出错！', flags: 64 });
            } catch (replyError) {
              console.error('回复按钮交互时出错:', replyError);
            }
          }
        }
      }
      
      // 在这里可以添加其他按钮的处理逻辑
    }
  },
};
