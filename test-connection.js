const https = require('https');
require('dotenv').config();

console.log('开始测试与 Discord API 的连接...');
console.log(`使用代理: HTTP_PROXY=${process.env.HTTP_PROXY || '未设置'}, HTTPS_PROXY=${process.env.HTTPS_PROXY || '未设置'}`);

// 测试连接到 Discord API
const options = {
  hostname: 'discord.com',
  port: 443,
  path: '/api/v10/gateway',
  method: 'GET',
  timeout: 15000,
  headers: {
    'User-Agent': 'DiscordBot (https://github.com/discord/discord.js, 14.14.1)'
  }
};

const req = https.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('连接测试成功!');
    console.log('响应数据:', data.substring(0, 100) + '...');
    
    // 测试令牌
    testToken();
  });
});

req.on('error', (error) => {
  console.error('连接测试失败:', error);
  console.log('\n尝试使用不同的代理设置:');
  console.log('1. 确保你的 VPN 已连接并正常工作');
  console.log('2. 尝试使用以下命令设置不同的代理端口:');
  console.log('   export HTTP_PROXY=http://127.0.0.1:你的代理端口');
  console.log('   export HTTPS_PROXY=http://127.0.0.1:你的代理端口');
  console.log('3. 或者尝试 SOCKS 代理:');
  console.log('   export HTTP_PROXY=socks5://127.0.0.1:你的代理端口');
  console.log('   export HTTPS_PROXY=socks5://127.0.0.1:你的代理端口');
});

req.on('timeout', () => {
  console.error('连接超时!');
  req.destroy();
});

req.end();

// 测试令牌是否有效
function testToken() {
  console.log('\n开始测试 Discord 令牌...');
  
  const tokenOptions = {
    hostname: 'discord.com',
    port: 443,
    path: '/api/v10/users/@me',
    method: 'GET',
    timeout: 15000,
    headers: {
      'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
      'User-Agent': 'DiscordBot (https://github.com/discord/discord.js, 14.14.1)'
    }
  };
  
  const tokenReq = https.request(tokenOptions, (res) => {
    console.log(`令牌测试状态码: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('令牌有效!');
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const botInfo = JSON.parse(data);
          console.log(`机器人信息: ${botInfo.username}#${botInfo.discriminator}`);
        } catch (e) {
          console.error('解析响应数据失败:', e);
        }
      });
    } else if (res.statusCode === 401) {
      console.error('令牌无效! 请在 Discord 开发者门户中重新生成令牌。');
    } else {
      console.error(`令牌测试失败，状态码: ${res.statusCode}`);
    }
  });
  
  tokenReq.on('error', (error) => {
    console.error('令牌测试失败:', error);
  });
  
  tokenReq.on('timeout', () => {
    console.error('令牌测试超时!');
    tokenReq.destroy();
  });
  
  tokenReq.end();
}