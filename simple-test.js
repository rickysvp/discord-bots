const https = require('https');
const http = require('http');
require('dotenv').config();

console.log('开始简单的连接测试...');
console.log(`当前环境变量: HTTP_PROXY=${process.env.HTTP_PROXY || '未设置'}, HTTPS_PROXY=${process.env.HTTPS_PROXY || '未设置'}`);

// 测试直接连接（不使用代理）
function testDirectConnection() {
  console.log('\n尝试直接连接到 Discord API（不使用代理）...');
  
  // 临时清除代理环境变量
  const originalHttpProxy = process.env.HTTP_PROXY;
  const originalHttpsProxy = process.env.HTTPS_PROXY;
  delete process.env.HTTP_PROXY;
  delete process.env.HTTPS_PROXY;
  
  const options = {
    hostname: 'discord.com',
    port: 443,
    path: '/api/v10/gateway',
    method: 'GET',
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`✅ 直接连接成功! 状态码: ${res.statusCode}`);
    
    // 恢复原始代理设置
    if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy;
    if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy;
    
    // 测试令牌
    testToken();
  });
  
  req.on('error', (error) => {
    console.error(`❌ 直接连接失败: ${error.message}`);
    
    // 恢复原始代理设置
    if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy;
    if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy;
    
    // 尝试使用系统代理
    testWithSystemProxy();
  });
  
  req.on('timeout', () => {
    console.error('❌ 直接连接超时!');
    req.destroy();
    
    // 恢复原始代理设置
    if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy;
    if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy;
    
    // 尝试使用系统代理
    testWithSystemProxy();
  });
  
  req.end();
}

// 测试使用系统代理
function testWithSystemProxy() {
  console.log('\n尝试使用系统代理连接到 Discord API...');
  
  // 尝试使用不同的端口
  const proxyPorts = ['7890', '7891', '1080', '8080', '8118'];
  let testedPorts = 0;
  
  for (const port of proxyPorts) {
    testProxyPort(port, () => {
      testedPorts++;
      if (testedPorts === proxyPorts.length) {
        console.log('\n所有代理端口测试完毕，均未成功。');
        console.log('建议:');
        console.log('1. 确认你的 VPN 是否正常工作（可以访问 Discord 网站）');
        console.log('2. 检查 Clash Verge 的代理设置，确认正确的端口');
        console.log('3. 尝试在国外服务器上托管你的机器人');
        console.log('4. 或者使用专门的 Discord 机器人托管服务');
      }
    });
  }
}

// 测试特定代理端口
function testProxyPort(port, callback) {
  console.log(`\n测试代理端口: ${port}`);
  
  // 设置 HTTP 代理
  process.env.HTTP_PROXY = `http://127.0.0.1:${port}`;
  process.env.HTTPS_PROXY = `http://127.0.0.1:${port}`;
  
  const options = {
    hostname: 'discord.com',
    port: 443,
    path: '/api/v10/gateway',
    method: 'GET',
    timeout: 5000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`✅ 使用端口 ${port} 连接成功! 状态码: ${res.statusCode}`);
    
    // 测试令牌
    testToken();
    callback();
  });
  
  req.on('error', (error) => {
    console.error(`❌ 使用端口 ${port} 连接失败: ${error.message}`);
    callback();
  });
  
  req.on('timeout', () => {
    console.error(`❌ 使用端口 ${port} 连接超时!`);
    req.destroy();
    callback();
  });
  
  req.end();
}

// 测试令牌是否有效
function testToken() {
  console.log('\n测试 Discord 令牌...');
  
  const options = {
    hostname: 'discord.com',
    port: 443,
    path: '/api/v10/users/@me',
    method: 'GET',
    timeout: 10000,
    headers: {
      'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
      'User-Agent': 'DiscordBot (https://github.com/discord/discord.js, 14.14.1)'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`令牌测试状态码: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✅ 令牌有效!');
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const botInfo = JSON.parse(data);
          console.log(`机器人信息: ${botInfo.username}#${botInfo.discriminator || '0'}`);
          console.log('\n你的机器人配置正确，但由于网络原因无法连接到 Discord API。');
          console.log('建议在国外服务器上托管你的机器人，或使用专门的 Discord 机器人托管服务。');
        } catch (e) {
          console.error('解析响应数据失败:', e);
        }
      });
    } else if (res.statusCode === 401) {
      console.error('❌ 令牌无效! 请在 Discord 开发者门户中重新生成令牌。');
    } else {
      console.error(`❌ 令牌测试失败，状态码: ${res.statusCode}`);
    }
  });
  
  req.on('error', (error) => {
    console.error(`❌ 令牌测试失败: ${error.message}`);
  });
  
  req.on('timeout', () => {
    console.error('❌ 令牌测试超时!');
    req.destroy();
  });
  
  req.end();
}

// 开始测试
testDirectConnection();