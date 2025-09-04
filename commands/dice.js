const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 数据文件路径
const dataPath = path.join(__dirname, '..', 'data', 'games.json');

// 读取游戏数据
function getGamesData() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return { users: {}, dailyGames: {} };
  } catch (error) {
    console.error('读取游戏数据失败:', error);
    return { users: {}, dailyGames: {} };
  }
}

// 保存游戏数据
function saveGamesData(data) {
  try {
    const dirPath = path.dirname(dataPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存游戏数据失败:', error);
    return false;
  }
}

// 获取用户积分，如果用户不存在则创建
function getUserPoints(userId) {
  const gamesData = getGamesData();
  
  if (!gamesData.users[userId]) {
    gamesData.users[userId] = {
      points: 0, // 新用户没有初始积分
      totalGames: 0,
      wins: 0,
      losses: 0
    };
    
    // 保存数据
    saveGamesData(gamesData);
  }
  
  return gamesData.users[userId];
}

// 更新用户积分
function updateUserPoints(userId, pointsChange, isWin) {
  const gamesData = getGamesData();
  
  if (!gamesData.users[userId]) {
    gamesData.users[userId] = {
      points: pointsChange, // 直接设置为变化值
      totalGames: 1,
      wins: isWin ? 1 : 0,
      losses: isWin ? 0 : 1
    };
  } else {
    gamesData.users[userId].points += pointsChange;
    gamesData.users[userId].totalGames += 1;
    
    if (isWin) {
      gamesData.users[userId].wins += 1;
    } else {
      gamesData.users[userId].losses += 1;
    }
  }
  
  // 保存数据
  saveGamesData(gamesData);
  
  return gamesData.users[userId];
}

// 检查用户今日游戏次数
function checkDailyGames(userId) {
  const gamesData = getGamesData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (!gamesData.dailyGames[today]) {
    gamesData.dailyGames[today] = {};
  }
  
  if (!gamesData.dailyGames[today][userId]) {
    gamesData.dailyGames[today][userId] = 0;
  }
  
  return {
    played: gamesData.dailyGames[today][userId],
    remaining: 10 - gamesData.dailyGames[today][userId],
    limit: 10
  };
}

// 增加用户今日游戏次数
function incrementDailyGames(userId) {
  const gamesData = getGamesData();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (!gamesData.dailyGames[today]) {
    gamesData.dailyGames[today] = {};
  }
  
  if (!gamesData.dailyGames[today][userId]) {
    gamesData.dailyGames[today][userId] = 0;
  }
  
  gamesData.dailyGames[today][userId] += 1;
  
  // 保存数据
  saveGamesData(gamesData);
  
  return {
    played: gamesData.dailyGames[today][userId],
    remaining: 10 - gamesData.dailyGames[today][userId],
    limit: 10
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('猜骰子点数游戏')
    .addSubcommand(subcommand =>
      subcommand
        .setName('bet')
        .setDescription('下注猜骰子点数')
        .addIntegerOption(option =>
          option.setName('points')
            .setDescription('下注的积分数量')
            .setRequired(true)
            .setMinValue(10))
        .addIntegerOption(option =>
          option.setName('dice1')
            .setDescription('第一个猜测的点数')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(6))
        .addIntegerOption(option =>
          option.setName('bet1')
            .setDescription('第一个点数的下注比例 (1-10)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10))
        .addIntegerOption(option =>
          option.setName('dice2')
            .setDescription('第二个猜测的点数 (可选)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(6))
        .addIntegerOption(option =>
          option.setName('bet2')
            .setDescription('第二个点数的下注比例 (1-10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10))
        .addIntegerOption(option =>
          option.setName('dice3')
            .setDescription('第三个猜测的点数 (可选)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(6))
        .addIntegerOption(option =>
          option.setName('bet3')
            .setDescription('第三个点数的下注比例 (1-10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('查看骰子游戏规则和今日剩余次数')),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const serverId = interaction.guildId;
    const userId = interaction.user.id;
    
    if (subcommand === 'info') {
      // 显示游戏规则和今日剩余次数
      const dailyGames = checkDailyGames(userId, serverId);
      const userData = getUserServerDMON(userId, serverId);
      
      const infoEmbed = new EmbedBuilder()
        .setColor('#4169e1')
        .setTitle('🎲 骰子游戏规则')
        .setDescription(`猜骰子点数游戏，猜中获得 $dMON，猜错失去 $dMON。\n在 ${interaction.guild.name} 服务器中进行游戏。`)
        .addFields(
          { name: '游戏规则', value: 
            '1. 你可以下注 $dMON 猜测骰子的点数 (1-6)\n' +
            '2. 你可以同时猜测多个点数，每个点数可以分配不同的下注比例\n' +
            '3. 如果骰子点数与你猜测的点数相符，你将获得相应比例的 $dMON\n' +
            '4. 如果猜错，你将失去下注的 $dMON\n' +
            '5. 每天限制玩 10 次\n' +
            '6. 每个服务器的 $dMON 单独计算，不可混用'
          },
          { name: '赔率', value: '猜中一个点数，获得下注 $dMON 的 5 倍' },
          { name: '今日游戏', value: `已玩: ${dailyGames.played} / ${dailyGames.limit} 次\n剩余: ${dailyGames.remaining} 次` },
          { name: '当前余额', value: `${userData.dmon} $dMON` }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
      
    } else if (subcommand === 'bet') {
      // 检查今日游戏次数
      const dailyGames = checkDailyGames(userId, serverId);
      
      if (dailyGames.remaining <= 0) {
        return interaction.reply({ 
          content: `你今天已经玩了 ${dailyGames.limit} 次骰子游戏，请明天再来！`, 
          ephemeral: true 
        });
      }
      
      // 获取下注信息
      const totalDMON = interaction.options.getInteger('dmon');
      const dice1 = interaction.options.getInteger('dice1');
      const bet1 = interaction.options.getInteger('bet1');
      const dice2 = interaction.options.getInteger('dice2');
      const bet2 = interaction.options.getInteger('bet2');
      const dice3 = interaction.options.getInteger('dice3');
      const bet3 = interaction.options.getInteger('bet3');
      
      // 验证下注
      const userData = getUserServerDMON(userId, serverId);
      
      if (userData.dmon < totalDMON) {
        return interaction.reply({ 
          content: `你的 $dMON 不足！当前余额: ${userData.dmon} $dMON，需要: ${totalDMON} $dMON`, 
          ephemeral: true 
        });
      }
      
      // 计算总比例
      let totalRatio = bet1;
      if (dice2 && bet2) totalRatio += bet2;
      if (dice3 && bet3) totalRatio += bet3;
      
      // 验证下注点数不重复
      const diceNumbers = [dice1];
      if (dice2) {
        if (diceNumbers.includes(dice2)) {
          return interaction.reply({ 
            content: `下注的点数不能重复！你已经选择了点数 ${dice2}`, 
            ephemeral: true 
          });
        }
        diceNumbers.push(dice2);
      }
      
      if (dice3) {
        if (diceNumbers.includes(dice3)) {
          return interaction.reply({ 
            content: `下注的点数不能重复！你已经选择了点数 ${dice3}`, 
            ephemeral: true 
          });
        }
        diceNumbers.push(dice3);
      }
      
      // 创建下注信息
      const bets = [
        { dice: dice1, ratio: bet1, dmon: Math.floor(totalDMON * bet1 / totalRatio) }
      ];
      
      if (dice2 && bet2) {
        bets.push({ 
          dice: dice2, 
          ratio: bet2, 
          dmon: Math.floor(totalDMON * bet2 / totalRatio) 
        });
      }
      
      if (dice3 && bet3) {
        bets.push({ 
          dice: dice3, 
          ratio: bet3, 
          dmon: Math.floor(totalDMON * bet3 / totalRatio) 
        });
      }
      
      // 计算实际下注总额（可能因为取整有细微差异）
      const actualTotalDMON = bets.reduce((sum, bet) => sum + bet.dmon, 0);
      
      // 增加今日游戏次数
      incrementDailyGames(userId, serverId);
      
            // 先扣除下注 $dMON
      updateUserServerDMON(userId, serverId, -actualTotalDMON, false);
      
      // 检查是否触发幸运时刻 (0.5% 的概率)
      const isLuckyMoment = Math.random() < 0.005;
      
      // 掷骰子
      let diceResult;
      if (isLuckyMoment) {
        // 幸运时刻 - 确保玩家获胜
        // 如果玩家下注了多个点数，随机选择一个
        const betDices = bets.map(bet => bet.dice);
        diceResult = betDices[Math.floor(Math.random() * betDices.length)];
      } else {
        // 正常掷骰子
        diceResult = Math.floor(Math.random() * 6) + 1;
      }
      
      // 判断结果
      const winningBet = bets.find(bet => bet.dice === diceResult);
      let dmonChange = 0;
      let isWin = false;
      
      if (winningBet) {
        // 赢了
        dmonChange = winningBet.dmon * 5; // 5倍赔率
        isWin = true;
        // 更新用户 $dMON (已经扣除了下注，现在加上奖励)
        updateUserServerDMON(userId, serverId, dmonChange, true);
      }
      // 如果输了，$dMON 已经在前面扣除，这里不需要再处理
      
      // 更新用户积分
      const updatedUserData = updateUserPoints(interaction.user.id, pointsChange, isWin);
      
      // 创建结果嵌入消息
      const resultEmbed = new EmbedBuilder()
        .setColor(isWin ? '#00ff00' : '#ff0000')
        .setTitle(`🎲 骰子游戏结果 - ${isWin ? '胜利！' : '失败！'}`)
        .setDescription(`骰子点数: **${diceResult}**`)
        .addFields(
          { name: '你的下注', value: 
            bets.map(bet => `点数 ${bet.dice}: ${bet.dmon} $dMON`).join('\n')
          },
          { name: '游戏结果', value: 
            isWin 
              ? `恭喜！你猜中了点数 ${diceResult}，获得 ${dmonChange} $dMON！`
              : `很遗憾，你没有猜中点数 ${diceResult}，失去 ${actualTotalDMON} $dMON。`
          },
          { name: '当前余额', value: `${getUserServerDMON(userId, serverId).dmon} $dMON` },
          { name: '今日游戏', value: `已玩: ${dailyGames.played + 1} / ${dailyGames.limit} 次\n剩余: ${dailyGames.remaining - 1} 次` }
        )
        .setTimestamp()
        .setFooter({ text: `由 ${interaction.client.user.username} 提供`, iconURL: interaction.client.user.displayAvatarURL() });
      
      // 添加骰子表情
      const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      resultEmbed.setThumbnail(`https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/${diceEmojis[diceResult - 1]}.png`);
      
      // 如果是幸运时刻，添加特殊提示
      if (isLuckyMoment) {
        resultEmbed.addFields({
          name: '✨ 幸运时刻！',
          value: '你触发了幸运时刻！这是一个特殊的提示：\n"在数字的海洋中，寻找那个被重复三次的数字，它将引导你找到隐藏的宝藏。"'
        });
        resultEmbed.setColor('#FFD700'); // 金色
      }
      
      // 回复消息
      await interaction.reply({ embeds: [resultEmbed] });
    }
  },
};