const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

dotenv.config()

// 确保必要的目录存在
const ensureDirectories = () => {
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
    }
  });
}

// 创建目录
ensureDirectories()

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务（图片存储）
app.use('/uploads', express.static('uploads'))

// 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 导入路由
const authRoutes = require('./routes/auth')
const imageRoutes = require('./routes/images')
const categoryRoutes = require('./routes/categories')

app.use('/api/auth', authRoutes)
app.use('/api/images', imageRoutes)
app.use('/api/categories', categoryRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

