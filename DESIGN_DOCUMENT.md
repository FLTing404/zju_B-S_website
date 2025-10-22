# SmartPic 图片管理系统设计文档

## 📋 项目概述

### 项目名称
SmartPic - 智能图片管理系统

### 项目背景
浙江大学 BS 体系软件设计大作业，基于 B/S 架构的图片管理网站，支持图片上传、分类、检索、编辑等功能，并提供移动端适配。

### 实验目的
任选 Web 开发技术实现一个图片管理的网站，满足基本功能和增强功能要求。

### 项目目标
- 提供用户友好的图片管理界面
- 实现智能图片分类和描述生成
- 支持多用户并发访问
- 提供完整的图片生命周期管理
- 满足实验要求的所有功能点

---

## 🏗️ 系统架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vue2)    │    │   后端 (Node.js) │    │   数据库 (MySQL) │
│                 │    │                 │    │                 │
│  - 用户界面      │◄──►│  - API服务      │◄──►│  - 用户数据      │
│  - 图片展示      │    │  - 文件处理      │    │  - 图片元数据    │
│  - 交互逻辑      │    │  - AI分类       │    │  - 分类信息      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   AI服务 (Python) │
                    │                 │
                    │  - YOLO检测     │
                    │  - CLIP理解     │
                    │  - 豆包API      │
                    └─────────────────┘
```

### 技术栈选择

#### 前端技术栈
- **Vue 2.7** - 渐进式 JavaScript 框架
- **Vite** - 现代化构建工具
- **Axios** - HTTP 客户端
- **Cropper.js** - 图片裁剪功能
- **Fabric.js** - 图片编辑功能
- **自定义 CSS** - 完全自主设计的样式

#### 后端技术栈
- **Node.js** - JavaScript 运行时
- **Express** - Web 应用框架
- **MySQL2** - 数据库驱动
- **Multer** - 文件上传中间件
- **Sharp** - 图片处理库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

#### AI 技术栈
- **YOLO v8** - 物体检测
- **CLIP** - 语义理解
- **豆包 API** - 智能分类和描述生成
- **EasyOCR** - 文字识别

#### 部署技术栈
- **Docker** - 容器化平台
- **Docker Compose** - 容器编排
- **Nginx** - 反向代理服务器

---

## 🗄️ 数据库设计

### 数据库选择
- **MySQL 5.7** - 关系型数据库
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 表结构设计

#### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. 分类表 (categories)
```sql
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT '用户ID，NULL表示全局默认分类',
    name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_category (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. 图片表 (images)
```sql
CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    width INT,
    height INT,
    description TEXT,
    ai_description TEXT COMMENT 'AI生成的俏皮温暖描述',
    ai_metadata JSON COMMENT 'YOLO和CLIP的原始数据',
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

#### 4. EXIF信息表 (exif_data)
```sql
CREATE TABLE exif_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT UNIQUE NOT NULL,
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    datetime_original DATETIME,
    exposure_time VARCHAR(50),
    f_number FLOAT,
    iso INT,
    focal_length FLOAT,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);
```

#### 5. 标签表 (tags)
```sql
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('custom', 'ai', 'exif') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. 图片标签关联表 (image_tags)
```sql
CREATE TABLE image_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_image_tag (image_id, tag_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### 数据库关系
```
users (1) ----< (N) images
  |                  |
  |                  |----< (1) exif_data
  |                  |
  |                  |----< (N) image_tags >----< (N) tags
  |
  |----< (N) categories (用户自定义分类)
```

---

## 🎨 前端设计

### 组件架构
```
App.vue
├── AuthCard.vue          # 登录/注册组件
├── Dashboard.vue         # 主面板组件
│   ├── FilterPanel.vue   # 分类过滤面板
│   ├── UploadArea.vue    # 上传区域
│   ├── PhotoCard.vue     # 图片卡片
│   ├── DetailDrawer.vue  # 详情抽屉
│   └── Slideshow.vue     # 幻灯片组件
```

### 页面设计

#### 1. 登录/注册页面
- **功能**: 用户身份验证
- **组件**: AuthCard.vue
- **特性**: 
  - 用户名/密码验证（≥6字符）
  - 邮箱格式验证
  - JWT Token 管理

#### 2. 主面板页面
- **功能**: 图片管理和展示
- **组件**: Dashboard.vue
- **特性**:
  - 网格布局展示图片
  - AI 描述展示（金黄色渐变卡片）
  - 分类过滤功能
  - 拖拽上传支持

#### 3. 图片详情页面
- **功能**: 图片详细信息展示
- **组件**: DetailDrawer.vue
- **特性**:
  - EXIF 信息展示
  - AI 分析结果
  - 编辑和删除功能

### 样式设计
- **设计风格**: 现代化、简洁
- **色彩方案**: 温暖色调，金黄色 AI 描述卡片
- **响应式**: 支持移动端适配
- **交互**: 流畅的动画效果

---

## 🔧 后端设计

### API 架构
```
/api
├── /auth
│   ├── POST /register    # 用户注册
│   ├── POST /login       # 用户登录
│   └── GET /profile      # 获取用户信息
├── /images
│   ├── POST /upload      # 图片上传
│   ├── GET /             # 获取图片列表
│   ├── GET /:id          # 获取图片详情
│   ├── PUT /:id/category # 修改图片分类
│   └── DELETE /:id       # 删除图片
└── /categories
    ├── GET /             # 获取分类列表
    ├── POST /            # 创建新分类
    └── DELETE /:id       # 删除分类
