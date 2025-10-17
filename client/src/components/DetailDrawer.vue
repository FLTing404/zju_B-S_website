<template>
  <div class="drawer-overlay" @click="$emit('close')">
    <div class="drawer-content" @click.stop>
      <div class="drawer-header">
        <h3 class="drawer-title">详情</h3>
        <button @click="$emit('close')" class="close-btn" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <img :src="photo.src" :alt="photo.title" class="detail-img" />

      <div class="detail-grid">
        <div class="detail-card">
          <div class="card-label">标题</div>
          <div class="card-value">{{ photo.title }}</div>
        </div>

        <div class="detail-card">
          <div class="card-label">AI 标签（评分）</div>
          <div class="tags-row">
            <span v-for="(label, i) in photo.ai.labels" :key="i" class="chip">{{ label }}</span>
            <span class="chip">{{ photo.ai.score }}</span>
          </div>
        </div>

        <div class="detail-card">
          <div class="card-label">EXIF</div>
          <ul class="exif-list">
            <li>时间: <span class="exif-value">{{ photo.exif.time }}</span></li>
            <li>地点: <span class="exif-value">{{ photo.exif.location }}</span></li>
            <li>分辨率: <span class="exif-value">{{ photo.exif.resolution }}</span></li>
            <li>相机: <span class="exif-value">{{ photo.exif.camera }}</span></li>
          </ul>
        </div>

        <div class="detail-card">
          <div class="card-label">用户标签</div>
          <div class="tags-row">
            <span v-for="(tag, i) in photo.userTags" :key="i" class="chip">{{ tag }}</span>
          </div>
          <div class="add-tag-row">
            <input 
              v-model="newTag"
              @keyup.enter="addTag"
              placeholder="添加标签" 
              class="tag-input"
            />
            <button @click="addTag" class="tag-add-btn">添加</button>
          </div>
        </div>
      </div>

      <div class="quick-edit">
        <div class="card-label">快速编辑</div>
        <div class="edit-buttons">
          <button @click="editImage" class="edit-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" class="edit-icon">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
            </svg>
            编辑图片
          </button>
        </div>
      </div>

      <div class="drawer-footer">
        <button @click="$emit('delete', photo.id)" class="delete-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
            <path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14H7z"/>
          </svg>
          删除
        </button>
        <button @click="$emit('close')" class="done-btn">完成</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailDrawer',
  props: {
    photo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      newTag: ''
    }
  },
  methods: {
    addTag() {
      if (this.newTag.trim()) {
        this.$emit('add-tag', this.newTag.trim())
        this.newTag = ''
      }
    },
    editImage() {
      this.$emit('edit', this.photo)
    }
  }
}
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  background: rgba(15, 23, 42, 0.4);
}

.drawer-content {
  position: relative;
  margin-left: auto;
  height: 100%;
  width: 100%;
  max-width: 36rem;
  background: white;
  box-shadow: -20px 0 25px -5px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  overflow-y: auto;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.drawer-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
}

.close-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.detail-img {
  width: 100%;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.detail-card {
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 1rem;
}

.card-label {
  color: #64748b;
  margin-bottom: 0.5rem;
}

.card-value {
  font-weight: 500;
}

.tags-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.exif-list {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0;
}

.exif-list li {
  margin-bottom: 0.25rem;
}

.exif-value {
  font-weight: 500;
}

.add-tag-row {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.tag-input {
  flex: 1;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.tag-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tag-add-btn {
  border-radius: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
}

.tag-add-btn:hover {
  background: #1d4ed8;
}

.quick-edit {
  margin-bottom: 1.5rem;
}

.edit-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #f8fafc;
}

.edit-icon {
  width: 1rem;
  height: 1rem;
}

.drawer-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  color: #dc2626;
  background: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #fef2f2;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.done-btn {
  border-radius: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
}

.done-btn:hover {
  background: #1d4ed8;
}

@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

