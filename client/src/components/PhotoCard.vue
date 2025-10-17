<template>
  <div class="photo-card">
    <div class="photo-wrapper">
      <img :src="photo.src" :alt="photo.title" class="photo-img" />
      <div class="photo-overlay"></div>
      
      <div class="photo-tags">
        <span 
          v-for="(label, i) in photo.ai.labels.slice(0, 2)" 
          :key="i"
          class="tag-chip"
        >
          {{ label }}
        </span>
      </div>
      
      <div class="photo-actions">
        <button @click="$emit('show-detail')" class="action-btn">详情</button>
        <button @click="$emit('show-slideshow')" class="action-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" class="icon">
            <path d="M6 4l14 8-14 8V4z"/>
          </svg>
          查看
        </button>
      </div>
    </div>
    
    <div class="photo-info">
      <div class="photo-title">{{ photo.title || photo.filename }}</div>
      <div class="ai-description" v-if="photo.ai_description">
        <svg viewBox="0 0 24 24" fill="currentColor" class="ai-icon">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        {{ photo.ai_description }}
      </div>
      <div class="photo-meta">{{ photo.category_name || '未分类' }} · {{ formatDate(photo.upload_time) }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhotoCard',
  props: {
    photo: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '刚刚';
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return '今天';
      if (days === 1) return '昨天';
      if (days < 7) return `${days}天前`;
      if (days < 30) return `${Math.floor(days / 7)}周前`;
      
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }
}
</script>

<style scoped>
.photo-card {
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.photo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.photo-wrapper {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.photo-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.2);
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

.photo-tags {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.photo-actions {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-card:hover .photo-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
}

.action-btn:hover {
  background: white;
}

.icon {
  width: 1rem;
  height: 1rem;
}

.photo-info {
  padding: 0.75rem;
}

.photo-title {
  font-size: 0.875rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-meta {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.ai-description {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #475569;
  margin-top: 0.375rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 0.5rem;
  border-left: 3px solid #fbbf24;
  line-height: 1.4;
}

.ai-icon {
  width: 1rem;
  height: 1rem;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 0.125rem;
}
</style>

