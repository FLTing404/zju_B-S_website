const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');
const auth = require('../middleware/auth');
const aiClassifier = require('../services/aiClassifier');
const exifParser = require('exif-parser');

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // 确保userId存在
      if (!req.userId) {
        return cb(new Error('用户未认证'), null);
      }
      const userDir = path.join(__dirname, `../uploads/user_${req.userId}`);
      console.log('创建用户目录:', userDir);
      await fs.mkdir(userDir, { recursive: true });
      console.log('用户目录创建成功:', userDir);
      cb(null, userDir);
    } catch (error) {
      console.error('创建用户目录失败:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // 只支持jpg文件
    const allowedTypes = /jpeg|jpg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持JPG格式文件'));
    }
  }
});

/**
 * 上传图片接口（支持AI自动分类）
 * POST /api/images/upload
 */
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择图片文件' });
    }

    const userId = req.userId;
    const filePath = req.file.path;
    const filename = req.file.filename;

    // 生成缩略图
    const thumbnailDir = path.join(path.dirname(filePath), 'thumbnails');
    await fs.mkdir(thumbnailDir, { recursive: true });
    const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);

    await sharp(filePath)
      .resize(300, 300, { fit: 'cover' })
      .toFile(thumbnailPath);

    // 获取图片元数据
    const metadata = await sharp(filePath).metadata();
    
    // 提取EXIF信息
    let exifData = null;
    try {
      const buffer = await fs.readFile(filePath);
      const parser = exifParser.create(buffer);
      exifData = parser.parse();
    } catch (err) {
      console.log('EXIF提取失败:', err.message);
    }

    // AI分类和描述生成
    console.log('开始AI分类...');
    const aiResult = await aiClassifier.classifyImage(filePath);
    console.log('AI分类结果:', aiResult);

    // 获取分类ID - 修复分类名称映射
    const categoryMapping = {
      '人物': '人物',
      '动物': '动物', 
      '美食': '美食',
      '自然': '自然',
      '文本截图': '文本截图',
      '其他': '其他'
    };
    
    const mappedCategory = categoryMapping[aiResult.category] || aiResult.category;
    const [categories] = await db.query(
      'SELECT id FROM categories WHERE name = ?',
      [mappedCategory]
    );

    let categoryId = null;
    if (categories && categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      // 如果分类不存在，使用其他
      const [othersCategory] = await db.query(
        'SELECT id FROM categories WHERE name = "其他"'
      );
      if (othersCategory && othersCategory.length > 0) {
        categoryId = othersCategory[0].id;
      } else {
        // 如果连"其他"分类都不存在，抛出错误
        throw new Error('数据库分类未初始化，请先运行初始化脚本');
      }
    }

    // 插入图片记录
    const [result] = await db.query(
      `INSERT INTO images (
        user_id, category_id, filename, filepath, thumbnail_path,
        file_size, mime_type, width, height, ai_description, ai_metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        categoryId,
        filename,
        `/uploads/user_${userId}/${filename}`,
        `/uploads/user_${userId}/thumbnails/thumb_${filename}`,
        req.file.size,
        req.file.mimetype,
        metadata.width,
        metadata.height,
        aiResult.description,
        JSON.stringify(aiResult.metadata)
      ]
    );

    const imageId = result.insertId;

    // 如果有EXIF数据，保存到exif_data表
    if (exifData && exifData.tags) {
      try {
        await db.query(
          `INSERT INTO exif_data (
            image_id, camera_make, camera_model, datetime_original,
            exposure_time, f_number, iso, focal_length,
            gps_latitude, gps_longitude, orientation
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            imageId,
            exifData.tags.Make || null,
            exifData.tags.Model || null,
            exifData.tags.DateTimeOriginal ? new Date(exifData.tags.DateTimeOriginal * 1000) : null,
            exifData.tags.ExposureTime ? `${exifData.tags.ExposureTime}` : null,
            exifData.tags.FNumber || null,
            exifData.tags.ISO || null,
            exifData.tags.FocalLength || null,
            exifData.tags.GPSLatitude || null,
            exifData.tags.GPSLongitude || null,
            exifData.tags.Orientation || null
          ]
        );
        console.log('EXIF数据保存成功');
      } catch (err) {
        console.error('EXIF数据保存失败:', err);
      }
    }

    res.json({
      message: '上传成功',
      image: {
        id: imageId,
        filename,
        category: mappedCategory, // 使用映射后的分类名称
        description: aiResult.description,
        filepath: `/uploads/user_${userId}/${filename}`,
        thumbnailPath: `/uploads/user_${userId}/thumbnails/thumb_${filename}`,
        width: metadata.width,
        height: metadata.height
      }
    });
  } catch (error) {
    console.error('上传失败:', error);
    
    // 如果文件已经上传但处理失败，尝试删除文件
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('已删除失败的上传文件:', req.file.path);
      } catch (deleteError) {
        console.error('删除失败文件时出错:', deleteError);
      }
    }
    
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

/**
 * 获取用户的所有图片
 * GET /api/images
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { category, search, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT i.*, c.name as category_name
      FROM images i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.user_id = ?
    `;
    const params = [userId];

    if (category) {
      sql += ' AND c.name = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (i.filename LIKE ? OR i.ai_description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY i.upload_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [images] = await db.query(sql, params);

    res.json({ images });
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({ error: '获取图片失败' });
  }
});

/**
 * 获取图片详情
 * GET /api/images/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [images] = await db.query(
      `SELECT i.*, c.name as category_name, e.*
       FROM images i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN exif_data e ON i.id = e.image_id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    res.json({ image: images[0] });
  } catch (error) {
    console.error('获取图片详情失败:', error);
    res.status(500).json({ error: '获取图片详情失败' });
  }
});

/**
 * 更新图片分类
 * PUT /api/images/:id/category
 */
