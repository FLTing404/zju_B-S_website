# 常用指令说明

## 🚀 数据库操作

### 快速重置数据库（推荐）

```bash
cd zju_B-S_website/server
npm run reset-db
```

这个命令会：

1. 删除现有的 `photo_manager` 数据库
2. 重新创建数据库和所有表
3. 插入6个默认分类（人像、动物、美食、自然、文本截图、其他）
4. 设置正确的字符编码（utf8mb4）

## 🐳 Docker 操作

### 启动项目

```bash
# 构建并启动所有服务（后台运行）
docker-compose up --build -d
```

### 停止项目

```bash
# 停止所有服务
docker-compose down
```

### 查看状态

```bash
# 查看服务状态
docker-compose ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
```

---

## 🔄 代码修改后重新部署

### 后端代码修改

```bash
# 重新构建并启动后端
docker-compose up --build -d backend
```

### 前端代码修改

```bash
# 重新构建并启动前端
docker-compose up --build -d frontend
```

### 配置文件修改

```bash
# 重新构建所有服务
docker-compose up --build -d
```

### 环境变量修改

```bash
# 重新启动服务
docker-compose restart
```

---

## 🌐 访问地址

- **前端网站**：http://localhost
- **后端API**：http://localhost:3000/api/health
- **数据库**：localhost:3306（用 Navicat 连接）

---

### Git 操作

```bash
# 查看提交历史
git log --oneline

# 查看文件状态
git status

# 添加文件到暂存区
git add .

# 提交更改
git commit -m "feat: 添加新功能"

# 推送到远程仓库
git push origin main
```

---
