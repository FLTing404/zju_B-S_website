<template>
  <div class="image-editor-overlay" @click="$emit('close')">
    <div class="image-editor-content" @click.stop>
      <div class="editor-header">
        <h3 class="editor-title">图片编辑</h3>
        <button @click="$emit('close')" class="close-btn" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="editor-main">
        <div class="image-container">
          <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight"></canvas>
        </div>

        <div class="editor-controls">
          <div class="control-section">
            <h4>裁剪</h4>
            <div class="crop-controls">
              <label>X: <input v-model.number="cropX" type="number" min="0" :max="canvasWidth" /></label>
              <label>Y: <input v-model.number="cropY" type="number" min="0" :max="canvasHeight" /></label>
              <label>宽度: <input v-model.number="cropWidth" type="number" min="1" :max="canvasWidth - cropX" /></label>
              <label>高度: <input v-model.number="cropHeight" type="number" min="1" :max="canvasHeight - cropY" /></label>
              <button @click="applyCrop" class="apply-btn">应用裁剪</button>
            </div>
          </div>

          <div class="control-section">
            <h4>色调调整</h4>
            <div class="tone-controls">
              <label>
                亮度: {{ brightness }}
                <input v-model.number="brightness" type="range" min="-100" max="100" />
              </label>
              <label>
                对比度: {{ contrast }}
                <input v-model.number="contrast" type="range" min="-100" max="100" />
              </label>
              <label>
                饱和度: {{ saturation }}
                <input v-model.number="saturation" type="range" min="-100" max="100" />
              </label>
              <button @click="applyToneAdjustment" class="apply-btn">应用色调</button>
            </div>
          </div>

          <div class="control-section">
            <button @click="resetImage" class="reset-btn">重置</button>
            <button @click="saveImage" class="save-btn">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageEditor',
  props: {
    photo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      canvasWidth: 600,
      canvasHeight: 400,
      cropX: 0,
      cropY: 0,
      cropWidth: 600,
      cropHeight: 400,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      originalImage: null
    }
  },
  mounted() {
    this.loadImage()
  },
  methods: {
    async loadImage() {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        this.originalImage = img
        this.drawImage()
      }
      
      img.src = this.photo.src
    },
    
    drawImage() {
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (this.originalImage) {
        // 计算缩放比例以适应画布
        const scale = Math.min(
          this.canvasWidth / this.originalImage.width,
          this.canvasHeight / this.originalImage.height
        )
        
        const scaledWidth = this.originalImage.width * scale
        const scaledHeight = this.originalImage.height * scale
        
        // 居中绘制
        const x = (this.canvasWidth - scaledWidth) / 2
        const y = (this.canvasHeight - scaledHeight) / 2
        
        ctx.drawImage(this.originalImage, x, y, scaledWidth, scaledHeight)
      }
    },
    
    applyCrop() {
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')
      
      // 获取当前图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // 创建新的画布用于裁剪
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      
      tempCanvas.width = this.cropWidth
      tempCanvas.height = this.cropHeight
      
      // 裁剪图像
      const croppedData = ctx.getImageData(
        this.cropX, this.cropY, 
        this.cropWidth, this.cropHeight
      )
      
      tempCtx.putImageData(croppedData, 0, 0)
      
      // 将裁剪后的图像绘制回原画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tempCanvas, 0, 0)
      
      // 更新画布尺寸
      this.canvasWidth = this.cropWidth
      this.canvasHeight = this.cropHeight
      canvas.width = this.canvasWidth
      canvas.height = this.canvasHeight
    },
    
    applyToneAdjustment() {
      const canvas = this.$refs.canvas
      const ctx = canvas.getContext('2d')
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // 应用亮度、对比度和饱和度调整
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]
        
        // 亮度调整
        r += this.brightness
        g += this.brightness
        b += this.brightness
        
        // 对比度调整
        r = ((r - 128) * (100 + this.contrast) / 100) + 128
        g = ((g - 128) * (100 + this.contrast) / 100) + 128
        b = ((b - 128) * (100 + this.contrast) / 100) + 128
        
        // 饱和度调整（简化版本）
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = gray + (r - gray) * (100 + this.saturation) / 100
        g = gray + (g - gray) * (100 + this.saturation) / 100
        b = gray + (b - gray) * (100 + this.saturation) / 100
        
        // 确保值在有效范围内
        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
      }
      
      ctx.putImageData(imageData, 0, 0)
    },
    
    resetImage() {
      this.cropX = 0
      this.cropY = 0
      this.cropWidth = this.canvasWidth
      this.cropHeight = this.canvasHeight
      this.brightness = 0
      this.contrast = 0
      this.saturation = 0
      this.drawImage()
    },
    
    saveImage() {
      const canvas = this.$refs.canvas
      canvas.toBlob((blob) => {
        // 这里可以发送到服务器保存
        this.$emit('save', blob)
        this.$emit('close')
      }, 'image/jpeg', 0.9)
    }
  }
}
</script>

<style scoped>
.image-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-editor-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.editor-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
}

.close-btn svg {
  width: 1.5rem;
  height: 1.5rem;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f8fafc;
}

.image-container canvas {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  max-width: 100%;
  max-height: 100%;
}

.editor-controls {
  width: 300px;
  padding: 1rem;
  border-left: 1px solid #e2e8f0;
  overflow-y: auto;
}

.control-section {
  margin-bottom: 1.5rem;
}

.control-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.crop-controls,
.tone-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.crop-controls label,
.tone-controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.crop-controls input,
.tone-controls input {
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.tone-controls input[type="range"] {
  flex: 1;
}

.apply-btn,
.reset-btn,
.save-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.apply-btn {
  background: #3b82f6;
  color: white;
}

.apply-btn:hover {
  background: #2563eb;
}

.reset-btn {
  background: #6b7280;
  color: white;
  margin-right: 0.5rem;
}

.reset-btn:hover {
  background: #4b5563;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
}
</style>
