const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

/**
 * 获取用户可用的分类（包括全局默认分类和用户自定义分类）
 * GET /api/categories
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // 获取所有分类（包括全局默认分类和用户自定义分类）
    const [categories] = await db.query(
      `SELECT id, name, is_default, user_id
       FROM categories 
       WHERE user_id IS NULL OR user_id = ?
       ORDER BY is_default DESC, name ASC`,
      [userId]
    );

    res.json({ categories });
  } catch (error) {
    console.error('获取分类失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    res.status(500).json({ 
      error: '获取分类失败',
      details: error.message 
    });
  }
});

/**
 * 创建用户自定义分类
 * POST /api/categories
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: '分类名称不能为空' });
    }

    // 检查分类是否已存在（包括全局分类和用户自定义分类）
    const [existing] = await db.query(
      'SELECT id FROM categories WHERE name = ? AND (user_id IS NULL OR user_id = ?)',
      [name.trim(), userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: '分类已存在' });
    }

    // 创建用户自定义分类
    const [result] = await db.query(
      'INSERT INTO categories (user_id, name, is_default) VALUES (?, ?, FALSE)',
      [userId, name.trim()]
    );

    res.status(201).json({
      message: '分类创建成功',
      category: {
        id: result.insertId,
        name: name.trim(),
        is_default: false
      }
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    res.status(500).json({ 
      error: '创建分类失败',
      details: error.message 
    });
  }
});

/**
 * 删除用户自定义分类
 * DELETE /api/categories/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 检查分类是否存在且属于当前用户
    const [categories] = await db.query(
      'SELECT is_default, user_id FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: '分类不存在' });
    }

    const category = categories[0];

    // 不能删除默认分类
    if (category.is_default) {
      return res.status(400).json({ error: '默认分类不能删除' });
    }

    // 只能删除自己的自定义分类
    if (category.user_id !== userId) {
      return res.status(403).json({ error: '无权删除此分类' });
    }

    // 删除分类（关联的图片的category_id会被设置为NULL）
    await db.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({ error: '删除分类失败' });
  }
});

/**
 * 获取分类统计信息
 * GET /api/categories/stats
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const [stats] = await db.query(
      `SELECT c.id, c.name, c.is_default, COUNT(i.id) as count
       FROM categories c
       LEFT JOIN images i ON c.id = i.category_id AND i.user_id = ?
       GROUP BY c.id, c.name, c.is_default
       ORDER BY c.is_default DESC, c.name ASC`,
      [userId]
    );

    res.json({ stats });
  } catch (error) {
    console.error('获取分类统计失败:', error);
    res.status(500).json({ error: '获取分类统计失败' });
  }
});

module.exports = router;

