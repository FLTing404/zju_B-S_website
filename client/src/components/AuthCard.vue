<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-box">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 9l3.5-4.5 2.5 3L16 12l2 4H8z"/>
          </svg>
        </div>
        <div>
          <h1 class="app-title">SmartPic</h1>
          <p class="app-subtitle">智能图片管理系统</p>
        </div>
      </div>

      <div class="mode-tabs">
        <button 
          @click="mode = 'login'" 
          :class="['tab-btn', { active: mode === 'login' }]"
        >
          登录
        </button>
        <button 
          @click="mode = 'register'" 
          :class="['tab-btn', { active: mode === 'register' }]"
        >
          注册
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <label class="form-label">用户名</label>
        <input 
          v-model="username" 
          placeholder="请输入用户名" 
          :class="['form-input', { invalid: username && !validUsername }]"
        />

        <template v-if="mode === 'register'">
          <label class="form-label">邮箱</label>
          <input 
            v-model="email" 
            placeholder="you@example.com" 
            :class="['form-input', { invalid: email && !validEmail }]"
          />
        </template>

        <label class="form-label">密码</label>
        <input 
          type="password" 
          v-model="password" 
          placeholder="请输入密码" 
          :class="['form-input', { invalid: password && !strongPwd }]"
        />

        <button 
          type="submit" 
          :disabled="!canSubmit" 
          class="submit-btn"
        >
          {{ mode === 'login' ? '登录' : '创建账户' }}
        </button>
        
        <p class="terms">继续即表示您同意我们的条款和隐私政策</p>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthCard',
  data() {
    return {
      mode: 'login',
      username: '',
      email: '',
      password: '',
      error: '',
      loading: false
    }
  },
  computed: {
    validEmail() {
      return /.+@.+\..+/.test(this.email)
    },
    strongPwd() {
      // 按字节计算密码长度
      return new TextEncoder().encode(this.password).length >= 6
    },
    validUsername() {
      // 按字节计算用户名长度
      return new TextEncoder().encode(this.username).length >= 6
    },
    canSubmit() {
      return this.validUsername && 
             this.strongPwd && 
             (this.mode === 'login' || this.validEmail)
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.canSubmit || this.loading) return
      
      this.error = ''
      this.loading = true

      try {
        const endpoint = this.mode === 'login' ? '/api/auth/login' : '/api/auth/register'
        const body = this.mode === 'login' 
          ? { username: this.username, password: this.password }
          : { username: this.username, password: this.password, email: this.email }

        const response = await fetch(`http://localhost:3000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '操作失败')
        }

        if (this.mode === 'register') {
          // 注册成功后切换到登录模式
          alert('注册成功！请登录')
          this.mode = 'login'
          this.password = ''
          this.email = ''
        } else {
          // 登录成功，保存token和用户信息并触发登录事件
          localStorage.setItem('token', data.token)
          localStorage.setItem('username', data.user.username)
          localStorage.setItem('email', data.user.email)
          localStorage.setItem('avatar', data.user.avatar || '')
          this.$emit('login', data.token)
        }
      } catch (error) {
        this.error = error.message
        alert(error.message)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%);
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 28rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.auth-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.logo-box {
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border-radius: 0.75rem;
  background: #2563eb;
  color: white;
}

.logo-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.app-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-btn {
  flex: 1;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  background: #f1f5f9;
  color: #475569;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #2563eb;
  color: white;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  color: #475569;
  margin-bottom: 0.25rem;
  margin-top: 0.75rem;
}

.form-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  padding: 0.625rem 0.75rem;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-input.invalid {
  border-color: #f87171;
}

.form-input.invalid:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.submit-btn {
  width: 100%;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  margin-top: 1.25rem;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: #2563eb;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.submit-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.terms {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}
</style>

