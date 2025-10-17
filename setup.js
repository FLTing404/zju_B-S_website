#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 SmartPic 网站启动助手');
console.log('========================');

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 执行命令: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ 命令执行成功`);
        resolve();
      } else {
        console.log(`❌ 命令执行失败，退出码: ${code}`);
        reject(new Error(`命令执行失败: ${code}`));
      }
    });
  });
}

async function main() {
  try {
    const serverDir = path.join(__dirname, 'server');
    const clientDir = path.join(__dirname, 'client');
    
    console.log('\n1️⃣ 检查数据库配置...');
    console.log('请确保MySQL服务正在运行，并且有以下配置:');
    console.log('   - 主机: localhost');
    console.log('   - 用户: root');
    console.log('   - 密码: 123456');
    console.log('   - 端口: 3306');
    
    console.log('\n2️⃣ 初始化数据库...');
    try {
      await runCommand('node', ['reset-database.js'], serverDir);
    } catch (error) {
      console.log('⚠️  数据库重置失败，请手动检查数据库配置');
      console.log('   或者运行: cd server && node reset-database.js');
    }
    
    console.log('\n3️⃣ 检查数据库状态...');
    try {
      await runCommand('node', ['check-database.js'], serverDir);
    } catch (error) {
      console.log('⚠️  数据库检查失败');
    }
    
    console.log('\n4️⃣ 安装服务器依赖...');
    await runCommand('npm', ['install'], serverDir);
    
    console.log('\n5️⃣ 安装客户端依赖...');
    await runCommand('npm', ['install'], clientDir);
    
    console.log('\n🎉 初始化完成！');
    console.log('\n📋 启动说明:');
    console.log('1. 启动服务器: cd server && npm start');
    console.log('2. 启动客户端: cd client && npm run dev');
    console.log('3. 访问网站: http://localhost:5173');
    
    console.log('\n🔧 如果遇到问题:');
    console.log('- 检查MySQL服务是否运行');
    console.log('- 检查数据库用户权限');
    console.log('- 查看服务器日志获取详细错误信息');
    
  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.log('\n请手动执行以下步骤:');
    console.log('1. 确保MySQL服务运行');
    console.log('2. cd server && npm install');
    console.log('3. cd server && node reset-database.js');
    console.log('4. cd client && npm install');
    console.log('5. 分别启动服务器和客户端');
  }
}

if (require.main === module) {
  main();
}
