const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
  let connection;
  
  try {
    // 连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'smartpic',
      password: process.env.DB_PASSWORD || 'smartpic123',
      port: process.env.DB_PORT || 3306
    });

    console.log('连接到MySQL服务器成功');

    // 删除现有数据库（如果存在）
    await connection.execute('DROP DATABASE IF EXISTS photo_manager');
    console.log('删除现有数据库成功');

    // 创建新数据库
    await connection.execute(`
      CREATE DATABASE photo_manager 
      DEFAULT CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);
    console.log('创建新数据库成功');

    // 使用新数据库
    await connection.execute('USE photo_manager');
    console.log('切换到新数据库成功');

    // 读取并执行初始化SQL脚本
    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // 分割SQL语句并执行
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('执行SQL语句成功:', statement.substring(0, 50) + '...');
        } catch (err) {
          console.error('执行SQL语句失败:', statement.substring(0, 50) + '...', err.message);
        }
      }
    }

    console.log('数据库重置完成！');
    
    // 验证分类是否正确创建
    const [categories] = await connection.execute('SELECT * FROM categories');
    console.log('当前分类:', categories);

  } catch (error) {
    console.error('数据库重置失败:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;
