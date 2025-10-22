const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');

// 配置 multer 用于头像上传
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    // 确保目录存在
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 使用时间戳和随机数生成唯一文件名，在路由中会重命名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    cb(null, `temp_avatar_${timestamp}_${randomStr}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB 限制
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

/**
 * 用户注册接口
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // 验证输入
    if (!username || !password || !email) {
      return res.status(400).json({ error: '所有字段都必须填写' });
    }

    // 验证用户名和密码长度（按字节计算）
    const usernameBytes = Buffer.byteLength(username, 'utf8');
    const passwordBytes = Buffer.byteLength(password, 'utf8');
    
    if (usernameBytes < 6) {
      return res.status(400).json({ error: '用户名至少需要6个字节' });
    }
    if (passwordBytes < 6) {
      return res.status(400).json({ error: '密码至少需要6个字节' });
    }

    // 验证email格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'email格式不正确' });
    }

    // 检查用户名和email唯一性
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await db.query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );

    const userId = result.insertId;

    // 为新用户创建文件夹并复制默认图片
    await createUserFolderAndDefaultImages(userId);

    // 生成JWT token
    const token = jwt.sign(
      { userId, username },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: userId, username, email }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

/**
 * 用户登录接口
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查找用户
    const [users] = await db.query(
      'SELECT id, username, password, email, avatar FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

/**
 * 为新用户创建文件夹并复制默认图片
 */
async function createUserFolderAndDefaultImages(userId) {
  try {
    // 创建用户文件夹
    const userDir = path.join(__dirname, `../uploads/user_${userId}`);
    await fs.mkdir(userDir, { recursive: true });
    
    // 创建缩略图文件夹
    const thumbnailDir = path.join(userDir, 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });

    const defaultImages = [
      {
        name: '人物.jpg',
        category: '人物',
        description: '这张人物照捕捉到了美好的瞬间～'
      },
      { name: '动物.jpg', category: '动物', description: '毛茸茸的小可爱，看着就让人心情变好呢！' },
      { name: '美食.jpg', category: '美食', description: '光是看着就要流口水了，美食的诱惑谁能抵抗呀～' },
      { name: '自然.jpg', category: '自然', description: '大自然的馈赠总是这么让人心旷神怡，好想去这里走走～' },
      { name: '文本截图.jpg', category: '文本截图', description: '这张截图信息量满满，像是生活里的一段有趣对话～' }
    ];

    for (const img of defaultImages) {
      try {
        // 复制默认图片到用户文件夹
        const sourcePath = path.join(__dirname, `../uploads/defaults/${img.name}`);
        const userImagePath = path.join(userDir, img.name);
        
        // 检查源文件是否存在
        try {
          await fs.access(sourcePath);
          await fs.copyFile(sourcePath, userImagePath);
        } catch (err) {
          console.log(`默认图片 ${img.name} 不存在，跳过复制`);
          continue;
        }

        // 生成缩略图
        const sharp = require('sharp');
        const thumbnailPath = path.join(thumbnailDir, `thumb_${img.name}`);
        
        try {
          await sharp(userImagePath)
            .resize(300, 300, { fit: 'cover' })
            .toFile(thumbnailPath);
        } catch (err) {
          console.log(`生成缩略图失败 ${img.name}:`, err.message);
        }

        // 获取图片元数据
        let metadata = { width: 800, height: 600 };
        try {
          metadata = await sharp(userImagePath).metadata();
        } catch (err) {
          console.log(`获取图片元数据失败 ${img.name}:`, err.message);
        }

        // 获取文件大小
        const stats = await fs.stat(userImagePath);

        // 获取分类ID
        const [categories] = await db.query(
          'SELECT id FROM categories WHERE name = ?',
          [img.category]
        );

        if (categories.length === 0) {
          console.log(`分类 ${img.category} 不存在，跳过图片 ${img.name}`);
          continue;
        }

        const categoryId = categories[0].id;

        // 插入图片记录
        await db.query(
          `INSERT INTO images (
            user_id, category_id, filename, filepath, thumbnail_path,
            file_size, mime_type, width, height, ai_description, ai_metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            categoryId,
            img.name,
            `/uploads/user_${userId}/${img.name}`,
            `/uploads/user_${userId}/thumbnails/thumb_${img.name}`,
            stats.size,
            'image/jpeg',
            metadata.width || 800,
            metadata.height || 600,
            img.description,
            JSON.stringify({
              yolo_cat: img.category,
              is_default: true,
              final_label: img.category
            })
          ]
        );

        console.log(`成功为用户 ${userId} 创建默认图片: ${img.name}`);
      } catch (error) {
        console.error(`创建默认图片失败 (${img.name}):`, error);
      }
    }
  } catch (error) {
    console.error('创建用户文件夹失败:', error);
  }
}

/**
 * 头像上传接口
 * POST /api/auth/avatar
 */
router.post('/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的头像文件' });
    }

    const userId = req.userId;
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname);
    const newFilename = `avatar_${userId}_${timestamp}${ext}`;
    
    // 旧的临时文件路径
    const tempFilePath = path.join(__dirname, '../uploads/avatars', req.file.filename);
    // 新的最终文件路径
    const finalFilePath = path.join(__dirname, '../uploads/avatars', newFilename);
    
    // 重命名文件
    await fs.rename(tempFilePath, finalFilePath);
    
    const avatarPath = `/uploads/avatars/${newFilename}`;

    // 获取旧头像路径（用于删除）
    const [users] = await db.query(
      'SELECT avatar FROM users WHERE id = ?',
      [userId]
    );

    // 更新数据库中的头像路径
    await db.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarPath, userId]
    );

    // 删除旧头像文件（如果存在且不是默认头像）
    if (users.length > 0 && users[0].avatar && users[0].avatar !== avatarPath) {
      const oldAvatarPath = path.join(__dirname, '..', users[0].avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (err) {
        console.log('删除旧头像失败:', err.message);
      }
    }

    res.json({
      message: '头像上传成功',
      avatarUrl: avatarPath
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    
    // 如果发生错误，尝试清理临时文件
    if (req.file) {
      const tempFilePath = path.join(__dirname, '../uploads/avatars', req.file.filename);
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.log('清理临时文件失败:', err.message);
      }
    }
    
    res.status(500).json({ error: '头像上传失败，请稍后重试' });
  }
});

/**
 * 获取用户信息接口
 * GET /api/auth/profile
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const [users] = await db.query(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = users[0];
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

module.exports = router;

