const db = require('./config/database');

async function checkDatabase() {
  try {
    console.log('检查数据库连接...');
    
    // 测试数据库连接
    const [result] = await db.query('SELECT 1 as test');
    console.log('数据库连接成功:', result);
    
    // 检查分类表是否存在
    const [tables] = await db.query("SHOW TABLES LIKE 'categories'");
    console.log('分类表存在:', tables.length > 0);
    
    if (tables.length > 0) {
      // 检查分类数据
      const [categories] = await db.query('SELECT * FROM categories ORDER BY is_default DESC, name ASC');
      console.log('当前分类数据:');
      categories.forEach(cat => {
        console.log(`- ${cat.name} (ID: ${cat.id}, 默认: ${cat.is_default}, 用户ID: ${cat.user_id})`);
      });
      
      if (categories.length === 0) {
        console.log('警告: 没有找到任何分类数据！');
        console.log('请运行数据库初始化脚本');
      }
    } else {
      console.log('错误: categories表不存在！');
      console.log('请运行数据库初始化脚本');
    }
    
    // 检查用户表
    const [userTables] = await db.query("SHOW TABLES LIKE 'users'");
    console.log('用户表存在:', userTables.length > 0);
    
    // 检查图片表
    const [imageTables] = await db.query("SHOW TABLES LIKE 'images'");
    console.log('图片表存在:', imageTables.length > 0);
    
  } catch (error) {
    console.error('数据库检查失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDatabase().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('脚本执行失败:', err);
    process.exit(1);
  });
}

module.exports = checkDatabase;
