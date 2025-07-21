<template>
  <div class="edit-user-container">
    <header class="header">
      <router-link to="/admin/dashboard" class="back-button">
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
            <option value="Estudiante">Estudiante</option>
          </select>
        </div>
        <div class="form-group">
          <label for="carrera">Carrera</label>
          <select id="carrera" v-model="formData.carrera_id" required>
            <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="genero">Género</label>
          <select id="genero" v-model="formData.genero" required>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label for="edad">Edad</label>
          <input id="edad" v-model="formData.edad" type="number" required />
        </div>
        <div class="form-group">
          <label for="whatsapp">WhatsApp</label>
          <input id="whatsapp" v-model="formData.whatsapp" />
        </div>
        <div class="form-group">
          <label for="instagram">Instagram</label>
          <input id="instagram" v-model="formData.instagram" />
        </div>
        <div class="form-section">
          <h3>FOTO DE PERFIL</h3>
          <div class="profile-upload-container">
            <div class="profile-upload" @click="triggerFileInput">
              <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" class="file-input" />
              <div class="upload-placeholder" v-if="!previewImage">
                <img :src="formData.foto_perfil_url || '/default-avatar.png'" alt="Avatar" class="preview-image" />
              </div>
              <img v-else :src="previewImage" alt="Preview" class="preview-image" />
            </div>
          </div>
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
        rol: 'Estudiante',
        carrera_id: '',
        genero: '',
        edad: '',
        whatsapp: '',
        instagram: '',
        foto_perfil: null,
        foto_perfil_url: ''
      },
      previewImage: null,
      carreras: [],
      error: '',
      userId: null
    }
  },
  async created() {
    this.userId = this.$route.params.id;
    await this.fetchCarreras();
    await this.fetchUser();
  },
  methods: {
    async fetchUser() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/users/${this.userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.formData = { ...this.formData, ...res.data };
        if (res.data.foto_perfil) {
          const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
          let imgPath = res.data.foto_perfil;
          if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
          this.formData.foto_perfil_url = base + imgPath;
        } else {
          this.formData.foto_perfil_url = '';
        }
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al cargar el usuario';
      }
    },
    async fetchCarreras() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/carreras`);
        this.carreras = response.data;
      } catch (error) {
        console.error('Error al obtener carreras:', error);
        this.error = 'Error al cargar las carreras.';
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.formData.foto_perfil = file;
        const reader = new FileReader();
        reader.onload = e => {
          this.previewImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    async handleSubmit() {
      this.error = '';
      try {
        const token = localStorage.getItem('token');
        const formDataToSubmit = new FormData();

        Object.keys(this.formData).forEach(key => {
          if (key === 'foto_perfil' && this.formData[key]) {
            formDataToSubmit.append(key, this.formData[key]);
          } else if (key !== 'foto_perfil' && key !== 'foto_perfil_url') {
            formDataToSubmit.append(key, this.formData[key]);
          }
        });

        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/users/${this.userId}`, formDataToSubmit, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        this.$router.push('/admin/dashboard');
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
.form-group, .form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label, .form-section h3 {
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
.profile-upload-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 10px 0;
}
.profile-upload {
  width: 150px;
  height: 150px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color 0.3s;
}
.profile-upload:hover {
  border-color: #3498db;
}
.upload-placeholder {
  font-size: 48px;
  color: #ddd;
}
.file-input {
  display: none;
}
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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