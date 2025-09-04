const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 游戏状态
const gameStates = {
    IDLE: 'idle',
    RECRUITING: 'recruiting',
    RUNNING: 'running',
    ENDED: 'ended'
};

// 随机事件类型
const eventTypes = {
    ELIMINATION: 'elimination', // 淘汰其他玩家
    SURVIVE: 'survive',         // 躲避淘汰
    BUFF: 'buff',               // 获得增益
    DEBUFF: 'debuff',           // 获得减益
    SPECIAL: 'special'          // 特殊事件
};

// 游戏事件库
const gameEvents = [
    { type: eventTypes.ELIMINATION, text: '将 {target} 扔出了擂台！' },
    { type: eventTypes.ELIMINATION, text: '给了 {target} 一记重拳，将其击倒！' },
    { type: eventTypes.ELIMINATION, text: '使用绝招将 {target} 淘汰！' },
    { type: eventTypes.SURVIVE, text: '躲过了 {target} 的攻击，安全了！' },
    { type: eventTypes.SURVIVE, text: '从擂台边缘惊险地爬了回来！' },
    { type: eventTypes.BUFF, text: '找到了一件隐藏的武器，战斗力提升！' },
    { type: eventTypes.BUFF, text: '喝下能量饮料，速度大增！' },
    { type: eventTypes.DEBUFF, text: '被绊倒了，暂时失去平衡！' },
    { type: eventTypes.DEBUFF, text: '受了轻伤，行动变得迟缓！' },
    { type: eventTypes.SPECIAL, text: '发现了一个秘密通道，暂时消失在比赛中！' },
    { type: eventTypes.SPECIAL, text: '获得观众的欢呼，士气大增！' }
];

// 游戏数据存储路径
const dataPath = path.join(__dirname, '../data/rumble.json');

// 初始化或加载游戏数据
function loadGameData() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = fs.readFileSync(dataPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading rumble game data:', error);
    }
    
    // 默认游戏数据
    return {
        games: {},
        stats: {}
    };
}

// 保存游戏数据
function saveGameData(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving rumble game data:', error);
    }
}

// 获取随机事件
function getRandomEvent() {
    return gameEvents[Math.floor(Math.random() * gameEvents.length)];
}

// 获取随机目标（除了自己）
function getRandomTarget(players, currentPlayer) {
    const availablePlayers = players.filter(player => player.id !== currentPlayer.id);
    if (availablePlayers.length === 0) return null;
    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
}

// 处理游戏回合
async function processGameRound(gameData, interaction) {
    if (gameData.players.length <= 1) {
        return endGame(gameData, interaction);
    }

    const roundEmbed = new EmbedBuilder()
        .setColor('#FF9900')
        .setTitle(`🏆 皇家大乱斗 - 第 ${gameData.round} 回合`)
        .setDescription('本回合的战斗事件:');

    // 处理每个玩家的回合行动
    const eliminatedThisRound = [];
    const survivors = [...gameData.players];

    for (const player of gameData.players) {
        // 如果玩家已经在本回合被淘汰，跳过他们的行动
        if (eliminatedThisRound.includes(player.id)) continue;

        const event = getRandomEvent();
        let eventText = event.text;
        
        // 处理需要目标的事件
        if (eventText.includes('{target}')) {
            const target = getRandomTarget(survivors, player);
            if (target) {
                eventText = eventText.replace('{target}', `<@${target.id}>`);
                
                // 如果是淘汰事件，从存活列表中移除目标
                if (event.type === eventTypes.ELIMINATION) {
                    const targetIndex = survivors.findIndex(p => p.id === target.id);
                    if (targetIndex !== -1) {
                        survivors.splice(targetIndex, 1);
                        eliminatedThisRound.push(target.id);
                        
                        // 更新玩家排名
                        target.rank = gameData.players.length - eliminatedThisRound.length;
                    }
                }
            } else {
                // 如果没有可用目标，改为一个自我事件
                eventText = '四处寻找对手，但没有发现任何人！';
            }
        }
        
        roundEmbed.addFields({ name: `<@${player.id}>`, value: eventText });
    }

    // 更新游戏数据
    gameData.players = survivors;
    gameData.round++;
    
    // 发送回合结果
    await interaction.channel.send({ embeds: [roundEmbed] });
    
    // 如果游戏应该继续，安排下一个回合
    if (survivors.length > 1) {
        setTimeout(() => processGameRound(gameData, interaction), 5000);
    } else {
        endGame(gameData, interaction);
    }
}

