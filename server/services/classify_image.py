#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单张图片分类脚本 - 供Node.js调用
接收图片路径作为参数，输出JSON格式的分类结果
基于classify_2.py的完整YOLO+CLIP+豆包分类方案
"""
import sys
import os
import json
import cv2
import numpy as np
from pathlib import Path

# 检查是否安装了必要的库
try:
    from ultralytics import YOLO
    import torch
    import clip
    from PIL import Image
    import easyocr
    import requests
except ImportError as e:
    # 如果缺少依赖，返回默认结果
    result = {
        "final_label": "其他",
        "description": "这张图片看起来很有趣呢～",
        "yolo_cat": None,
        "yolo_objects": [],
        "clip_desc": None,
        "error": str(e)
    }
    print(json.dumps(result, ensure_ascii=False))
    sys.exit(0)

# ==============================
# 配置部分
# ==============================
SCRIPT_DIR = Path(__file__).parent
MODEL_DIR = SCRIPT_DIR.parent / "models"
YOLO_MODEL_PATH = MODEL_DIR / "yolov8n.pt"

# 如果模型文件不存在，尝试其他路径
if not YOLO_MODEL_PATH.exists():
    # 尝试上级目录的models文件夹
    YOLO_MODEL_PATH = SCRIPT_DIR.parent.parent / "models" / "yolov8n.pt"

# 豆包配置
DOUBAO_API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
DOUBAO_API_KEY = "f1a9eaa8-93af-4781-95bd-da83f1b4c236"
DOUBAO_MODEL = "doubao-1-5-thinking-pro-250415"

# 参数阈值
YOLO_CONF_TH = 0.25
TEXT_DENSITY_TH = 0.008

# YOLO → 高层类别映射
PEOPLE = {"person"}
ANIMALS = {"cat","dog","bird","horse","sheep","cow","elephant","bear","zebra","giraffe"}
FOODS = {"banana","apple","sandwich","orange","broccoli","carrot","hot dog","pizza",
         "donut","cake","bottle","wine glass","cup","fork","knife","spoon","bowl"}
NATURAL = {"tree","flower","plant","grass","mountain","river","cloud","rock","leaf"}

TARGET_LABELS = ["人物", "动物", "美食", "自然", "文本截图", "其他"]

# ==============================
# 延迟加载模型（仅在需要时加载）
# ==============================
yolo_model = None
ocr_reader = None
clip_model = None
clip_preprocess = None
device = None

def load_models():
    """延迟加载AI模型"""
    global yolo_model, ocr_reader, clip_model, clip_preprocess, device
    
    if yolo_model is None and YOLO_MODEL_PATH.exists():
        yolo_model = YOLO(str(YOLO_MODEL_PATH))
    
    if ocr_reader is None:
        try:
            ocr_reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
        except:
            pass
    
    if clip_model is None:
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)
        except:
            pass

# ==============================
# 工具函数
# ==============================

def text_density_by_ocr(img_bgr):
    """计算图片中文字密度"""
    if ocr_reader is None:
        return 0.0
    try:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        results = ocr_reader.readtext(gray)
        total_area, total_len = 0, 0
        for (bbox, text, conf) in results:
            if conf > 0.5:
                xs = [p[0] for p in bbox]
                ys = [p[1] for p in bbox]
                total_area += (max(xs) - min(xs)) * (max(ys) - min(ys))
                total_len += len(text.strip())
        h, w = gray.shape[:2]
        total_pix = h * w
        return float(total_area / total_pix * 0.7 + total_len / (total_pix / 1500) * 0.3)
    except:
        return 0.0

def yolo_detect(img_bgr):
    """YOLO 检测细节 + 高层类别"""
    if yolo_model is None:
        return None, {"人物": 0.0, "动物": 0.0, "美食": 0.0, "自然": 0.0}, []
    
    res = yolo_model.predict(img_bgr, conf=YOLO_CONF_TH, verbose=False)[0]
    hits = {"人物": 0.0, "动物": 0.0, "美食": 0.0, "自然": 0.0}
    detail_objects = []
    
    if res.boxes is None or len(res.boxes) == 0:
        return None, hits, detail_objects
    
    for box, cls_id, conf in zip(res.boxes.xyxy.cpu().numpy(),
                                 res.boxes.cls.cpu().numpy().astype(int),
                                 res.boxes.conf.cpu().numpy()):
        name = yolo_model.names[cls_id]
        conf = float(conf)
        if conf < 0.3:
            continue
        detail_objects.append(name)
        if name in PEOPLE:
            hits["人物"] = max(hits["人物"], conf)
        elif name in ANIMALS:
            hits["动物"] = max(hits["动物"], conf)
        elif name in FOODS:
            hits["美食"] = max(hits["美食"], conf)
        elif name in NATURAL:
            hits["自然"] = max(hits["自然"], conf)

    top = max(hits, key=hits.get)
    if hits[top] > 0:
        return top, hits, detail_objects
    return None, hits, detail_objects

def clip_caption(img_path):
    """CLIP 生成语义描述"""
    if clip_model is None or clip_preprocess is None:
        return "a photo"
    
    try:
        image = clip_preprocess(Image.open(img_path)).unsqueeze(0).to(device)
        texts = [
            "a photo of a person",
            "a photo of an animal",
            "a plate of food",
            "a natural scene",
            "a screenshot or text image",
            "something else"
        ]
        tokens = clip.tokenize(texts).to(device)
        with torch.no_grad():
            img_feat = clip_model.encode_image(image)
            txt_feat = clip_model.encode_text(tokens)
            logits = (img_feat @ txt_feat.T)
            probs = logits.softmax(dim=-1)[0].cpu().numpy()
        return texts[np.argmax(probs)]
    except:
        return "a photo"

def doubao_classify_category(yolo_cat, clip_desc):
    """豆包分类阶段：综合 YOLO + CLIP 判断类别"""
    try:
        prompt = f"""
