<template>
  <div class="login-container">
    <div class="login-card">
      <h1>RooMe</h1>
      <h2>Iniciar Sesión</h2>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input
            type="email"
            v-model="email"
            placeholder="Correo electrónico"
            required
          />
        </div>
        <div class="form-group">
          <input
            type="password"
            v-model="password"
            placeholder="Contraseña"
            required
          />
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
  <!--       <div class="default-user-info">
          <p>Usuario por defecto:</p>
          <p>Email: demo@roome.com</p>
          <p>Contraseña: 123456</p>
        </div> -->
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>
      <p class="register-link">
        ¿No tienes cuenta? 
        <router-link to="/register">Regístrate aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      error: '',
      loading: false
    }
  },
  methods: {
    ...mapActions(['login']),
    async handleLogin() {
      this.error = ''
      this.loading = true
      try {
        const user = await this.login({ correo_institucional: this.email.toLowerCase(), password: this.password })
        // Redirigir según el rol
        if (user && (user.rol === 'Admin' || user.rol === 'admin' || user.role === 'admin')) {
          this.$router.push('/admin/dashboard')
        } else {
          this.$router.push('/menu')
        }
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

h2 {
  color: #34495e;
  margin-bottom: 30px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #3498db;
  outline: none;
}

.login-button {
  background-color: #3498db;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.login-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.register-link {
  margin-top: 20px;
  color: #7f8c8d;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin: 0;
}

.default-user-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  text-align: left;
}

.default-user-info p {
  margin: 5px 0;
}
</style> 