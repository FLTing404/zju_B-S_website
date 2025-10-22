#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 创建必要的目录
const directories = [
  'uploads',
  'uploads/avatars',
  'uploads/defaults',
  'uploads/user_1',
  'uploads/user_1/thumbnails'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  } else {
    console.log(`📁 目录已存在: ${dir}`);
  }
});

console.log('\n🎉 目录创建完成！');
