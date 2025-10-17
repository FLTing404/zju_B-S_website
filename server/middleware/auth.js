const jwt = require('jsonwebtoken');

/**
 * JWT认证中间件
 */
function auth(req, res, next) {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    // 将用户信息添加到请求对象
    req.userId = decoded.userId;
    req.username = decoded.username;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期，请重新登录' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的令牌' });
    }
    return res.status(500).json({ error: '认证失败' });
  }
}

module.exports = auth;