// 结束游戏
async function endGame(gameData, interaction) {
    gameData.state = gameStates.ENDED;
    
    // 确保最后一名幸存者获得第一名
    if (gameData.players.length === 1) {
        gameData.players[0].rank = 1;
    }
    
    // 按排名排序所有参与者
    const allPlayers = [...gameData.players, ...gameData.eliminatedPlayers].sort((a, b) => a.rank - b.rank);
    
    const resultsEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 皇家大乱斗 - 游戏结束')
        .setDescription('最终排名:');
    
    // 添加前三名的特殊标识
    for (let i = 0; i < allPlayers.length; i++) {
        const player = allPlayers[i];
        let prefix = '';
        
        if (player.rank === 1) prefix = '🥇 冠军: ';
        else if (player.rank === 2) prefix = '🥈 亚军: ';
        else if (player.rank === 3) prefix = '🥉 季军: ';
        else prefix = `第 ${player.rank} 名: `;
        
        resultsEmbed.addFields({ name: prefix, value: `<@${player.id}>` });
    }
    
    // 更新游戏统计数据
    const statsData = loadGameData();
    for (const player of allPlayers) {
        if (!statsData.stats[player.id]) {
            statsData.stats[player.id] = {
                gamesPlayed: 0,
                wins: 0,
                topThree: 0
            };
        }
        
        statsData.stats[player.id].gamesPlayed++;
        
        if (player.rank === 1) {
            statsData.stats[player.id].wins++;
        }
        
        if (player.rank <= 3) {
            statsData.stats[player.id].topThree++;
        }
    }
    
    // 删除当前游戏数据
    delete statsData.games[interaction.guildId];
    saveGameData(statsData);
    
    // 发送结果
    await interaction.channel.send({ embeds: [resultsEmbed] });
}