```

### 核心功能模块

#### 1. 用户认证模块
- **JWT Token** 管理
- **密码加密** (bcryptjs)
- **用户验证** 中间件

#### 2. 文件上传模块
- **Multer** 文件上传处理
- **Sharp** 图片处理和缩略图生成
- **EXIF** 信息提取

#### 3. AI 分类模块
- **YOLO v8** 物体检测
- **CLIP** 语义理解
- **豆包 API** 智能分类和描述生成
- **EasyOCR** 文字识别

#### 4. 数据库操作模块
- **MySQL2** 连接池
- **SQL 查询** 优化
- **事务处理**

---

## 🤖 AI 功能设计

### AI 分类流程
```
图片上传 → YOLO检测 → CLIP理解 → 豆包API → 分类结果
    ↓         ↓         ↓         ↓         ↓
  原始图片   物体检测   语义分析   智能分类   AI描述
```

### 分类体系
- **People** - 人物照片
- **Animals** - 动物照片  
- **Food** - 美食照片
- **Natural** - 自然风景
- **Text/Screenshot** - 文字截图
- **Others** - 其他类型

### AI 描述生成
- **风格**: 俏皮温暖的一句话描述
- **展示**: 金黄色渐变卡片，带星星图标
- **存储**: 数据库 `ai_description` 字段

---

## 🐳 部署设计

### Docker 容器化
```yaml
services:
  mysql:      # MySQL 数据库容器
  backend:    # Node.js 后端容器
  frontend:   # Nginx 前端容器
```

### 容器配置

#### MySQL 容器
- **镜像**: mysql:5.7
- **端口**: 3306
- **数据卷**: mysql_data
- **初始化**: init.sql 自动执行

#### 后端容器
- **基础镜像**: node:18-alpine
- **端口**: 3000
- **数据卷**: uploads_data
- **健康检查**: HTTP 健康检查

#### 前端容器
- **构建**: 多阶段构建 (Vue2 → Nginx)
- **端口**: 80
- **代理**: Nginx 反向代理到后端

### 网络配置
- **网络**: smartpic-network
- **子网**: 172.20.0.0/16
- **服务发现**: 容器间通过服务名通信

---

## 📁 文件存储设计

### 存储结构
```
server/uploads/
├── defaults/              # 默认示例图片
│   ├── People.jpg
│   ├── Animals.jpg
│   ├── Food.jpg
│   ├── Natural.jpg
│   └── TextScreenshot.jpg
└── user_{用户ID}/         # 用户专属文件夹
    ├── {图片文件}
    └── thumbnails/        # 缩略图文件夹
        └── thumb_{图片文件}
