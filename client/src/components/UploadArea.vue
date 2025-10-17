<template>
  <div
    @dragover.prevent="highlight = true"
    @dragleave="highlight = false"
    @drop.prevent="handleDrop"
    @click="$refs.fileInput.click()"
    :class="['upload-area', { highlight }]"
  >
    <input 
      ref="fileInput"
      type="file" 
      accept="image/jpeg,image/jpg" 
      multiple 
      @change="handleFileSelect"
      style="display: none"
    />
    <div class="upload-icon">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3l4 4h-3v6h-2V7H8l4-4zm-7 14h14v2H5v-2z"/>
      </svg>
    </div>
    <p class="upload-title">拖拽JPG文件到这里上传</p>
    <p class="upload-subtitle">或点击选择JPG图片（AI 将自动标记）</p>
  </div>
</template>

<script>
export default {
  name: 'UploadArea',
  data() {
    return {
      highlight: false
    }
  },
  methods: {
    handleDrop(e) {
      this.highlight = false
      const files = Array.from(e.dataTransfer.files).filter(f => 
        f.type === 'image/jpeg' || f.type === 'image/jpg' || 
        f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg')
      )
      if (files.length > 0) {
        this.$emit('files-uploaded', files)
      } else {
        alert('只支持JPG格式文件')
      }
    },
    handleFileSelect(e) {
      const files = Array.from(e.target.files || []).filter(f => 
        f.type === 'image/jpeg' || f.type === 'image/jpg' || 
        f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg')
      )
      if (files.length > 0) {
        this.$emit('files-uploaded', files)
      } else if (e.target.files && e.target.files.length > 0) {
        alert('只支持JPG格式文件')
      }
      // 清空input，允许重复选择同一文件
      e.target.value = ''
    }
  }
}
</script>

<style scoped>
.upload-area {
  width: 100%;
  border-radius: 1rem;
  border: 2px dashed #cbd5e1;
  background: white;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.upload-area.highlight {
  border-color: #2563eb;
  background: #dbeafe;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 0.5rem;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  background: #2563eb;
  color: white;
}

.upload-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.upload-title {
  font-weight: 500;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.upload-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}
</style>