// 处理加入按钮点击
async function handleJoinButton(interaction) {
    // 加载游戏数据
    const gameData = loadGameData();
    const currentGame = gameData.games[interaction.guildId];
    
    if (!currentGame || currentGame.state !== gameStates.RECRUITING) {
        return interaction.reply({ content: '报名已结束！', ephemeral: true });
    }
    
    // 检查玩家是否已经加入
    if (currentGame.players.some(player => player.id === interaction.user.id)) {
        return interaction.reply({ content: '你已经加入了游戏！', ephemeral: true });
    }
    
    // 添加玩家
    currentGame.players.push({
        id: interaction.user.id,
        username: interaction.user.username,
        joinTime: Date.now(),
        rank: 0 // 将在游戏结束时确定
    });
    
    // 保存更新后的游戏数据
    gameData.games[interaction.guildId] = currentGame;
    saveGameData(gameData);
    
    // 更新嵌入消息
    try {
        const message = await interaction.message.fetch();
        const embed = message.embeds[0];
        
        if (embed) {
            const newEmbed = EmbedBuilder.from(embed)
                .setDescription(
                    `一场激动人心的皇家大乱斗即将开始！\n点击下方按钮参与游戏！\n\n报名将在 ${Math.round((currentGame.endTime - Date.now()) / 1000)} 秒后结束。\n\n当前玩家数: ${currentGame.players.length}`
                );
            
            await interaction.message.edit({ embeds: [newEmbed] });
        }
    } catch (error) {
        console.error('更新消息时出错:', error);
    }
    
    await interaction.reply({ content: '你已成功加入皇家大乱斗！', ephemeral: true });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rumble')
        .setDescription('开始一场皇家大乱斗游戏')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('开始一场新的皇家大乱斗游戏')
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('玩家报名时间（秒）')
                        .setRequired(false)
                        .setMinValue(10)
                        .setMaxValue(300))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('查看皇家大乱斗的统计数据')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'start') {
            // 检查是否有管理员权限
            if (!interaction.member.permissions.has('MANAGE_GUILD')) {
                return interaction.reply({ content: '只有管理员可以开始皇家大乱斗游戏！', ephemeral: true });
            }
            
            // 加载游戏数据
            const gameData = loadGameData();
            
            // 检查是否已有游戏在进行
            if (gameData.games[interaction.guildId] && 
                (gameData.games[interaction.guildId].state === gameStates.RECRUITING || 
                 gameData.games[interaction.guildId].state === gameStates.RUNNING)) {
                return interaction.reply({ content: '已经有一场皇家大乱斗游戏在进行中！', ephemeral: true });
            }
            
            // 设置报名时间
            const duration = interaction.options.getInteger('duration') || 60; // 默认60秒
            
            // 创建新游戏
            gameData.games[interaction.guildId] = {
                state: gameStates.RECRUITING,
                players: [],
                eliminatedPlayers: [],
                round: 1,
                startTime: Date.now(),
                endTime: Date.now() + (duration * 1000)
            };
            
            saveGameData(gameData);
            
            // 创建报名按钮
            const joinButton = new ButtonBuilder()
                .setCustomId('rumble_join')
                .setLabel('参加大乱斗')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🥊');
            
            const row = new ActionRowBuilder().addComponents(joinButton);
            
            // 创建报名嵌入消息
            const recruitEmbed = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('🏆 皇家大乱斗 - 玩家招募')
                .setDescription(`一场激动人心的皇家大乱斗即将开始！\n点击下方按钮参与游戏！\n\n报名将在 ${duration} 秒后结束。`)
                .setFooter({ text: '游戏将在报名结束后自动开始' });
            
            // 发送报名消息
            const message = await interaction.reply({ 
                embeds: [recruitEmbed], 
                components: [row],
                fetchReply: true
            });
            
            // 创建按钮收集器
            const collector = message.createMessageComponentCollector({ 
                componentType: ComponentType.Button,
                time: duration * 1000 
            });
            
            // 处理加入按钮点击
            collector.on('collect', async i => {
                // 重新加载游戏数据以确保最新状态
                const currentGameData = loadGameData();
                const currentGame = currentGameData.games[interaction.guildId];
                
                if (!currentGame || currentGame.state !== gameStates.RECRUITING) {
                    return i.reply({ content: '报名已结束！', ephemeral: true });
                }
                
                // 检查玩家是否已经加入
                if (currentGame.players.some(player => player.id === i.user.id)) {
                    return i.reply({ content: '你已经加入了游戏！', ephemeral: true });
                }
                
                // 添加玩家
                currentGame.players.push({
                    id: i.user.id,
                    username: i.user.username,
                    joinTime: Date.now(),
                    rank: 0 // 将在游戏结束时确定
                });
                
                // 保存更新后的游戏数据
                currentGameData.games[interaction.guildId] = currentGame;
                saveGameData(currentGameData);
                
                // 更新嵌入消息显示当前玩家数量
                recruitEmbed.setDescription(
                    `一场激动人心的皇家大乱斗即将开始！\n点击下方按钮参与游戏！\n\n报名将在 ${duration} 秒后结束。\n\n当前玩家数: ${currentGame.players.length}`
                );
                
                await message.edit({ embeds: [recruitEmbed] });
                await i.reply({ content: '你已成功加入皇家大乱斗！', ephemeral: true });
            });
            
            // 报名结束后开始游戏
            collector.on('end', async () => {
                // 重新加载游戏数据
                const currentGameData = loadGameData();
                const currentGame = currentGameData.games[interaction.guildId];
                
                if (!currentGame) return;
                
                // 检查是否有足够的玩家
                if (currentGame.players.length < 2) {
                    // 游戏取消
                    delete currentGameData.games[interaction.guildId];
                    saveGameData(currentGameData);
                    
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('🏆 皇家大乱斗 - 已取消')
                        .setDescription('参与人数不足，游戏取消！至少需要2名玩家。');
                    
                    return interaction.channel.send({ embeds: [cancelEmbed] });
                }
                
                // 开始游戏
                currentGame.state = gameStates.RUNNING;
                saveGameData(currentGameData);
                
                // 创建游戏开始嵌入消息
                const startEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('🏆 皇家大乱斗 - 游戏开始')
                    .setDescription(`共有 ${currentGame.players.length} 名勇士进入擂台！\n让比赛开始吧！`)
                    .addFields(
                        { name: '参与者', value: currentGame.players.map(p => `<@${p.id}>`).join('\n') }
                    );
                
                await interaction.channel.send({ embeds: [startEmbed] });
                
                // 开始游戏回合
                setTimeout(() => processGameRound(currentGame, interaction), 3000);
            });
        } 
        else if (subcommand === 'stats') {
            // 加载游戏数据
            const gameData = loadGameData();
            const userId = interaction.user.id;
            
            // 获取用户统计数据
            const userStats = gameData.stats[userId] || {
                gamesPlayed: 0,
                wins: 0,
                topThree: 0
            };
            
            // 创建统计数据嵌入消息
            const statsEmbed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('🏆 皇家大乱斗 - 个人统计')
                .setDescription(`<@${userId}> 的战绩`)
                .addFields(
                    { name: '参与游戏', value: userStats.gamesPlayed.toString(), inline: true },
                    { name: '获得冠军', value: userStats.wins.toString(), inline: true },
                    { name: '前三名次', value: userStats.topThree.toString(), inline: true },
                    { name: '胜率', value: `${userStats.gamesPlayed > 0 ? ((userStats.wins / userStats.gamesPlayed) * 100).toFixed(1) : 0}%`, inline: true }
                );
            
            // 获取排行榜数据
            const allStats = Object.entries(gameData.stats)
                .map(([id, stats]) => ({
                    id,
                    ...stats
                }))
                .sort((a, b) => b.wins - a.wins)
                .slice(0, 5);
            
            if (allStats.length > 0) {
                const leaderboard = allStats.map((stat, index) => 
                    `${index + 1}. <@${stat.id}>: ${stat.wins} 次胜利`
                ).join('\n');
                
                statsEmbed.addFields({ name: '胜利排行榜', value: leaderboard });
            }
            
            await interaction.reply({ embeds: [statsEmbed] });
        }
    },
    // 导出按钮处理函数
    handleJoinButton
};