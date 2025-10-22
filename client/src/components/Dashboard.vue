<template>
  <div class="dashboard">
    <!-- 顶部导航栏 -->
    <header class="top-bar">
      <div class="top-bar-content">
        <div class="logo-box">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 9l3.5-4.5 2.5 3L16 12l2 4H8z"/>
          </svg>
        </div>
        <div class="app-name">SmartPic</div>
        
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.5 18a7.5 7.5 0 1 1 5.3-12.8l5.2 5.2-1.6 1.6-5.2-5.2A7.5 7.5 0 0 1 10.5 18z"/>
          </svg>
          <input 
            v-model="searchQuery" 
            placeholder="搜索标题、标签、EXIF、地点..." 
            class="search-input"
            @keyup.enter="performSearch"
          />
          <button @click="performSearch" class="search-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M10.5 18a7.5 7.5 0 1 1 5.3-12.8l5.2 5.2-1.6 1.6-5.2-5.2A7.5 7.5 0 0 1 10.5 18z"/>
            </svg>
            搜索
          </button>
        </div>

        <div class="user-actions">
          <!-- 用户信息按钮 -->
          <div class="user-info-dropdown">
            <button @click="toggleUserInfo" class="user-info-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
                <path d="M12 12a5 5 0 1 0-0.001-10.001A5 5 0 0 0 12 12zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z"/>
              </svg>
            </button>
            <!-- 用户信息下拉框 -->
            <div v-if="showUserInfo" class="user-dropdown">
              <div class="user-details">
                <!-- 用户头像 -->
                <div class="avatar-section">
                  <div class="avatar-container">
                    <img 
                      v-if="userInfo.avatar" 
                      :src="userInfo.avatar.startsWith('/') ? `http://localhost:3000${userInfo.avatar}` : userInfo.avatar" 
                      :alt="userInfo.username"
                      class="user-avatar"
                    />
                    <div v-else class="default-avatar">
                      {{ userInfo.username.charAt(0).toUpperCase() }}
                    </div>
                    <button @click="triggerAvatarUpload" class="avatar-upload-btn">
                      <svg viewBox="0 0 24 24" fill="currentColor" class="upload-icon">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  </div>
                  <input 
                    ref="avatarInput" 
                    type="file" 
                    accept="image/*" 
                    @change="handleAvatarUpload"
                    style="display: none"
                  />
                </div>
                
                <div class="user-info-text">
                  <div class="username">{{ userInfo.username }}</div>
                  <div class="email">{{ userInfo.email }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 设置按钮 -->
          <div class="settings-dropdown">
            <button @click="toggleSettings" class="settings-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" class="action-icon">
                <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.5 4a2.5 2.5 0 0 0 0-4l-1.5-.9.3-1.7a2.5 2.5 0 0 0-2-2.9l-1.7-.3-.9-1.5a2.5 2.5 0 0 0-4 0L8.2 1.2 6.5 1.5a2.5 2.5 0 0 0-2 2.9l.3 1.7L3.3 7a2.5 2.5 0 0 0 0 4l1.5.9-.3 1.7a2.5 2.5 0 0 0 2 2.9l1.7.3.9 1.5a2.5 2.5 0 0 0 4 0l.9-1.5 1.7-.3a2.5 2.5 0 0 0 2-2.9l-.3-1.7 1.5-.9z"/>
              </svg>
            </button>
            <!-- 设置下拉框 -->
            <div v-if="showSettings" class="settings-dropdown-menu">
              <button @click="logout" class="logout-btn">
                <svg viewBox="0 0 24 24" fill="currentColor" class="logout-icon">
                  <path d="M16 17v-3H9v-4h7V7l5 5-5 5zM14 2a2 2 0 0 1 2 2v2h-2V4H4v16h10v-2h2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10z"/>
                </svg>
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 侧边栏 -->
      <aside class="sidebar">
        <FilterPanel 
          :visible-count="visiblePhotos.length"
          :label-filter="labelFilter"
          :categories="categories"
          @update:label-filter="labelFilter = $event"
          @category-added="handleCategoryAdded"
          @remove-category="handleRemoveCategory"
        />
      </aside>

      <!-- 主区域 -->
      <main class="main-area">
        <UploadArea @files-uploaded="handleFilesUpload" />

        <div class="photo-grid">
          <PhotoCard
            v-for="(photo, idx) in visiblePhotos"
            :key="photo.id"
            :photo="photo"
            @show-detail="selectedPhoto = photo"
            @show-slideshow="showSlideshow(idx)"
          />
        </div>
      </main>
    </div>

    <!-- 详情抽屉 -->
    <DetailDrawer
      v-if="selectedPhoto"
      :photo="selectedPhoto"
      @close="selectedPhoto = null"
      @delete="handleDelete"
      @add-tag="handleAddTag"
      @edit="handleEdit"
    />

    <!-- 图片编辑器 -->
    <ImageEditor
      v-if="editingPhoto"
      :photo="editingPhoto"
      @close="editingPhoto = null"
      @save="handleSaveEditedImage"
    />

    <!-- 幻灯片查看器 -->
    <Slideshow
      v-if="slideshowOpen"
      :photos="visiblePhotos"
      :start-index="slideshowIndex"
      @close="slideshowOpen = false"
    />
  </div>
</template>

<script>
import FilterPanel from './FilterPanel.vue'
import UploadArea from './UploadArea.vue'
import PhotoCard from './PhotoCard.vue'
import DetailDrawer from './DetailDrawer.vue'
import Slideshow from './Slideshow.vue'
import ImageEditor from './ImageEditor.vue'

// API基础URL
const API_BASE = 'http://localhost:3000/api'

export default {
  name: 'Dashboard',
  components: {
    FilterPanel,
    UploadArea,
    PhotoCard,
    DetailDrawer,
    Slideshow,
    ImageEditor
  },
  data() {
    return {
      photos: [],
      searchQuery: '',
      labelFilter: null,
      selectedPhoto: null,
      slideshowOpen: false,
      slideshowIndex: 0,
      loading: false,
      error: null,
      categories: [],
      userInfo: {
        username: localStorage.getItem('username') || '',
        email: localStorage.getItem('email') || '',
        avatar: localStorage.getItem('avatar') || ''
      },
      showUserInfo: false,
      showSettings: false,
      editingPhoto: null
    }
  },
  computed: {
    visiblePhotos() {
      return this.photos.filter(p => {
        const hitQ = !this.searchQuery || 
          [p.filename || p.title, p.ai_description || '', p.category_name || '']
            .join(' ')
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase())
        
        const hitLabel = !this.labelFilter || 
          p.category_name === this.labelFilter
        
        return hitQ && hitLabel
      })
    }
  },
  async mounted() {
    await this.initializeData()
  },
  methods: {
    performSearch() {
      // 搜索功能已经通过 computed 属性 visiblePhotos 自动实现
      // 这个方法主要是为了响应搜索按钮点击事件
      console.log('执行搜索:', this.searchQuery)
    },
    async initializeData() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.error = '请先登录'
        return
      }

      // 从localStorage获取用户信息
      const username = localStorage.getItem('username');
      const email = localStorage.getItem('email');
      if (username) {
        this.userInfo.username = username;
      }
      if (email) {
        this.userInfo.email = email;
      }

      // 首先尝试插入预设图片（只在第一次登录时）
      try {
        const response = await fetch(`${API_BASE}/images/preset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          console.log('预设图片插入成功')
        }
      } catch (error) {
        console.log('预设图片初始化:', error.message)
      }
      
      // 加载分类
      await this.loadCategories()
      
      // 然后加载所有图片
      await this.loadPhotos()
    },
    async loadPhotos() {
      try {
        this.loading = true
        this.error = null
        
        // 获取token
        const token = localStorage.getItem('token')
        if (!token) {
          this.error = '请先登录'
          return
        }

        const response = await fetch(`${API_BASE}/images`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('获取图片失败')
        }

        const data = await response.json()
        
        // 转换数据格式以适配前端组件
        this.photos = data.images.map(img => ({
          id: img.id,
          title: img.filename,
          filename: img.filename,
          src: `http://localhost:3000${img.filepath}`,
          thumbnailPath: img.thumbnail_path ? `http://localhost:3000${img.thumbnail_path}` : null,
          category_name: img.category_name,
          ai_description: img.ai_description,
          ai: {
            labels: img.ai_description ? [img.category_name, '自动'] : ['未分类'],
            score: '0.85'
          },
          userTags: ['已上传'],
          upload_time: img.upload_time,
          width: img.width,
          height: img.height,
          // 添加DetailDrawer需要的数据结构
          exif: {
            time: img.upload_time ? new Date(img.upload_time).toLocaleString('zh-CN') : '未知',
            location: '未知',
            resolution: `${img.width || 0} × ${img.height || 0}`,
            camera: '未知'
          }
        }))

      } catch (error) {
        console.error('加载图片失败:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async loadCategories() {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch(`${API_BASE}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('加载的分类:', data.categories)
          this.categories = data.categories || []
        }
      } catch (error) {
        console.error('加载分类失败:', error)
      }
    },
    handleCategoryAdded(category) {
      // 将新分类添加到列表中
      this.categories.push(category)
    },
    async handleRemoveCategory(categoryId) {
      // 从列表中移除分类
      this.categories = this.categories.filter(c => c.id !== categoryId)
      
      // 如果当前筛选的是被删除的分类，则重置筛选
      const deletedCategory = this.categories.find(c => c.id === categoryId)
      if (deletedCategory && this.labelFilter === deletedCategory.name) {
        this.labelFilter = null
      }
    },
    toggleUserInfo() {
      this.showUserInfo = !this.showUserInfo
      if (this.showUserInfo) {
        this.showSettings = false
      }
    },
    toggleSettings() {
      this.showSettings = !this.showSettings
      if (this.showSettings) {
        this.showUserInfo = false
      }
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('email')
      localStorage.removeItem('avatar')
      this.$emit('logout')
    },
    triggerAvatarUpload() {
      this.$refs.avatarInput.click()
    },
    async handleAvatarUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }

      // 验证文件大小 (最大2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB')
        return
      }

      try {
        const formData = new FormData()
        formData.append('avatar', file)

        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/auth/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          // 确保头像URL格式正确
          const avatarUrl = data.avatarUrl.startsWith('/') ? `http://localhost:3000${data.avatarUrl}` : data.avatarUrl
          this.userInfo.avatar = avatarUrl
          localStorage.setItem('avatar', avatarUrl)
          alert('头像上传成功！')
        } else {
          const error = await response.json()
          alert(error.error || '头像上传失败')
        }
      } catch (error) {
        console.error('头像上传失败:', error)
        alert('头像上传失败，请重试')
      }

      // 清空input
      event.target.value = ''
    },
    async handleFilesUpload(files) {
      try {
        this.loading = true
        
        const token = localStorage.getItem('token')
        if (!token) {
          alert('请先登录')
          this.error = '请先登录'
          return
        }

        let successCount = 0
        for (const file of files) {
          try {
            const formData = new FormData()
            formData.append('image', file)

            const response = await fetch(`${API_BASE}/images/upload`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || `上传 ${file.name} 失败`)
            }

            const result = await response.json()
            console.log('上传成功:', result)
            successCount++
          } catch (error) {
            console.error(`上传 ${file.name} 失败:`, error)
            alert(`上传 ${file.name} 失败: ${error.message}`)
          }
        }

        if (successCount > 0) {
          alert(`成功上传 ${successCount} 张图片！`)
          // 重新加载图片列表
          await this.loadPhotos()
        }
        
      } catch (error) {
        console.error('上传失败:', error)
        this.error = error.message
        alert('上传失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    handleDelete(id) {
      this.photos = this.photos.filter(p => p.id !== id)
      this.selectedPhoto = null
    },
    handleAddTag(tag) {
      const idx = this.photos.findIndex(p => p.id === this.selectedPhoto.id)
      if (idx !== -1) {
        const newTags = Array.from(new Set([...this.photos[idx].userTags, tag]))
        this.photos = [
          ...this.photos.slice(0, idx),
          { ...this.photos[idx], userTags: newTags },
          ...this.photos.slice(idx + 1)
        ]
        // 更新selectedPhoto引用
        this.selectedPhoto = this.photos[idx]
      }
    },
    showSlideshow(index) {
      this.slideshowIndex = index
      this.slideshowOpen = true
    },
    handleEdit(photo) {
      this.editingPhoto = photo
      this.selectedPhoto = null
    },
    handleSaveEditedImage(blob) {
      // 这里可以实现保存编辑后的图片到服务器
      console.log('保存编辑后的图片:', blob)
      this.editingPhoto = null
      alert('图片编辑功能暂未完全实现，请等待后续更新')
    }
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid #e2e8f0;
}