你是一个图像分类专家，请根据以下信息判断图片属于哪个类别：

YOLO 检测初步类别: {yolo_cat}
CLIP 语义描述: {clip_desc}
分类选项: [人物, 动物, 美食, 自然, 文本截图, 其他]

请只输出最终类别名称（如 动物 或 美食）。
"""
        headers = {"Authorization": f"Bearer {DOUBAO_API_KEY}",
                   "Content-Type": "application/json"}
        payload = {
            "model": DOUBAO_MODEL,
            "messages": [{"role": "user", "content": prompt}]
        }
        r = requests.post(DOUBAO_API_URL, headers=headers, json=payload, timeout=60)
        data = r.json()
        label = data["choices"][0]["message"]["content"].strip()
        if label not in TARGET_LABELS:
            label = "其他"
        return label
    except Exception as e:
        # 如果豆包失败，返回YOLO结果或Others
        return yolo_cat if yolo_cat else "其他"

def doubao_generate_description(detail_objects, clip_desc, final_label):
    """豆包俏皮描述：参考 YOLO 检测细节 + CLIP 描述 + 最终分类"""
    try:
        prompt = f"""
你是一个温暖又俏皮的AI助手，请根据以下信息用一句中文描述这张图片，
就像朋友发朋友圈配文时的语气：

- 图片中检测到的物体: {detail_objects}
- CLIP 的语义描述: {clip_desc}
- 最终类别判断: {final_label}

要求：
1. 语言自然、有温度、有想象力；
2. 语气轻松，像朋友聊天；
3. 不要输出JSON或解释，只输出一句话。
"""
        headers = {"Authorization": f"Bearer {DOUBAO_API_KEY}",
                   "Content-Type": "application/json"}
        payload = {
            "model": DOUBAO_MODEL,
            "messages": [{"role": "user", "content": prompt}]
        }
        r = requests.post(DOUBAO_API_URL, headers=headers, json=payload, timeout=60)
        data = r.json()
        desc = data["choices"][0]["message"]["content"].strip()
        return desc
    except Exception as e:
        # 如果豆包失败，返回默认描述
        default_descs = {
            "人物": "温暖的笑容总是最动人的风景，这一刻值得被记住～",
            "动物": "毛茸茸的小可爱，看着就让人心情变好呢！",
            "美食": "光是看着就要流口水了，美食的诱惑谁能抵抗呀～",
            "自然": "大自然的馈赠总是这么让人心旷神怡，好想去这里走走～",
            "文本截图": "这张截图信息量满满，像是生活里的一段有趣对话～",
            "其他": "这张图片看起来真有趣呢～"
        }
        return default_descs.get(final_label, "这张图片看起来真有趣呢～")

# ==============================
# 主流程
# ==============================

def classify_one(img_path):
    """对单张图片进行分类"""
    img_bgr = cv2.imread(img_path)
    if img_bgr is None:
        return {
            "final_label": "其他",
            "description": "无法读取图片",
            "yolo_cat": None,
            "yolo_objects": [],
            "clip_desc": None,
            "error": "imread_failed"
        }

    # 加载模型
    load_models()

    # 1️⃣ OCR 判断是否文字截图
    text_density = text_density_by_ocr(img_bgr)
    if text_density >= TEXT_DENSITY_TH:
        return {
            "final_label": "文本截图",
            "description": "这张截图信息量满满，像是生活里的一段有趣对话～",
            "yolo_cat": None,
            "yolo_objects": [],
            "clip_desc": "a screenshot or text image"
        }

    # 2️⃣ YOLO 检测主要物体
    yolo_cat, hits, detail_objects = yolo_detect(img_bgr)

    # 3️⃣ CLIP 生成语义描述
    clip_desc = clip_caption(img_path)

    # 4️⃣ 豆包分类（综合 YOLO + CLIP）
    final_label = doubao_classify_category(yolo_cat, clip_desc)

    # 5️⃣ 如果都无法判断 → 其他
    if final_label == "其他" and not yolo_cat:
        final_label = "其他"

    # 6️⃣ 豆包俏皮描述（参考 YOLO 细节 + CLIP + 分类）
    description = doubao_generate_description(detail_objects, clip_desc, final_label)

    return {
        "final_label": final_label,
        "description": description,
        "yolo_cat": yolo_cat,
        "yolo_objects": detail_objects,
        "clip_desc": clip_desc
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "缺少图片路径参数",
            "final_label": "其他",
            "description": "这张图片看起来很有趣呢～"
        }, ensure_ascii=False))
        sys.exit(1)
    
    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print(json.dumps({
            "error": "图片文件不存在",
            "final_label": "其他",
            "description": "这张图片看起来很有趣呢～"
        }, ensure_ascii=False))
        sys.exit(1)
    
    result = classify_one(img_path)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()

