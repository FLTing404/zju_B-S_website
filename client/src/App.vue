<template>
  <div id="app">
    <AuthCard v-if="!authed" @login="handleLogin" />
    <Dashboard v-else @logout="handleLogout" />
  </div>
</template>

<script>
import AuthCard from './components/AuthCard.vue'
import Dashboard from './components/Dashboard.vue'

export default {
  name: 'App',
  components: {
    AuthCard,
    Dashboard
  },
  data() {
    return {
      authed: false
    }
  },
  mounted() {
    // 检查是否已经登录
    const token = localStorage.getItem('token')
    if (token) {
      this.authed = true
    }
  },
  methods: {
    handleLogin(token) {
      this.authed = true
    },
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('email')
      this.authed = false
    }
  }
}
</script>

