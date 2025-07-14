<template>
  <div class="profile-publi-container">
    <header class="header">
      <router-link to="/new-publi-type" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Nueva Publicación de Perfil</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="main-content">
      <form @submit.prevent="handleSubmit" class="profile-form">
        <div class="form-group">
          <label for="sobreTi">SOBRE TI</label>
          <textarea
            id="sobreTi"
            v-model="formData.description"
            maxlength="500"
            rows="4"
            required
          ></textarea>
          <span class="char-count">{{ formData.description.length }}/500</span>
        </div>

        <div class="form-section">
          <h3>HOBBIES</h3>
          <div class="hobbies-group">
            <div class="hobby-item">
              <select v-model="formData.hobby1" required>
                <option value="" disabled>Seleccionar hobby</option>
                <option v-for="hobby in hobbies" :key="hobby.value" :value="hobby.value">
                  {{ hobby.label }}
                </option>
              </select>
            </div>
            <div class="hobby-item">
              <select v-model="formData.hobby2">
                <option value="" disabled>Seleccionar hobby</option>
                <option v-for="hobby in hobbies" :key="hobby.value" :value="hobby.value">
                  {{ hobby.label }}
                </option>
              </select>
            </div>
            <div class="hobby-item">
              <select v-model="formData.hobby3">
                <option value="" disabled>Seleccionar hobby</option>
                <option v-for="hobby in hobbies" :key="hobby.value" :value="hobby.value">
                  {{ hobby.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="presupuesto">PRESUPUESTO (€/mes)</label>
          <input
            type="number"
            id="presupuesto"
            v-model="formData.budget"
            min="0"
            step="50"
            required
          />
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
const HOBBIES = [
  { value: 1, label: 'Deporte' },
  { value: 2, label: 'Ver películas' },
  { value: 3, label: 'Cocinar' },
  { value: 4, label: 'Escuchar música' },
  { value: 5, label: 'Leer' },
  { value: 6, label: 'Salir de fiesta' }
];
export default {
  name: 'NewProfilePubli',
  data() {
    return {
      formData: {
        description: '',
        hobby1: '',
        hobby2: '',
        hobby3: '',
        budget: ''
      },
      error: '',
      hobbies: HOBBIES
    }
  },
  computed: {
    selectedHobbies() {
      // Devuelve solo los IDs de hobbies seleccionados
      return [this.formData.hobby1, this.formData.hobby2, this.formData.hobby3].filter(Boolean).map(Number);
    }
  },
  methods: {
    async handleSubmit() {
      this.error = '';
      try {
        // Prepare payload with correct field names
        const payload = {
          descripcion_personal: this.formData.description,
          presupuesto: this.formData.budget,
          hobbies: this.selectedHobbies
        };
        
        // Send to backend
        const token = localStorage.getItem('token');
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Redirect to profile feed
        this.$router.push('/profiles');
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al publicar el perfil';
      }
    }
  }
}
</script>

<style scoped>
.profile-publi-container {
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

.profile-form {
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

.hobbies-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hobby-item select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.hobby-item select:focus {
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

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .profile-form {
    padding: 20px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea,
  .hobby-item select {
    padding: 10px;
    font-size: 14px;
  }

  .submit-button {
    padding: 12px;
    font-size: 14px;
  }
}
</style>
