<template>
  <div class="edit-user-container">
    <header class="header">
      <router-link to="/admin" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Editar Usuario</h1>
      <div class="header-spacer"></div>
    </header>
    <main class="main-content">
      <form @submit.prevent="handleSubmit" class="user-form">
        <div class="form-group">
          <label for="nombre">Nombre</label>
          <input id="nombre" v-model="formData.nombre" required />
        </div>
        <div class="form-group">
          <label for="apellidos">Apellidos</label>
          <input id="apellidos" v-model="formData.apellidos" required />
        </div>
        <div class="form-group">
          <label for="correo">Email</label>
          <input id="correo" v-model="formData.correo_institucional" type="email" required />
        </div>
        <div class="form-group">
          <label for="rol">Rol</label>
          <select id="rol" v-model="formData.rol" required>
            <option value="Admin">Admin</option>
            <option value="estudiante">Estudiante</option>
          </select>
        </div>
        <button type="submit" class="submit-button">Guardar Cambios</button>
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>
    </main>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'EditUser',
  data() {
    return {
      formData: {
        nombre: '',
        apellidos: '',
        correo_institucional: '',
        rol: ''
      },
      error: '',
      userId: null
    }
  },
  async created() {
    try {
      const token = localStorage.getItem('token');
      this.userId = this.$route.params.id;
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/users/${this.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.formData = {
        nombre: res.data.nombre,
        apellidos: res.data.apellidos,
        correo_institucional: res.data.correo_institucional,
        rol: res.data.rol
      };
    } catch (err) {
      this.error = err.response?.data?.error || 'Error al cargar el usuario';
    }
  },
  methods: {
    async handleSubmit() {
      this.error = '';
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/users/${this.userId}`, this.formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.$router.push('/admin');
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al guardar los cambios';
      }
    }
  }
}
</script>
<style scoped>
.edit-user-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
.header {
  background-color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.back-button {
  font-size: 24px;
  text-decoration: none;
  color: #2c3e50;
  padding: 5px 15px;
}
.header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
}
.header-spacer {
  width: 40px;
}
.main-content {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}
.user-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  color: #2c3e50;
  font-size: 14px;
  font-weight: bold;
}
.form-group input,
.form-group select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #3498db;
  outline: none;
}
.submit-button {
  background-color: #3498db;
  color: white;
  padding: 15px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 20px;
}
.submit-button:hover {
  background-color: #2980b9;
}
.error-message {
  color: #f44336;
  margin-top: 10px;
  font-size: 14px;
}
</style> 