const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * AI图片分类服务
 * 调用Python YOLO脚本进行图片分类和描述生成
 */
class AIClassifier {
  constructor() {
    this.pythonScript = path.join(__dirname, 'classify_image.py');
    this.yoloModel = path.join(__dirname, '../models/yolov8n.pt');
  }

  /**
   * 对单张图片进行AI分类和描述生成
   * @param {string} imagePath - 图片路径
   * @returns {Promise<{category: string, description: string, metadata: object}>}
   */
  async classifyImage(imagePath) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.pythonScript, imagePath]);
      
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python脚本错误:', stderr);
          // 返回默认值
          resolve({
            category: '其他',
            description: '这张图片看起来很有趣呢～',
            metadata: {
              error: stderr,
              yolo_cat: null,
              clip_desc: null
            }
          });
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve({
            category: result.final_label || '其他',
            description: result.description || '这张图片看起来很有趣呢～',
            metadata: {
              yolo_cat: result.yolo_cat,
              yolo_objects: result.yolo_objects,
              clip_desc: result.clip_desc,
              final_label: result.final_label
            }
          });
        } catch (error) {
          console.error('解析Python输出失败:', error, stdout);
          resolve({
            category: '其他',
            description: '这张图片看起来很有趣呢～',
            metadata: { error: error.message }
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('启动Python进程失败:', error);
        resolve({
          category: '其他',
          description: '这张图片看起来很有趣呢～',
          metadata: { error: error.message }
        });
      });
    });
  }

  /**
   * 获取预设的示例图片描述（用于初始化默认图片）
   */
  getDefaultDescriptions() {
    return {
      '人像': '温暖的笑容总是最动人的风景，这一刻值得被记住～',
      '动物': '毛茸茸的小可爱，看着就让人心情变好呢！',
      '美食': '光是看着就要流口水了，美食的诱惑谁能抵抗呀～',
      '自然': '大自然的馈赠总是这么让人心旷神怡，好想去这里走走～',
      '文本截图': '这张截图信息量满满，像是生活里的一段有趣对话～',
      '其他': '这张图片有着独特的魅力，很有个性呢！'
    };
  }

  /**
   * 为默认图片生成分类和描述（不调用Python，直接使用预设）
   */
  async getDefaultImageInfo(category) {
    const descriptions = this.getDefaultDescriptions();
    return {
      category: category,
      description: descriptions[category] || descriptions['其他'],
      metadata: {
        yolo_cat: category,
        yolo_objects: [],
        clip_desc: `a photo of ${category.toLowerCase()}`,
        final_label: category,
        is_default: true
      }
    };
  }
}

module.exports = new AIClassifier();

