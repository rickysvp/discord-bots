const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const https = require('https');
require('dotenv').config();

// 尝试不同的代理配置
const proxyConfigs = [
  { type: 'HTTP', url: 'http://127.0.0.1:7890' },
  { type: 'HTTP', url: 'http://127.0.0.1:7891' },
  { type: 'SOCKS5', url: 'socks5://127.0.0.1:7890' },
  { type: 'SOCKS5', url: 'socks5://127.0.0.1:7891' },
  { type: 'SOCKS5', url: 'socks5://127.0.0.1:1080' },
  { type: '无代理', url: null }
];

// 测试所有代理配置
async function testAllProxies() {
  console.log('开始测试不同的代理配置...\n');
  
  for (const config of proxyConfigs) {
    await testProxy(config);
    // 等待一段时间再测试下一个配置
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n所有代理配置测试完成。');
}

// 测试单个代理配置
async function testProxy(config) {
  return new Promise((resolve) => {
    console.log(`测试 ${config.type} 代理: ${config.url || '直接连接'}`);
    
    let agent;
    if (config.url) {
      if (config.type === 'SOCKS5') {
        agent = new SocksProxyAgent(config.url);
      } else {
        agent = new HttpsProxyAgent(config.url);
      }
    }
    
    const options = {
      hostname: 'discord.com',
      port: 443,
      path: '/api/v10/gateway',
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'DiscordBot (https://github.com/discord/discord.js, 14.14.1)'
      },
      agent: agent
    };
    
    const req = https.request(options, (res) => {
      console.log(`✅ 成功! 状态码: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`响应数据: ${data.substring(0, 50)}...\n`);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ 失败: ${error.message}\n`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error('❌ 连接超时!\n');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// 安装缺少的依赖
function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log('正在安装必要的依赖...');
    const { exec } = require('child_process');
    
    exec('npm install socks-proxy-agent https-proxy-agent', (error, stdout, stderr) => {
      if (error) {
        console.error(`安装依赖失败: ${error.message}`);
        reject(error);
        return;
      }
      
      console.log('依赖安装完成!');
      resolve();
    });
  });
}

// 主函数
async function main() {
  try {
    await installDependencies();
    await testAllProxies();
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

main();