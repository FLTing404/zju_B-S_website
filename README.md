# ZJU BS Website

浙江大学 BS 体系软件设计大作业 - 图片管理网站

## 📑 目录

- [项目简介](#项目简介)
- [功能需求](#功能需求)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [开发计划](#开发计划)
- [提交时间节点](#提交时间节点)

## 📖 项目简介

一个基于 BS 架构的图片管理网站，支持图片上传、分类、检索、编辑等功能，并提供移动端适配。

## ✨ 功能需求

### 基本功能

- [ ] 用户注册/登录（用户名/密码≥6字节，email验证和唯一性）
- [ ] 图片上传（PC和手机浏览器）
- [ ] EXIF信息自动提取（时间、地点、分辨率等）
- [ ] 自定义分类标签
- [ ] 缩略图生成
- [ ] 图片信息数据库存储
- [ ] 多条件查询界面
- [ ] 图片展示（轮播等友好界面）
- [ ] 图片编辑（裁剪、色调调整）
- [ ] 图片删除功能
- [ ] 移动端样式适配

### 增强功能

- [ ] AI模型图片分析和智能标签（风景、人物、动物等）
- [ ] MCP接口（大模型对话检索图片）

## 🛠️ 技术栈

### 前端

- **Vue 2** - 核心框架
- **Axios** - HTTP 请求
- **Cropper.js** - 图片裁剪功能
- **Fabric.js** - 图片编辑（色调调整、滤镜等）
- **自定义 CSS** - 样式完全自主设计
- **Vite** - 构建工具

### 后端

- **Node.js + Express** - 后端服务框架
- **Sharp** - 图片处理（缩略图生成、EXIF 提取、格式转换）
- **Multer** - 文件上传中间件
- **Sequelize** - MySQL ORM
- **exif-parser** - EXIF 信息解析
- **bcrypt** - 密码加密
- **jsonwebtoken** - JWT 认证

### 数据库

- **MySQL** - 数据持久化存储

### 文件存储

- **本地文件系统** - 图片存储

### AI 标签 ✅

- **YOLO v8** - 物体检测
- **CLIP** - 语义理解
- **豆包 API** - 智能分类和俏皮描述生成
- **EasyOCR** - 文字密度检测（识别截图）

### 部署

- **Docker**
- **Docker Compose**

## 📁 项目结构

```
zju_B-S_website/
├── client/                 # 前端项目
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── assets/
│       │   └── styles/
│       │       └── main.css
│       └── components/
│           ├── AuthCard.vue        # 登录/注册
│           ├── Dashboard.vue       # 主面板
│           ├── FilterPanel.vue     # 分类面板
│           ├── UploadArea.vue      # 上传区域
│           ├── PhotoCard.vue        # 照片卡片
│           ├── DetailDrawer.vue    # 详情抽屉
│           └── Slideshow.vue        # 幻灯片
├── server/                 # 后端项目
│   ├── index.js           # 入口文件
│   ├── package.json
│   ├── init.sql           # 数据库初始化脚本
│   ├── reset-database.js  # 数据库重置脚本
│   ├── .env.example       # 环境变量示例
│   ├── config/
│   │   └── database.js    # 数据库配置
│   ├── routes/            # API路由
│   │   ├── auth.js        # 用户认证
│   │   ├── images.js      # 图片管理
│   │   └── categories.js   # 分类管理
│   ├── services/          # 业务服务
│   │   ├── aiClassifier.js # AI分类服务
│   │   └── classify_image.py # Python AI脚本
│   ├── middleware/        # 中间件
│   │   └── auth.js        # JWT认证中间件
│   ├── uploads/           # 文件存储
│   │   └── defaults/      # 默认图片
│   └── models/            # AI模型文件
│       └── yolov8n.pt     # YOLO模型
├── COMMANDS.md            # 常用指令说明
└── README.md
```

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 18
- MySQL >= 5.7
- npm >= 10

### 2. 数据库初始化

#### 方法一：使用自动设置脚本（推荐）

```bash
node setup.js
```

#### 方法二：手动重置数据库

```bash
cd server
node reset-database.js
```

#### 方法三：检查数据库状态

```bash
cd server
node check-database.js
```

#### 方法四：手动初始化

在 Navicat 或命令行中执行 `server/init.sql`：

```bash
mysql -u root -p < server/init.sql
```

**重要：** 确保MySQL服务正在运行，并且数据库用户 `smartpic` 有足够权限。

### 3. 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 4. 配置环境变量

复制 `server/.env.example` 为 `server/.env` 并修改配置：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=photo_manager
DB_USER=root
DB_PASSWORD=123456
JWT_SECRET=your_secret_key
```

### 5. 启动项目

```bash
# 启动后端（终端1）
cd server
npm run dev

# 启动前端（终端2）
cd client
npm run dev
```

前端访问：http://localhost:8080
后端访问：http://localhost:3000

### 6. Docker 部署（待实现）

```bash
docker-compose up -d
```

## 📅 开发计划

### 第一阶段：设计与规划（2025年11月17日前）

- [X] 完成设计文档（占20%总评成绩）⭐
- [X] 项目初始化：配置Vue2+后端框架+数据库
- [X] 设计数据库表结构（用户表、图片表、标签表等）

### 第二阶段：核心功能开发

- [X] 实现用户注册功能（用户名/密码≥6字节，email验证和唯一性） ✅
- [X] 实现用户登录功能（JWT token管理） ✅
- [X] 实现图片上传功能（PC和手机浏览器） ✅
- [X] 实现EXIF信息提取（时间、地点、分辨率等自动标签） ✅
- [X] 实现分类功能（6个默认分类+自定义分类） ✅
- [X] 实现缩略图生成功能 ✅
- [X] 实现图片查询界面（多条件检索） ✅
- [X] 实现图片展示界面（网格展示+AI描述） ✅
- [ ] 实现图片编辑功能（裁剪、色调调整等）
- [X] 实现图片删除功能 ✅
- [ ] 实现移动端适配（响应式设计）

### 第三阶段：增强功能

- [X] 【增强功能】集成AI模型进行图片智能标签分类 ✅
  - YOLO+CLIP+豆包三合一方案
  - 自动识别6大类：People, Animals, Food, Natural, Text/Screenshot, Others
  - 为每张图生成温暖俏皮的一句话描述
  - 新用户注册自动获得5张示例图片
- [ ] 【增强功能】提供MCP接口支持大模型对话检索

### 第四阶段：部署与文档（2026年1月5日前）

- [ ] 创建Docker容器和docker-compose配置
- [ ] 录制功能演示操作视频
- [ ] 编写使用手册
- [ ] 编写测试报告
- [ ] 完成实验报告（含封面、设计文档、源代码等）
- [ ] 最终提交：代码+文档+Docker+视频+git log

## ⏰ 提交时间节点

| 时间节点       | 提交内容                      | 权重 |
| -------------- | ----------------------------- | ---- |
| 2025年11月17日 | 设计文档                      | 20%  |
| 2026年1月5日   | 代码+文档+Docker+视频+git log | 80%  |

**提交方式：** 打包上传学在浙大或发送至 hu_xj@zju.edu.cn

## 📝 开发说明

### 前端开发

- 使用 Vue 2.7（支持 Composition API）
- 自定义 CSS（无 UI 框架依赖）
- 组件化开发，单文件组件（.vue）
- Vite 作为构建工具

### 后端开发

- RESTful API 设计
- JWT 认证
- Multer 处理文件上传
- Sharp 处理图片
- Sequelize ORM 操作数据库

### Git 提交规范

```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具配置
```

## 🤖 AI图片分类功能说明

### 功能概述

本项目集成了强大的AI图片分类和描述生成功能，采用 **YOLO + CLIP + 豆包API** 三合一方案：

1. **YOLO v8** - 检测图片中的物体（人、动物、食物、自然景观等）
2. **CLIP** - 理解图片的语义信息
3. **豆包API** - 基于前两者的结果，生成最终分类和俏皮温暖的一句话描述
4. **EasyOCR** - 检测文字密度，识别截图类图片

### 默认分类体系

- **People** - 人物照片
- **Animals** - 动物照片
- **Food** - 美食照片
- **Natural** - 自然风景
- **Text/Screenshot** - 文字截图
- **Others** - 其他类型

用户也可以创建自定义分类！

### AI描述展示位置

AI生成的俏皮描述会在以下位置展示：

1. **图片卡片** - 每张图片下方显示金黄色渐变背景的描述框，带星星图标 ⭐
2. **图片详情** - 查看大图时显示完整的AI分析结果
3. **数据库存储** - `ai_description` 字段保存描述文本

### 新用户默认图片

每个新注册用户会自动获得5张精选示例图片，分别对应5个分类（除Others外），每张图都有AI生成的描述。

### 部署步骤

#### 1. 准备模型文件和默认图片

手动复制以下文件（由于终端限制，需手动操作）：

```bash
# 复制YOLO模型
copy yolo\yolov8n.pt zju_B-S_website\server\models\

# 复制默认图片
copy yolo\images\People.jpg zju_B-S_website\server\uploads\defaults\
copy yolo\images\Animal.jpg zju_B-S_website\server\uploads\defaults\Animals.jpg
copy yolo\images\Food.jpg zju_B-S_website\server\uploads\defaults\
copy yolo\images\Natural.jpg zju_B-S_website\server\uploads\defaults\
copy yolo\images\TextScreenshot.jpg zju_B-S_website\server\uploads\defaults\
```

#### 2. 安装Python依赖

```bash
cd zju_B-S_website/server
pip install ultralytics torch torchvision pillow easyocr opencv-python requests numpy
```

或使用requirements.txt：

```bash
pip install -r ../yolo/requirements.txt
```

#### 3. 配置豆包API

在 `server/services/classify_image.py` 中已配置豆包API密钥，如需更换：

```python
DOUBAO_API_KEY = "你的豆包API密钥"
```

#### 4. 测试AI分类

```bash
cd server
python services/classify_image.py ../yolo/images/People.jpg
```

应该输出JSON格式的分类结果。

### API接口

#### 上传图片（自动AI分类）

```http
POST /api/images/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  image: [图片文件]
```

返回：

```json
{
  "message": "上传成功",
  "image": {
    "id": 1,
    "category": "People",
    "description": "温暖的笑容总是最动人的风景，这一刻值得被记住～",
    "filepath": "/uploads/user_1/xxx.jpg",
    ...
  }
}
```

#### 修改图片分类

```http
PUT /api/images/:id/category
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "categoryName": "Food"
}
```

#### 创建新分类

```http
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "我的旅行"
}
```

### 前端展示效果

PhotoCard组件已更新，AI描述以金黄色渐变卡片展示：

```vue
<div class="ai-description">
  <svg>⭐</svg>
  温暖的笑容总是最动人的风景，这一刻值得被记住～
</div>
```

样式特点：

- 渐变背景 (#fef3c7 → #fde68a)
- 左侧金色边框 (#fbbf24)
- 星星图标点缀
- 温暖友好的视觉效果

## 📝 Git日志

查看提交历史：

```bash
git log --oneline
```

## 👤 开发者

FLTing404

## 🗄️ 数据库设计

### 数据库连接信息

**连接配置：**

```
Host: localhost
Port: 3306
Username: root
Password: 123456
Database: photo_manager
```

### 数据库表结构

#### 1. 用户表 (users)

存储用户注册和登录信息

| 字段名     | 类型         | 约束                                                  | 说明                    |
| ---------- | ------------ | ----------------------------------------------------- | ----------------------- |
| id         | INT          | PRIMARY KEY, AUTO_INCREMENT                           | 用户ID                  |
| username   | VARCHAR(50)  | UNIQUE, NOT NULL                                      | 用户名（≥2字符）       |
| password   | VARCHAR(255) | NOT NULL                                              | 加密后的密码（≥6字符） |
| email      | VARCHAR(100) | UNIQUE, NOT NULL                                      | 邮箱（格式验证）        |
| avatar     | VARCHAR(255) | NULL                                                  | 用户头像路径            |
| created_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP                             | 创建时间                |
| updated_at | DATETIME     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间                |

#### 2. 分类表 (categories)

支持全局默认分类和用户自定义分类

| 字段名     | 类型        | 约束                        | 说明                         |
| ---------- | ----------- | --------------------------- | ---------------------------- |
| id         | INT         | PRIMARY KEY, AUTO_INCREMENT | 分类ID                       |
| user_id    | INT         | NULL                        | 用户ID，NULL表示全局默认分类 |
| name       | VARCHAR(50) | NOT NULL                    | 分类名称                     |
| is_default | BOOLEAN     | DEFAULT FALSE               | 是否为默认分类               |
| created_at | DATETIME    | DEFAULT CURRENT_TIMESTAMP   | 创建时间                     |

**默认分类（user_id为NULL）：**

- 人物、动物、美食、自然、文本截图、其他

#### 3. 图片表 (images)

存储图片的基本信息和元数据

| 字段名         | 类型         | 约束                                                  | 说明                 |
| -------------- | ------------ | ----------------------------------------------------- | -------------------- |
| id             | INT          | PRIMARY KEY, AUTO_INCREMENT                           | 图片ID               |
| user_id        | INT          | FOREIGN KEY, NOT NULL                                 | 所属用户ID           |
| category_id    | INT          | FOREIGN KEY                                           | 分类ID               |
| filename       | VARCHAR(255) | NOT NULL                                              | 原始文件名           |
| filepath       | VARCHAR(500) | NOT NULL                                              | 文件存储路径         |
| thumbnail_path | VARCHAR(500) | NULL                                                  | 缩略图路径           |
| file_size      | BIGINT       | NOT NULL                                              | 文件大小（字节）     |
| mime_type      | VARCHAR(50)  | NOT NULL                                              | 文件类型             |
| width          | INT          | NULL                                                  | 图片宽度（像素）     |
| height         | INT          | NULL                                                  | 图片高度（像素）     |
| description    | TEXT         | NULL                                                  | 图片描述             |
| ai_description | TEXT         | NULL                                                  | AI生成的俏皮温暖描述 |
| ai_metadata    | JSON         | NULL                                                  | YOLO和CLIP的原始数据 |
| upload_time    | DATETIME     | DEFAULT CURRENT_TIMESTAMP                             | 上传时间             |
| updated_at     | DATETIME     | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间             |

#### 4. EXIF信息表 (exif_data)

存储图片的EXIF元数据

| 字段名            | 类型          | 约束                          | 说明         |
| ----------------- | ------------- | ----------------------------- | ------------ |
| id                | INT           | PRIMARY KEY, AUTO_INCREMENT   | EXIF记录ID   |
| image_id          | INT           | FOREIGN KEY, UNIQUE, NOT NULL | 关联的图片ID |
| camera_make       | VARCHAR(100)  | NULL                          | 相机品牌     |
| camera_model      | VARCHAR(100)  | NULL                          | 相机型号     |
| datetime_original | DATETIME      | NULL                          | 拍摄时间     |
| exposure_time     | VARCHAR(50)   | NULL                          | 曝光时间     |
| f_number          | FLOAT         | NULL                          | 光圈值       |
| iso               | INT           | NULL                          | ISO感光度    |
| focal_length      | FLOAT         | NULL                          | 焦距（mm）   |
| gps_latitude      | DECIMAL(10,8) | NULL                          | GPS纬度      |
| gps_longitude     | DECIMAL(11,8) | NULL                          | GPS经度      |
| orientation       | INT           | NULL                          | 图片方向     |

#### 5. 标签表 (tags)

存储所有标签（包括自定义标签和AI生成标签）

| 字段名     | 类型        | 约束                        | 说明                             |
| ---------- | ----------- | --------------------------- | -------------------------------- |
| id         | INT         | PRIMARY KEY, AUTO_INCREMENT | 标签ID                           |
| name       | VARCHAR(50) | UNIQUE, NOT NULL            | 标签名称                         |
| type       | ENUM        | NOT NULL                    | 标签类型：'custom', 'ai', 'exif' |
| created_at | DATETIME    | DEFAULT CURRENT_TIMESTAMP   | 创建时间                         |

#### 6. 图片标签关联表 (image_tags)

建立图片和标签的多对多关系

| 字段名     | 类型     | 约束                        | 说明         |
| ---------- | -------- | --------------------------- | ------------ |
| id         | INT      | PRIMARY KEY, AUTO_INCREMENT | 关联ID       |
| image_id   | INT      | FOREIGN KEY, NOT NULL       | 图片ID       |
| tag_id     | INT      | FOREIGN KEY, NOT NULL       | 标签ID       |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP   | 关联创建时间 |

### 数据库关系图

```
users (1) ----< (N) images
  |                  |
  |                  |----< (1) exif_data
  |                  |
  |                  |----< (N) image_tags >----< (N) tags
  |
  |----< (N) categories (用户自定义分类)
```

**关系说明：**

- 一个用户可以上传多张图片（1对多）
- 一张图片对应一条EXIF信息（1对1）
- 一张图片可以有多个标签，一个标签可以关联多张图片（多对多）
- 用户可以创建自定义分类，全局默认分类所有用户共享

### 文件存储结构

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

## 📄 许可

浙江大学课程作业项目
