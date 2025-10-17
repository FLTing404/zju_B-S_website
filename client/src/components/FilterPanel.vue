<template>
  <div class="filter-panel">
    <div class="filter-card">
      <div class="filter-title">分类</div>
      <div class="result-count">
        <span class="chip">{{ visibleCount }} 个结果</span>
      </div>
      
      <div class="filter-list">
        <!-- All 选项（不可删除） -->
        <button 
          @click="$emit('update:label-filter', null)"
          :class="['filter-item', { active: !labelFilter }]"
        >
          <span>全部</span>
        </button>
        
        <!-- 分类列表 -->
        <div 
          v-for="category in categories" 
          :key="category.id"
          :class="['filter-item', { active: labelFilter === category.name }]"
        >
          <button 
            @click="$emit('update:label-filter', category.name)"
            class="filter-btn"
          >
            {{ category.name }}
          </button>
          <!-- 只有非默认分类才显示删除按钮 -->
          <button 
            v-if="!category.is_default"
            @click="removeCategory(category.id)"
            class="remove-btn"
            aria-label="删除分类"
          >
            ×
          </button>
        </div>
      </div>

      <div class="add-label">
        <input 
          v-model="newCategoryName"
          @keyup.enter="addCategory"
          placeholder="添加分类" 
          class="label-input"
        />
        <button @click="addCategory" class="add-btn">添加</button>
      </div>
    </div>

    <div class="ai-card">
      <div class="ai-title">AI 标签</div>
      <p class="ai-desc">自动为上传的照片生成标签</p>
      <button class="config-btn">配置</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterPanel',
  props: {
    visibleCount: {
      type: Number,
      required: true
    },
    labelFilter: {
      type: String,
      default: null
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      newCategoryName: ''
    }
  },
  methods: {
    async addCategory() {
      if (!this.newCategoryName.trim()) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('请先登录');
          return;
        }

        const response = await fetch('http://localhost:3000/api/categories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: this.newCategoryName.trim() })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '创建分类失败');
        }

        const result = await response.json();
        this.$emit('category-added', result.category);
        this.newCategoryName = '';
        alert('分类创建成功');
      } catch (error) {
        console.error('创建分类失败:', error);
        alert('创建分类失败: ' + error.message);
      }
    },
    async removeCategory(categoryId) {
      if (!confirm('确定要删除此分类吗？')) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('请先登录');
          return;
        }

        const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '删除分类失败');
        }

        this.$emit('remove-category', categoryId);
        alert('分类删除成功');
      } catch (error) {
        console.error('删除分类失败:', error);
        alert('删除分类失败: ' + error.message);
      }
    }
  }
}
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-card {
  border-radius: 1rem;
  background: white;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.filter-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}

.result-count {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
}

.filter-list {
  display: grid;
  gap: 0.5rem;
  max-height: 14rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  transition: background 0.2s;
}

.filter-item:not(.active) {
  background: transparent;
}

.filter-item:hover {
  background: #f8fafc;
}

.filter-item.active {
  background: #dbeafe;
  color: #1d4ed8;
}

.filter-btn {
  flex: 1;
  text-align: left;
  font-size: 0.875rem;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.filter-item.active .filter-btn {
  font-weight: 600;
}

.remove-btn {
  margin-left: 0.5rem;
  color: #94a3b8;
  border: none;
  background: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: grid;
  place-items: center;
  border-radius: 0.25rem;
}

.remove-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.add-label {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
}

.label-input {
  flex: 1;
  min-width: 0;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.label-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.add-btn {
  flex-shrink: 0;
  border-radius: 0.5rem;
  background: #2563eb;
  color: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.add-btn:hover {
  background: #1d4ed8;
}

.ai-card {
  border-radius: 1rem;
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  color: white;
  padding: 1rem;
}

.ai-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.ai-desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.25rem 0 0.75rem;
}

.config-btn {
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
}

.config-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

