<template>
  <div class="room-publi-container">
    <header class="header">
      <router-link :to="isAdmin ? '/admin' : '/my-publications'" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Editar Publicación de Habitación</h1>
      <div class="header-spacer"></div>
    </header>
    <main class="main-content">
      <form @submit.prevent="handleUpdate" class="room-form">
        <div class="form-group">
          <label for="location">DIRECCIÓN</label>
          <input
            type="text"
            id="location"
            v-model="formData.location"
            required
          />
        </div>
        <div class="form-group">
          <label for="price">PRECIO (€ / mes)</label>
          <input
            type="number"
            id="price"
            v-model="formData.price"
            min="0"
            step="50"
            required
          />
        </div>
        <div class="form-group">
          <label for="contract_type">TIPO DE CONTRATO</label>
          <select id="contract_type" v-model="formData.contractType" required>
            <option value="" disabled>Seleccionar tipo</option>
            <option value="Fijo">Fijo</option>
            <option value="Escolar">Escolar</option>
          </select>
        </div>
        <div class="form-section">
          <h3>REQUISITOS</h3>
          <div class="requirements-group">
            <div class="form-group">
              <label for="requisito1">REQUISITO 1</label>
              <select v-model="formData.requirement1">
                <option value="" disabled>Seleccionar requisito</option>
                <option v-for="req in requisitosDisponibles" :key="req.id" :value="req.id">{{ req.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="requisito2">REQUISITO 2</label>
              <select v-model="formData.requirement2">
                <option value="" disabled>Seleccionar requisito</option>
                <option v-for="req in requisitosDisponibles" :key="req.id" :value="req.id">{{ req.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="requisito3">REQUISITO 3</label>
              <select v-model="formData.requirement3">
                <option value="" disabled>Seleccionar requisito</option>
                <option v-for="req in requisitosDisponibles" :key="req.id" :value="req.id">{{ req.nombre }}</option>
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
                <div v-if="getPhotoPreview(n)" class="preview-container">
                  <img :src="getPhotoPreview(n)" class="preview-image" :alt="'Foto ' + n" />
                  <button type="button" class="remove-photo" @click="removePhoto(n)">✕</button>
                  <div v-if="isPhotoMarkedForDeletion(n)" class="deletion-overlay">
                    <span class="deletion-text">Eliminada</span>
                    <button type="button" class="restore-photo" @click.stop="restorePhoto(n)">↺</button>
                  </div>
                </div>
                <div v-else class="upload-placeholder">
                  <span>+</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        <!-- NOTA: Las fotos no se pueden editar aquí por simplicidad, pero puedes añadir lógica si lo necesitas -->
        <div class="form-group">
          <label for="description">DESCRIPCIÓN</label>
          <textarea
            id="description"
            v-model="formData.description"
            maxlength="500"
            rows="4"
            required
          ></textarea>
          <span class="char-count">{{ formData.description.length }}/500</span>
        </div>
        <button type="submit" class="submit-button">
          Guardar Cambios
        </button>
        <div v-if="error" class="error-message">{{ error }}</div>
      </form>
    </main>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  name: 'EditRoomPubli',
  data() {
    return {
      formData: {
        location: '',
        price: '',
        contractType: '',
        description: '',
        requirement1: '',
        requirement2: '',
        requirement3: '',
        photo1: null,
        photo2: null,
        photo3: null,
        preview1: null,
        preview2: null,
        preview3: null
      },
      room: {}, // Added room object to store fetched data
      error: '',
      requisitosDisponibles: [],
      photosToDelete: [] // Track photos to be deleted
    }
  },
  computed: {
    isAdmin() {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.rol === 'Admin' || user.rol === 'admin' || user.role === 'admin';
    }
  },
  async created() {
    try {
      const token = localStorage.getItem('token');
      const roomId = this.$route.params.id;
      // Cargar requisitos disponibles primero
      const reqRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/requisitos`);
      this.requisitosDisponibles = reqRes.data;
      // Cargar datos de la habitación
      const roomRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const roomData = roomRes.data;
      this.room = {
        id: roomData.publicacion_id,
        publicacion_id: roomData.publicacion_id,
        title: roomData.descripcion,
        description: roomData.descripcion,
        location: roomData.direccion,
        price: roomData.precio,
        contract_type: roomData.tipo_contrato,
        requirements: roomData.requisitos || [],
        is_active: roomData.estado === 'Activa',
        user_id: roomData.estudiante_id
      };
      // Cargar fotos
      try {
        const photosRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${roomId}/photos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.room.photos = photosRes.data;
      } catch (photoErr) {
        this.room.photos = [];
      }
      // Asignar valores a los campos del formulario (convierte nombres a IDs si es necesario)
      function getReqId(val) {
        if (!val) return '';
        // If it's a number or numeric string, use as is
        if (!isNaN(val)) return Number(val);
        // Otherwise, look up by name
        const req = this.requisitosDisponibles.find(r => r.nombre === val);
        return req ? req.id : '';
      }
      this.formData = {
        location: this.room.location,
        price: this.room.price,
        contractType: this.room.contract_type || '',
        description: this.room.description,
        requirement1: getReqId.call(this, this.room.requirements[0]),
        requirement2: getReqId.call(this, this.room.requirements[1]),
        requirement3: getReqId.call(this, this.room.requirements[2]),
        photo1: this.room.photos[0] || null,
        photo2: this.room.photos[1] || null,
        photo3: this.room.photos[2] || null,
        preview1: null,
        preview2: null,
        preview3: null
      };
    } catch (err) {
      this.error = err.response?.data?.error || 'Error al cargar la habitación';
    }
  },
  beforeRouteLeave(to, from, next) {
    // Reset photos to delete when leaving the page
    this.photosToDelete = [];
    next();
  },
  methods: {
    async fetchRequirements() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/requisitos`);
        this.requisitosDisponibles = res.data;
        console.log('Requisitos disponibles:', this.requisitosDisponibles);
      } catch (err) {
        console.error('Error cargando requisitos:', err);
        this.error = 'Error al cargar los requisitos disponibles';
      }
    },
    handlePhotoChange(event, number) {
      const file = event.target.files[0];
      if (file) {
        this.formData['photo' + number] = file;
        // Para previsualización
        const reader = new FileReader();
        reader.onload = (e) => {
          this.formData['preview' + number] = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    removePhoto(number) {
      const photoKey = 'photo' + number;
      const currentPhoto = this.formData[photoKey];
      
      if (currentPhoto && confirm('¿Seguro que quieres eliminar esta foto?')) {
        if (typeof currentPhoto === 'string') {
          // Existing photo - add to delete list if not already there
          if (!this.photosToDelete.includes(currentPhoto)) {
            this.photosToDelete.push(currentPhoto);
          }
        }
        // Clear the photo from form data
        this.formData[photoKey] = null;
        // Clear preview if exists
        this.formData['preview' + number] = null;
      }
    },
    restorePhoto(number) {
      const photoKey = 'photo' + number;
      const originalPhoto = this.room.photos[number - 1];
      
      if (originalPhoto && this.photosToDelete.includes(originalPhoto)) {
        // Remove from delete list
        const index = this.photosToDelete.indexOf(originalPhoto);
        if (index > -1) {
          this.photosToDelete.splice(index, 1);
        }
        // Restore the photo
        this.formData[photoKey] = originalPhoto;
      }
    },
    updateRequirement(event, idx) {
      const value = Number(event.target.value);
      if (idx === 0) this.formData.requirement1 = value;
      else if (idx === 1) this.formData.requirement2 = value;
      else if (idx === 2) this.formData.requirement3 = value;
    },
    getPhotoPreview(n) {
      const val = this.formData['photo' + n];
      const preview = this.formData['preview' + n];
      
      // Si hay un preview generado (para archivos nuevos), usarlo
      if (preview) {
        return preview;
      }
      
      // Si es un archivo, mostrar el preview generado
      if (val && typeof val === 'object') {
        return preview || '';
      }
      
      // Si es una string (ruta), construir la URL
      if (typeof val === 'string' && val) {
        if (val.startsWith('http')) return val;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const apiBase = base.replace(/\/api$/, '');
        let imgPath = val;
        if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
        return apiBase + imgPath;
      }
      
      // Placeholder si no hay imagen
      return '';
    },
    isPhotoMarkedForDeletion(number) {
      const photoKey = 'photo' + number;
      const currentPhoto = this.formData[photoKey];
      return currentPhoto && typeof currentPhoto === 'string' && this.photosToDelete.includes(currentPhoto);
    },
    getRequirementIdByName(name) {
      if (!name) return '';
      const req = this.requisitosDisponibles.find(r => r.nombre === name);
      return req ? req.id : '';
    },
    async handleUpdate() {
      this.error = '';
      try {
        const id = this.$route.params.id;
        const token = localStorage.getItem('token');
        // Prepare requirements array - convert to IDs (numbers)
        const selectedRequirements = [this.formData.requirement1, this.formData.requirement2, this.formData.requirement3]
          .filter(Boolean)
          .map(Number);
        // Always send the main fields
        const updates = {
          direccion: this.formData.location,
          precio: this.formData.price,
          tipo_contrato: this.formData.contractType,
          descripcion: this.formData.description,
          requisitos: selectedRequirements,
          photosToDelete: this.photosToDelete
        };
        
        // Check if there are new photos (files)
        const hasNewPhotos = [1, 2, 3].some(n => {
          const photo = this.formData['photo' + n];
          return photo && typeof photo === 'object' && photo instanceof File;
        });
        
        if (hasNewPhotos) {
          // Use FormData for file uploads
          const formData = new FormData();
          for (const key in updates) {
            if (key === 'requisitos') {
              // Send requisitos as JSON string
              formData.append(key, JSON.stringify(updates[key]));
            } else if (key === 'photosToDelete') {
              // Send photosToDelete as JSON string
              formData.append(key, JSON.stringify(updates[key]));
            } else {
              formData.append(key, updates[key]);
            }
          }
          
          // Add new photos
          for (let n = 1; n <= 3; n++) {
            const photo = this.formData['photo' + n];
            if (photo && typeof photo === 'object' && photo instanceof File) {
              formData.append('photos', photo);
            }
          }
          
          await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${id}`, formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
        } else {
          // Send JSON data without files
          await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${id}`, updates, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        if (this.isAdmin) {
          this.$router.push('/admin');
        } else {
          this.$router.push('/my-publications');
        }
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al guardar los cambios';
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

.error-message {
  color: #f44336;
  margin-top: 10px;
  font-size: 14px;
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
  position: relative;
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
  position: relative;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255,255,255,0.8);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.deletion-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  border-radius: 8px;
}

.deletion-text {
  font-size: 18px;
  color: #f44336;
  font-weight: bold;
  margin-bottom: 10px;
}

.restore-photo {
  background: #4CAF50;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.restore-photo:hover {
  background: #388E3C;
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
  .submit-button {
    padding: 12px;
    font-size: 14px;
  }
}
</style> 