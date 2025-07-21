<template>
  <div class="register-container">
    <header class="header">
      <router-link to="/admin/dashboard" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Crear Nuevo Usuario</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="main-content">
      <form @submit.prevent="handleRegister" class="register-form">
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
          <label for="correo">CORREO INSTITUCIONAL</label>
          <input
            type="email"
            id="correo"
            v-model="formData.correo_institucional"
            placeholder="ejemplo@alumnos.uneatlantico.es"
            pattern=".*@alumnos\.uneatlantico\.es$"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">CONTRASEÑA</label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            required
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">CONFIRMAR CONTRASEÑA</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="formData.confirmPassword"
            required
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
            <option value="" disabled>Selecciona tu género</option>
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
              <div class="upload-placeholder" v-if="!previewImage">
                <span>+</span>
              </div>
              <img v-else :src="previewImage" alt="Preview" class="preview-image" />
            </div>
          </div>
        </div>

        <button type="submit" class="register-button">Crear Usuario</button>
      </form>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'CreateUser',
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
      carreras: []
    }
  },
  computed: {
    passwordError() {
      if (this.formData.password && this.formData.confirmPassword &&
          this.formData.password !== this.formData.confirmPassword) {
        return 'Las contraseñas no coinciden'
      }
      return ''
    }
  },
  mounted() {
    this.fetchCarreras();
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
    async handleRegister() {
      try {
        if (this.passwordError) {
          return
        }
        // Convert email to lowercase
        this.formData.correo_institucional = this.formData.correo_institucional.toLowerCase();
        if (!this.formData.correo_institucional.endsWith('@alumnos.uneatlantico.es')) {
          alert('Por favor, utiliza tu correo institucional (@alumnos.uneatlantico.es)')
          return
        }
        
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('nombre', this.formData.nombre);
        formData.append('apellidos', this.formData.apellidos);
        formData.append('correo_institucional', this.formData.correo_institucional);
        formData.append('password', this.formData.password);
        formData.append('carrera_id', Number(this.formData.carrera_id));
        formData.append('genero', this.formData.genero);
        formData.append('edad', Number(this.formData.edad));
        formData.append('whatsapp', this.formData.whatsapp);
        formData.append('instagram', this.formData.instagram);
        if (this.formData.foto_perfil) {
          formData.append('foto_perfil', this.formData.foto_perfil);
        }
        
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/users`,
          formData, {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        alert('Usuario creado con éxito');
        this.$router.push('/admin/dashboard');
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          window.alert(error.response.data.error);
        } else {
          window.alert('Error al crear el usuario. Intenta de nuevo.');
        }
        console.error('Create user error:', error);
      }
    }
  }
}
</script>

<style scoped>
/* Copiando los estilos de Register.vue */
.register-container {
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

.register-form {
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

.register-button {
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

.register-button:hover {
  background-color: #2980b9;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}
</style> 