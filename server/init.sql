-- 删除现有数据库（如果存在）
DROP DATABASE IF EXISTS photo_manager;

-- 创建数据库
CREATE DATABASE photo_manager 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE photo_manager;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT '用户ID，NULL表示全局默认分类',
    name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_category (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_name (name),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认分类（user_id为NULL表示全局默认分类）
INSERT INTO categories (user_id, name, is_default) VALUES
(NULL, '人物', TRUE),
(NULL, '动物', TRUE),
(NULL, '美食', TRUE),
(NULL, '自然', TRUE),
(NULL, '文本截图', TRUE),
(NULL, '其他', TRUE);

-- 创建图片表
CREATE TABLE IF NOT EXISTS images (
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
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_upload_time (upload_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建EXIF信息表
CREATE TABLE IF NOT EXISTS exif_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT UNIQUE NOT NULL,
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    lens_model VARCHAR(100),
    datetime_original DATETIME,
    exposure_time VARCHAR(50),
    f_number FLOAT,
    iso INT,
    focal_length FLOAT,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    gps_altitude FLOAT,
    location_name VARCHAR(255),
    orientation INT,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    INDEX idx_datetime_original (datetime_original)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('custom', 'ai', 'exif') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建图片标签关联表
CREATE TABLE IF NOT EXISTS image_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_image_tag (image_id, tag_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    INDEX idx_image_id (image_id),
    INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

