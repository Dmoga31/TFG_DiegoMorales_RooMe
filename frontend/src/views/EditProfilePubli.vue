<template>
  <div class="profile-publi-container">
    <header class="header">
      <router-link :to="isAdmin ? '/admin' : '/my-publications'" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Editar Publicación de Perfil</h1>
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
                <option v-for="hobby in hobbies" :key="hobby.value" :value="hobby.value">{{ hobby.label }}</option>
              </select>
            </div>
            <div class="hobby-item">
              <select v-model="formData.hobby2">
                <option value="" disabled>Seleccionar hobby</option>
                <option v-for="hobby in hobbies" :key="hobby.value" :value="hobby.value">{{ hobby.label }}</option>
              </select>
            </div>
            <div class="hobby-item">
              <select v-model="formData.hobby3">
                <option value="" disabled>Seleccionar hobby</option>
                <option v-for="hobby in hobbies" :key="hobby.value" :value="hobby.value">{{ hobby.label }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="presupuesto">PRESUPUESTO (€ / mes)</label>
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
  name: 'EditProfilePubli',
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
      hobbies: [], // será llenado dinámicamente
      profile: null // To store fetched profile data
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
      const profileId = this.$route.params.id;
      console.log('profileId en EditProfilePubli:', profileId); // <-- Log de depuración
      if (!profileId) {
        this.error = 'No se encontró el ID de la publicación de perfil. Vuelve a la lista y selecciona de nuevo.';
        return;
      }
      // Cargar hobbies dinámicamente
      const hobbiesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/hobbies`);
      this.hobbies = hobbiesRes.data.map(h => ({ value: h.id, label: h.nombre }));
      // Fetch profile data
      const profileRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Map backend data to frontend format
      this.profile = profileRes.data;
      // Mapear hobbies a IDs (ya son IDs)
      this.formData = {
        description: this.profile.descripcion_personal,
        budget: this.profile.presupuesto,
        hobby1: this.profile.hobbies[0] || '',
        hobby2: this.profile.hobbies[1] || '',
        hobby3: this.profile.hobbies[2] || ''
      };
    } catch (err) {
      this.error = err.response?.data?.error || 'Error al cargar el perfil';
    }
  },
  methods: {
    getHobbyNameById(id) {
      const hobby = this.hobbies.find(h => Number(h.value) === Number(id));
      return hobby ? hobby.label : id;
    },
    async handleSubmit() {
      this.error = '';
      // Filtrar y validar hobbies igual que requisitos en habitaciones
      const selectedHobbies = [this.formData.hobby1, this.formData.hobby2, this.formData.hobby3]
        .filter(Boolean)
        .map(h => Number(h))
        .filter(h => Number.isInteger(h) && h > 0);
      if (new Set(selectedHobbies).size !== selectedHobbies.length) {
        this.error = 'No puedes seleccionar el mismo hobby más de una vez';
        return;
      }
      // Validar que al menos un hobby esté seleccionado
      if (selectedHobbies.length === 0) {
        this.error = 'Debes seleccionar al menos un hobby';
        return;
      }
      // Validar presupuesto como número
      const presupuestoNum = Number(this.formData.budget);
      if (isNaN(presupuestoNum) || presupuestoNum <= 0) {
        this.error = 'El presupuesto debe ser un número mayor a 0';
        return;
      }
      try {
        const updates = {
          descripcion_personal: this.formData.description,
          presupuesto: presupuestoNum,
          hobbies: selectedHobbies
        };
        const token = localStorage.getItem('token');
        const profileId = this.$route.params.id;
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/${profileId}`, updates, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (this.isAdmin) {
          this.$router.push('/admin');
        } else {
          this.$router.push('/my-publications');
        }
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al actualizar el perfil';
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

.error-message {
  color: #f44336;
  margin-top: 10px;
  font-size: 14px;
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