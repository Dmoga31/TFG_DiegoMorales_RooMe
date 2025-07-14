<template>
  <div class="room-publi-container">
    <header class="header">
      <router-link to="/new-publi-type" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Nueva Publicación de Habitación</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="main-content">
      <form @submit.prevent="handleSubmit" class="room-form">
        <div class="form-group">
          <label for="direccion">DIRECCIÓN</label>
          <input
            type="text"
            id="direccion"
            v-model="formData.location"
            required
          />
        </div>

        <div class="form-group">
          <label for="precio">PRECIO (€/mes)</label>
          <input
            type="number"
            id="precio"
            v-model="formData.price"
            min="0"
            step="50"
            required
          />
        </div>

        <div class="form-group">
          <label for="tipoContrato">TIPO DE CONTRATO</label>
          <select id="tipoContrato" v-model="formData.contractType" required>
            <option value="" disabled>Seleccionar tipo</option>
            <option value="Fijo">Fijo</option>
            <option value="Escolar">Escolar</option>
          </select>
        </div>

        <div class="form-section">
          <h3>REQUISITOS</h3>
          <div class="requirements-group">
            <div class="requirement-item">
              <select v-model="formData.requirement1" required>
                <option value="" disabled>Seleccionar requisito</option>
                <option v-for="req in requisitosDisponibles" :key="req.id" :value="req.id">
                  {{ req.nombre }}
                </option>
              </select>
            </div>
            <div class="requirement-item">
              <select v-model="formData.requirement2">
                <option value="" disabled>Seleccionar requisito</option>
                <option v-for="req in requisitosDisponibles" :key="req.id" :value="req.id">
                  {{ req.nombre }}
                </option>
              </select>
            </div>
            <div class="requirement-item">
              <select v-model="formData.requirement3">
                <option value="" disabled>Seleccionar requisito</option>
                <option v-for="req in requisitosDisponibles" :key="req.id" :value="req.id">
                  {{ req.nombre }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>FOTOS</h3>
          <div class="photos-container">
            <div class="photo-upload" v-for="n in 3" :key="n">
              <input
                type="file"
                :id="'photo' + n"
                :ref="'photoInput' + n"
                class="file-input"
                accept="image/*"
                @change="handlePhotoChange($event, n)"
              />
              <label :for="'photo' + n" class="photo-label">
                <div v-if="formData['preview' + n]" class="preview-container">
                  <img :src="formData['preview' + n]" class="preview-image" :alt="'Photo ' + n" />
                </div>
                <div v-else class="upload-placeholder">
                  <span>+</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="descripcion">DESCRIPCIÓN</label>
          <textarea
            id="descripcion"
            v-model="formData.description"
            maxlength="500"
            rows="4"
            required
          ></textarea>
          <span class="char-count">{{ formData.description.length }}/500</span>
        </div>

        <button type="submit" class="submit-button">
          Publicar
        </button>
      </form>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'NewRoomPubli',
  data() {
    return {
      formData: {
        location: '',
        price: '',
        contractType: '',
        requirement1: '',
        requirement2: '',
        requirement3: '',
        photo1: null,
        photo2: null,
        photo3: null,
        description: ''
      },
      requisitosDisponibles: [],
      error: '',
      uploadedPhotos: []
    }
  },
  async mounted() {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/requisitos`);
      this.requisitosDisponibles = res.data;
      console.log('Requisitos cargados:', this.requisitosDisponibles);
    } catch (e) {
      console.error('Error cargando requisitos:', e);
      this.error = "No se pudieron cargar los requisitos";
    }
  },
  methods: {
    handlePhotoChange(event, number) {
      const file = event.target.files[0]
      if (file) {
        this.formData['photo' + number] = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.formData['preview' + number] = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    async uploadPhoto(photoFile) {
      if (!photoFile) return null;
      const formData = new FormData();
      formData.append('photo', photoFile);
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.path;
    },
    async handleSubmit() {
      this.error = '';
      try {
        // Subir fotos primero y obtener rutas
        this.uploadedPhotos = [];
        for (let i = 1; i <= 3; i++) {
          const photoFile = this.formData['photo' + i];
          if (photoFile) {
            const path = await this.uploadPhoto(photoFile);
            if (path) this.uploadedPhotos.push(path);
          }
        }
        // Prepare requirements array - convert to IDs (numbers)
        const selectedRequirements = [this.formData.requirement1, this.formData.requirement2, this.formData.requirement3]
          .filter(Boolean)
          .map(Number);
        // Prepare payload with correct field names
        const payload = {
          direccion: this.formData.location,
          precio: this.formData.price,
          tipo_contrato: this.formData.contractType,
          descripcion: this.formData.description,
          requisitos: selectedRequirements,
          fotos: this.uploadedPhotos
        };
        // Send to backend
        const token = localStorage.getItem('token');
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Redirect to room feed
        this.$router.push('/rooms');
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al publicar la habitación';
      }
    }
  }
}
</script>

<style scoped>
.room-publi-container {
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

.room-form {
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
.form-group select,
.form-group textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
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
  font-weight: bold;
}

.requirements-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.requirement-item select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.requirement-item select:focus {
  border-color: #3498db;
  outline: none;
}

.photos-container {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.photo-upload {
  width: calc(33.33% - 10px);
  aspect-ratio: 1;
}

.file-input {
  display: none;
}

.photo-label {
  width: 100%;
  height: 100%;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.photo-label:hover {
  border-color: #3498db;
}

.upload-placeholder {
  font-size: 32px;
  color: #ddd;
}

.preview-container {
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.char-count {
  font-size: 12px;
  color: #666;
  text-align: right;
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

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .room-form {
    padding: 20px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea,
  .requirement-item select {
    padding: 10px;
    font-size: 14px;
  }

  .photo-upload {
    width: calc(50% - 7.5px);
  }

  .submit-button {
    padding: 12px;
    font-size: 14px;
  }
}
</style>
