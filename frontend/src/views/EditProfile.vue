<template>
  <div class="edit-profile-container">
    <header class="header">
      <router-link to="/profile" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>EDITAR PERFIL</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="main-content">
      <form @submit.prevent="handleUpdate" class="edit-form">
        <div class="form-group">
          <label for="nombre">NOMBRE/S</label>
          <input
            type="text"
            id="nombre"
            v-model="formData.nombre"
            required
          />
        </div>

        <div class="form-group">
          <label for="apellidos">APELLIDOS</label>
          <input
            type="text"
            id="apellidos"
            v-model="formData.apellidos"
            required
          />
        </div>

        <div class="form-group">
          <label for="correo_institucional">CORREO INSTITUCIONAL</label>
          <input
            type="email"
            id="correo_institucional"
            v-model="formData.correo_institucional"
            placeholder="ejemplo@alumnos.uneatlantico.es"
            disabled
          />
        </div>

        <div class="form-group">
          <label for="password">NUEVA CONTRASEÑA (opcional)</label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            minlength="6"
          />
        </div>

        <div class="form-group" v-if="formData.password">
          <label for="confirmPassword">CONFIRMAR NUEVA CONTRASEÑA</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="formData.confirmPassword"
            minlength="6"
          />
          <span class="error-message" v-if="passwordError">{{ passwordError }}</span>
        </div>

        <div class="form-group">
          <label for="carrera">CARRERA</label>
          <select id="carrera" v-model="formData.carrera_id" required>
            <option value="" disabled>Selecciona una carrera</option>
            <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
              {{ carrera.nombre }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="genero">GÉNERO</label>
          <select id="genero" v-model="formData.genero" required>
            <option value="" disabled>Seleccionar</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div class="form-group">
          <label for="edad">EDAD</label>
          <input
            type="number"
            id="edad"
            v-model="formData.edad"
            min="16"
            max="99"
            required
          />
        </div>

        <div class="form-section">
          <h3>REDES SOCIALES</h3>
          
          <div class="social-input">
            <span class="social-icon whatsapp">📱</span>
            <input
              type="tel"
              v-model="formData.whatsapp"
              placeholder="+1234567890"
              pattern="^\+?[0-9]{8,15}$"
            />
          </div>

          <div class="social-input">
            <span class="social-icon instagram">📸</span>
            <input
              type="text"
              v-model="formData.instagram"
              placeholder="@user"
            />
          </div>
        </div>

        <div class="form-section">
          <h3>FOTO DE PERFIL</h3>
          <div class="profile-upload-container">
            <div class="profile-upload" @click="triggerFileInput">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileChange"
                accept="image/*"
                class="file-input"
              />
              <div class="upload-placeholder" v-if="!profileImageUrl">
                <span>+</span>
              </div>
              <img v-if="profileImageUrl" :src="profileImageUrl" alt="Preview" class="preview-image" />
            </div>
          </div>
        </div>

        <button type="submit" class="update-button" :disabled="!!passwordError">ACTUALIZAR</button>
      </form>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';

export default {
  name: 'EditProfile',
  data() {
    return {
      formData: {
        nombre: '',
        apellidos: '',
        correo_institucional: '',
        password: '',
        confirmPassword: '',
        carrera_id: '',
        genero: '',
        edad: '',
        whatsapp: '',
        instagram: '',
        foto_perfil: null
      },
      previewImage: null,
      error: '',
      carreras: []
    }
  },
  computed: {
    ...mapGetters(['currentUser']),
    passwordError() {
      if (this.formData.password && this.formData.confirmPassword &&
          this.formData.password !== this.formData.confirmPassword) {
        return 'Las contraseñas no coinciden'
      }
      return ''
    },
    profileImageUrl() {
      // Si el usuario seleccionó una nueva imagen, mostrarla (base64)
      if (this.previewImage && typeof this.previewImage === 'string' && this.previewImage.startsWith('data:')) {
        return this.previewImage;
      }
      // Si hay una imagen de perfil en el usuario, construir la URL completa
      const user = this.currentUser;
      let imgPath = user && user.foto_perfil ? user.foto_perfil : null;
      if (imgPath) {
        // Si es una URL absoluta, úsala tal cual
        if (imgPath.startsWith('http')) return imgPath;
        // Si es una ruta relativa, prepende el dominio del backend
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const apiBase = base.replace(/\/api$/, '');
        if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
        return apiBase + imgPath;
      }
      return null;
    }
  },
  created() {
    // Pre-fill form with current user data
    const user = this.currentUser
    if (user) {
      this.formData = {
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        correo_institucional: user.correo_institucional || '',
        password: '',
        confirmPassword: '',
        carrera_id: user.carrera_id || '',
        genero: user.genero || '',
        edad: user.edad || '',
        whatsapp: user.whatsapp || '',
        instagram: user.instagram || '',
        foto_perfil: null
      }
      this.previewImage = null; // <-- Importante: solo usar previewImage para nueva imagen
    }
  },
  async mounted() {
    this.fetchCarreras();
    // Fetch complete user data from backend to ensure all fields are loaded
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.user) {
        const user = response.data.user
        // Update form with complete user data
        this.formData = {
          nombre: user.nombre || '',
          apellidos: user.apellidos || '',
          correo_institucional: user.correo_institucional || '',
          password: '',
          confirmPassword: '',
          carrera_id: user.carrera_id || '',
          genero: user.genero || '',
          edad: user.edad || '',
          whatsapp: user.whatsapp || '',
          instagram: user.instagram || '',
          foto_perfil: null
        }
        this.previewImage = null; // <-- Importante: solo usar previewImage para nueva imagen
        // Update Vuex store with complete user data
        this.$store.commit('setUser', user)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  },
  methods: {
    async fetchCarreras() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/carreras`);
        this.carreras = response.data;
      } catch (error) {
        console.error('Error al obtener carreras:', error);
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file) {
        this.formData.foto_perfil = file
        const reader = new FileReader()
        reader.onload = e => {
          this.previewImage = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    async handleUpdate() {
      try {
        if (this.formData.password && this.passwordError) {
          return;
        }

        // Only send fields that have changed and are not empty
        const updates = {};
        const originalUser = this.currentUser;

        // List of fields to check
        const fields = [
          'nombre', 'apellidos', 'carrera_id', 'genero', 'edad',
          'whatsapp', 'instagram'
        ];

        for (const field of fields) {
          const currentValue = this.formData[field];
          const originalValue = originalUser[field];
          if (
            currentValue !== undefined &&
            currentValue !== originalValue &&
            currentValue !== ''
          ) {
            updates[field] = currentValue;
          }
        }

        // Handle password
        if (this.formData.password && this.formData.password.trim() !== '') {
          updates.password = this.formData.password;
        }

        let payload = updates;
        let config = {};

        // Handle profile image
        if (this.formData.foto_perfil) {
          // If using FormData, always append the image
          payload = new FormData();
          // Append all changed fields
          for (const [key, value] of Object.entries(updates)) {
            if (key === 'carrera_id' || key === 'edad') {
              payload.append(key, Number(value));
            } else {
              payload.append(key, value);
            }
          }
          // Always append the image if present
          payload.append('foto_perfil', this.formData.foto_perfil);
          config.headers = { 'Content-Type': 'multipart/form-data' };
        }

        // If no changes, show message and return
        if (
          Object.keys(updates).length === 0 &&
          !this.formData.foto_perfil
        ) {
          alert('No hay cambios para guardar');
          return;
        }

        // Debug: log what is being sent
        if (payload instanceof FormData) {
          for (let pair of payload.entries()) {
            console.log(pair[0]+ ': ' + pair[1]);
          }
        } else {
          // Si se envía como JSON
          if ('carrera_id' in payload) payload.carrera_id = Number(payload.carrera_id);
          if ('edad' in payload) payload.edad = Number(payload.edad);
          console.log('Payload:', payload);
        }

        // Send update to backend
        const token = localStorage.getItem('token');
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };

        const response = await axios.put(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/me`,
          payload,
          config
        );

        // Update Vuex store with new user data
        if (response.data.user) {
          this.$store.commit('setUser', response.data.user);
        }

        alert('Perfil actualizado correctamente');
        this.$router.push('/profile');
      } catch (error) {
        this.error = error.response?.data?.error || 'Error al actualizar el perfil';
        alert(this.error);
      }
    }
  }
}
</script>

<style scoped>
.edit-profile-container {
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
  max-width: 500px;
  margin: 0 auto;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #3498db;
  outline: none;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-section h3 {
  color: #2c3e50;
  font-size: 14px;
  margin: 0;
}

.social-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.social-icon {
  font-size: 24px;
  width: 40px;
  text-align: center;
}

.social-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
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

.update-button {
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

.update-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.update-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .form-group input,
  .form-group select,
  .social-input input {
    padding: 10px;
    font-size: 14px;
  }

  .profile-upload {
    width: 120px;
    height: 120px;
  }
}
</style> 