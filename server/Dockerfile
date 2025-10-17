# 使用 Python 3.11 + Node.js 18 多阶段构建
FROM python:3.11-slim AS python-base

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    wget \
    git \
    libglx-mesa0 \
    libglu1-mesa \
    libxi6 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# 设置工作目录
WORKDIR /app

# 复制 Python 依赖文件
COPY requirements.txt ./

# 在安装Python依赖之前添加
RUN pip install --upgrade pip
RUN pip cache purge

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装 Node.js 依赖
RUN npm install --only=production

# 复制应用代码-
COPY . .

# 设置 Python 路径
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