.top-bar-content {
  max-width: 90rem;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-box {
  width: 2.25rem;
  height: 2.25rem;
  display: grid;
  place-items: center;
  border-radius: 0.5rem;
  background: #2563eb;
  color: white;
}

.logo-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.app-name {
  font-weight: 600;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 36rem;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
}

.search-icon {
  width: 1rem;
  height: 1rem;
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
}

.search-input {
  flex: 1;
  border-radius: 0.75rem 0 0 0.75rem;
  border: 1px solid #e2e8f0;
  border-right: none;
  background: white;
  padding: 0.625rem 0.75rem 0.625rem 2.25rem;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0 0.75rem 0.75rem 0;
  background: #2563eb;
  color: white;
  padding: 0.625rem 1rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.search-btn:hover {
  background: #1d4ed8;
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.user-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
}

.user-info-dropdown,
.settings-dropdown {
  position: relative;
}

.user-info-btn,
.settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.user-info-btn:hover,
.settings-btn:hover {
  background: rgba(100, 116, 139, 0.1);
}

.action-icon {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.user-dropdown,
.settings-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  min-width: 200px;
  z-index: 50;
  margin-top: 0.5rem;
}

.user-details {
  padding: 1rem;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.avatar-container {
  position: relative;
  width: 4rem;
  height: 4rem;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.default-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
  border: 2px solid #e2e8f0;
}

.avatar-upload-btn {
  position: absolute;
  bottom: -0.25rem;
  right: -0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-upload-btn:hover {
  background: #1d4ed8;
}

.upload-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.user-info-text {
  text-align: center;
}

.username {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.email {
  font-size: 0.875rem;
  color: #64748b;
}

.logout-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
  color: #ef4444;
  border-radius: 0.75rem;
}

.logout-btn:hover {
  background: #fee2e2;
}

.logout-icon {
  width: 1rem;
  height: 1rem;
}

.main-content {
  max-width: 90rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: grid;
  grid-template-columns: minmax(200px, 250px) 1fr;
  gap: 1.5rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .user-actions {
    display: none;
  }
}
</style>