```

### 存储策略
- **用户隔离**: 每个用户独立文件夹
- **缩略图**: 自动生成 300x300 缩略图
- **持久化**: Docker 数据卷持久化存储
- **备份**: 支持数据卷备份

---

## 🔒 安全设计

### 身份认证
- **JWT Token**: 无状态身份认证
- **密码加密**: bcryptjs 哈希加密
- **Token 过期**: 24小时自动过期

### 文件安全
- **文件类型验证**: 只允许图片格式
- **文件大小限制**: 最大 10MB
- **路径安全**: 防止目录遍历攻击

### 数据库安全
- **SQL 注入防护**: 参数化查询
- **连接池**: 限制并发连接数
- **权限控制**: 最小权限原则

---

## 📊 性能优化

### 前端优化
- **代码分割**: Vite 自动代码分割
- **图片懒加载**: 滚动时加载图片
- **缓存策略**: 静态资源缓存

### 后端优化
- **连接池**: MySQL 连接池复用
- **图片处理**: Sharp 高效图片处理
- **AI 缓存**: 分类结果缓存

### 数据库优化
- **索引优化**: 关键字段建立索引
- **查询优化**: SQL 查询优化
- **分页查询**: 大数据量分页

---

## 🧪 测试策略

### 单元测试
- **前端**: Vue 组件测试
- **后端**: API 接口测试
- **数据库**: 数据操作测试

### 集成测试
- **API 测试**: 完整业务流程测试
- **AI 功能测试**: 分类准确性测试
- **文件上传测试**: 各种格式图片测试

### 性能测试
- **并发测试**: 多用户同时访问
- **压力测试**: 大量图片上传
- **响应时间**: API 响应时间测试

---

## 📈 扩展性设计

### 水平扩展
- **负载均衡**: Nginx 负载均衡
- **数据库集群**: MySQL 主从复制
- **文件存储**: 分布式文件系统

### 功能扩展
- **更多 AI 模型**: 支持更多 AI 算法
- **视频支持**: 扩展到视频管理
- **社交功能**: 图片分享和评论

### 部署扩展
- **Kubernetes**: 容器编排
- **云服务**: 云原生部署
- **CDN**: 全球内容分发

---

## 📝 开发规范

### 代码规范
- **ESLint**: JavaScript 代码规范
- **Prettier**: 代码格式化
- **Git 规范**: 提交信息规范

### 文档规范
- **API 文档**: Swagger/OpenAPI
- **代码注释**: JSDoc 注释规范
- **README**: 项目说明文档

### 版本控制
- **Git Flow**: 分支管理策略
- **语义化版本**: 版本号规范
- **变更日志**: CHANGELOG.md

---

## ✅ 功能实现对照

### 基本功能实现情况

#### 1. 用户注册、登录功能 ✅
- **用户名/密码验证**: ≥6字节长度验证
- **邮箱格式验证**: 正则表达式验证
- **唯一性验证**: 用户名和邮箱唯一性检查
- **JWT认证**: 安全的身份认证机制

#### 2. 图片上传功能 ✅
- **PC浏览器上传**: 支持拖拽和点击上传
- **手机浏览器上传**: 响应式设计，支持移动端
- **多格式支持**: JPG、PNG、GIF等常见格式
- **文件大小限制**: 最大10MB

#### 3. EXIF信息自动提取 ✅
- **时间信息**: 拍摄时间自动提取
- **地点信息**: GPS坐标信息
- **分辨率信息**: 图片宽高自动获取
- **相机信息**: 相机品牌、型号等
- **拍摄参数**: 光圈、快门、ISO等

#### 4. 自定义分类标签 ✅
- **默认分类**: 6个预设分类（人物、动物、美食、自然、文本截图、其他）
- **自定义分类**: 用户可创建个人分类
- **分类管理**: 添加、删除、修改分类
- **分类检索**: 按分类筛选图片

#### 5. 缩略图生成 ✅
- **自动生成**: 上传时自动生成300x300缩略图
- **Sharp处理**: 使用Sharp库高效处理
- **存储优化**: 缩略图独立存储，节省空间

#### 6. 数据库存储 ✅
- **图片信息**: 完整存储图片元数据
- **用户数据**: 用户信息和权限管理
- **分类数据**: 分类标签和关联关系
- **EXIF数据**: 详细的拍摄信息

#### 7. 多条件查询 ✅
- **分类筛选**: 按分类查询图片
- **时间筛选**: 按上传时间或拍摄时间筛选
- **关键词搜索**: 支持文件名和描述搜索
- **组合查询**: 多条件组合查询

#### 8. 友好展示界面 ✅
- **网格布局**: 响应式网格展示
- **轮播功能**: Slideshow组件支持轮播
- **AI描述**: 金黄色渐变卡片展示AI描述
- **详情抽屉**: 点击查看详细信息

#### 9. 图片编辑功能 ⚠️
- **裁剪功能**: Cropper.js集成（待完善）
- **色调调整**: Fabric.js支持（待完善）
- **基础编辑**: 当前支持基础编辑功能

#### 10. 删除功能 ✅
- **图片删除**: 支持单张图片删除
- **批量删除**: 支持多选删除
- **级联删除**: 删除图片时自动清理相关数据

#### 11. 移动端适配 ⚠️
- **响应式设计**: 基础响应式布局
- **移动端优化**: 触摸友好的交互设计
- **微信浏览器**: 支持微信内置浏览器（待完善）

### 增强功能实现情况

#### 1. AI模型分析 ✅
- **YOLO v8**: 物体检测和识别
- **CLIP**: 语义理解和分类
- **豆包API**: 智能分类和描述生成
- **多类型标签**: 人物、动物、美食、自然、文本截图、其他

#### 2. MCP接口 ⚠️
- **大模型对话**: 计划支持MCP接口
- **对话检索**: 通过自然语言查询图片（待实现）

---

## 📊 技术选型说明

### 前端技术选型
- **Vue 2.7**: 成熟稳定的前端框架，支持Composition API
- **Vite**: 现代化构建工具，开发体验优秀
- **自定义CSS**: 完全自主设计，无第三方UI框架依赖
- **Axios**: 可靠的HTTP客户端

### 后端技术选型
- **Node.js + Express**: JavaScript全栈开发，学习成本低
- **MySQL**: 关系型数据库，数据一致性好
- **Sharp**: 高性能图片处理库
- **JWT**: 无状态身份认证

### AI技术选型
- **YOLO v8**: 业界领先的物体检测模型
- **CLIP**: OpenAI的视觉-语言理解模型
- **豆包API**: 字节跳动的AI服务，中文理解能力强

### 部署技术选型
- **Docker**: 容器化部署，环境一致性
- **Docker Compose**: 服务编排，一键部署
- **Nginx**: 反向代理，性能优化

---

## 🎯 项目里程碑

### 第一阶段：基础架构 ✅
- [x] 项目初始化
- [x] 数据库设计
- [x] 基础 API 开发
- [x] 前端组件开发

### 第二阶段：核心功能 ✅
- [x] 用户认证系统
- [x] 图片上传功能
- [x] AI 分类系统
- [x] 图片管理界面

### 第三阶段：增强功能 ✅
- [x] AI 描述生成
- [x] 分类管理
- [x] 图片详情展示
- [x] Docker 部署

### 第四阶段：完善优化
- [ ] 移动端适配完善
- [ ] 图片编辑功能完善
- [ ] MCP接口实现
- [ ] 性能优化
- [ ] 测试完善
- [ ] 文档完善

---

## 📋 实验要求对照

### 提交要求对照

#### 1. 设计文档 ✅
- **提交时间**: 2025年11月17日前
- **权重**: 20%总评成绩
- **内容**: 完整的设计文档（本文档）

#### 2. 程序代码 ✅
- **Git管理**: 使用Git进行版本控制
- **Git日志**: 包含完整的提交历史
- **代码质量**: 规范的代码结构和注释

#### 3. Docker容器 ✅
- **Docker Compose**: 使用docker-compose.yml配置
- **一键部署**: docker-compose up --build -d
- **配置文件**: 完整的Docker配置文件

#### 4. 功能演示视频 ⚠️
- **录制要求**: 展示所有功能点
- **操作演示**: 用户注册、登录、上传、分类、查询等
- **AI功能**: 展示AI分类和描述生成

#### 5. 实验报告 ⚠️
- **报告封面**: 按照要求格式
- **设计文档**: 本文档
- **使用手册**: 用户操作指南
- **测试报告**: 功能测试结果
- **开发体会**: 开发过程总结

---

## 📚 文档结构

### 已完成的文档
1. **DESIGN_DOCUMENT.md** - 设计文档（本文档）
2. **README.md** - 项目说明文档
3. **COMMANDS.md** - Docker命令手册
4. **server/init.sql** - 数据库初始化脚本

### 待完成的文档
1. **实验报告封面** - 按学校要求格式
2. **使用手册** - 用户操作指南
3. **测试报告** - 功能测试结果
4. **开发体会** - 开发过程总结
5. **Git日志** - 完整的提交历史

---

## 🔍 质量保证

### 代码质量
- **ESLint**: JavaScript代码规范检查
- **代码注释**: 关键功能添加详细注释
- **错误处理**: 完善的异常处理机制
- **安全验证**: 输入验证和SQL注入防护

### 功能测试
- **单元测试**: 核心功能单元测试
- **集成测试**: API接口集成测试
- **用户测试**: 真实用户使用测试
- **性能测试**: 并发访问性能测试

### 文档质量
- **完整性**: 覆盖所有功能点
- **准确性**: 与实际实现一致
- **可读性**: 结构清晰，易于理解
- **实用性**: 提供实际操作指导

---

## 📄 总结

SmartPic 图片管理系统是一个功能完整、技术先进的图片管理平台，具有以下特点：

### 技术特点
- **现代化技术栈**: Vue2 + Node.js + MySQL
- **AI 驱动**: YOLO + CLIP + 豆包 API
- **容器化部署**: Docker + Docker Compose
- **响应式设计**: 支持多端访问

### 功能特点
- **智能分类**: AI 自动分类和描述
- **用户友好**: 直观的操作界面
- **数据安全**: 完善的权限控制
- **扩展性强**: 模块化设计

### 创新点
- **AI 描述生成**: 俏皮温暖的图片描述
- **多模型融合**: YOLO + CLIP + 豆包 API
- **用户隔离**: 多用户数据隔离
- **一键部署**: Docker 容器化部署

该项目展示了现代 Web 开发的最佳实践，结合了前端、后端、AI、数据库等多个技术领域，是一个完整的企业级应用解决方案。

---

**文档版本**: v1.0  
**最后更新**: 2025-10-15  
**维护者**: FLTing404  
**项目地址**: https://github.com/FLTing404/zju_B-S_website