router.put('/:id/category', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName } = req.body;
    const userId = req.userId;

    // 验证图片归属
    const [images] = await db.query(
      'SELECT id FROM images WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    // 获取分类ID
    const [categories] = await db.query(
      'SELECT id FROM categories WHERE name = ?',
      [categoryName]
    );

    if (categories.length === 0) {
      return res.status(400).json({ error: '分类不存在' });
    }

    await db.query(
      'UPDATE images SET category_id = ? WHERE id = ?',
      [categories[0].id, id]
    );

    res.json({ message: '分类更新成功' });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({ error: '更新分类失败' });
  }
});

/**
 * 删除图片
 * DELETE /api/images/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 获取图片信息
    const [images] = await db.query(
      'SELECT filepath, thumbnail_path FROM images WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const image = images[0];

    // 删除文件
    const filePath = path.join(__dirname, '..', image.filepath);
    const thumbnailPath = path.join(__dirname, '..', image.thumbnail_path);

    try {
      await fs.unlink(filePath);
      await fs.unlink(thumbnailPath);
    } catch (err) {
      console.error('删除文件失败:', err);
    }

    // 删除数据库记录（级联删除会自动删除exif_data和image_tags）
    await db.query('DELETE FROM images WHERE id = ?', [id]);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ error: '删除图片失败' });
  }
});

/**
 * 插入预设图片
 * POST /api/images/preset
 */
router.post('/preset', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // 检查用户是否已经有预设图片
    const [existingImages] = await db.query(
      'SELECT COUNT(*) as count FROM images WHERE user_id = ?',
      [userId]
    );
    
    if (existingImages[0].count > 0) {
      console.log('用户已有图片，跳过预设图片插入');
      return res.json({ message: '用户已有图片，跳过预设图片插入' });
    }
    
    // 运行预设图片插入脚本（传入当前用户ID）
    await insertPresetImagesForUser(userId);
    
    res.json({ message: '预设图片插入成功' });
  } catch (error) {
    console.error('插入预设图片失败:', error);
    res.status(500).json({ error: '插入预设图片失败: ' + error.message });
  }
});

/**
 * 为特定用户插入预设图片
 */
async function insertPresetImagesForUser(userId) {
  const sharp = require('sharp');
  const presetImages = [
    { filename: 'People.jpg', category: '人物', description: '人像照片示例' },
    { filename: 'Animals.jpg', category: '动物', description: '动物照片示例' },
    { filename: 'Food.jpg', category: '美食', description: '美食照片示例' },
    { filename: 'Natural.jpg', category: '自然', description: '自然风景示例' },
    { filename: 'TextScreenshot.jpg', category: '文本截图', description: '文本截图示例' }
  ];

  for (const imageConfig of presetImages) {
    const defaultImagePath = path.join(__dirname, '../uploads/defaults', imageConfig.filename);
    
    try {
      // 检查默认图片是否存在
      await fs.access(defaultImagePath);
      
      // 获取图片元数据
      const metadata = await sharp(defaultImagePath).metadata();
      const stats = await fs.stat(defaultImagePath);

      // 创建用户目录
      const userImageDir = path.join(__dirname, `../uploads/user_${userId}`);
      await fs.mkdir(userImageDir, { recursive: true });
      
      // 复制图片到用户目录
      const userImagePath = path.join(userImageDir, imageConfig.filename);
      await fs.copyFile(defaultImagePath, userImagePath);

      // 生成缩略图
      const thumbnailDir = path.join(userImageDir, 'thumbnails');
      await fs.mkdir(thumbnailDir, { recursive: true });
      const thumbnailPath = path.join(thumbnailDir, `thumb_${imageConfig.filename}`);
      
      await sharp(userImagePath)
        .resize(300, 300, { fit: 'cover' })
        .toFile(thumbnailPath);

      // 获取分类ID
      const [categories] = await db.query(
        'SELECT id FROM categories WHERE name = ?',
        [imageConfig.category]
      );

      if (categories && categories.length === 0) {
        console.log(`分类 ${imageConfig.category} 不存在，跳过图片 ${imageConfig.filename}`);
        continue;
      }

      const categoryId = categories[0].id;

      // 插入图片记录
      await db.query(
        `INSERT INTO images (
          user_id, category_id, filename, filepath, thumbnail_path,
          file_size, mime_type, width, height, ai_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          categoryId,
          imageConfig.filename,
          `/uploads/user_${userId}/${imageConfig.filename}`,
          `/uploads/user_${userId}/thumbnails/thumb_${imageConfig.filename}`,
          stats.size,
          metadata.format === 'jpeg' ? 'image/jpeg' : `image/${metadata.format}`,
          metadata.width,
          metadata.height,
          imageConfig.description
        ]
      );

      console.log(`成功插入预设图片: ${imageConfig.filename} for user ${userId}`);

    } catch (error) {
      console.error(`处理预设图片 ${imageConfig.filename} 失败:`, error.message);
    }
  }
}

module.exports = router;

