<template>
<div class="feed-container">
  <header class="header">
    <router-link to="/menu" class="back-button">
      <i class="fa-solid fa-arrow-left"></i>
    </router-link>
    <h1>Perfiles RooMe</h1>
    <router-link to="/profile" class="profile-link">👤</router-link>
  </header>

  <div class="feed-filters">
    <button class="filter-button" @click="showFilters = true">
      <span class="filter-icon">⚏</span>
      Filtros
    </button>
  </div>

  <!-- Filter Modal -->
  <div class="modal" v-if="showFilters">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Filtrar por Hobbies</h2>
        <button class="close-button" @click="showFilters = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="filter-options">
          <label class="filter-option" v-for="hobby in availableHobbies" :key="hobby.value">
            <input 
              type="checkbox" 
              :value="hobby.value" 
              v-model="selectedHobbies"
              @change="applyFilters"
            >
            <span>{{ hobby.label }}</span>
          </label>
        </div>
        <div class="filter-options" style="margin-top: 20px;">
          <label class="filter-option">
            <span>Género:</span>
            <select v-model="selectedGender" style="margin-left: 10px;">
              <option value="">Todos</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
        </div>
        <div class="filter-options" style="margin-top: 20px;">
          <label class="filter-option">
            <span>Presupuesto mínimo:</span>
            <input type="number" v-model="minBudget" min="0" style="margin-left: 10px; width: 100px;">
          </label>
          <label class="filter-option">
            <span>Presupuesto máximo:</span>
            <input type="number" v-model="maxBudget" min="0" style="margin-left: 10px; width: 100px;">
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="clear-button" @click="clearFilters">Limpiar Filtros</button>
        <button class="apply-button" @click="showFilters = false">Cerrar</button>
      </div>
    </div>
  </div>

  <main class="feed-content">
    <div class="active-filters" v-if="selectedHobbies.length > 0 || selectedGender || minBudget || maxBudget">
      <div class="filter-tag" v-if="selectedHobbies.length > 0">
        <i class="fa-solid fa-star filter-icon"></i>
        Hobbies: {{ selectedHobbies.map(h => availableHobbies.find(h2 => h2.value === h)?.label || h).join(', ') }}
        <button class="remove-filter" @click="removeFilter(null)">&times;</button>
      </div>
      <div class="filter-tag" v-if="selectedGender">
        <i class="fa-solid fa-venus-mars filter-icon"></i>
        Género: {{ selectedGender }}
        <button class="remove-filter" @click="selectedGender = ''">&times;</button>
      </div>
      <div class="filter-tag" v-if="minBudget">
        <i class="fa-solid fa-euro-sign filter-icon"></i>
        Presupuesto: {{ minBudget }}€ - {{ maxBudget || '∞' }}€
        <button class="remove-filter" @click="minBudget = ''">&times;</button>
      </div>
    </div>

    <div class="feed-list" v-if="filteredProfiles.length > 0">
      <router-link 
        v-for="profile in filteredProfiles" 
        :key="profile.id" 
        :to="'/profiles/' + profile.id"
        class="feed-item"
      >
        <div class="feed-item-header">
          <div class="profile-avatar">
            <img v-if="getProfileImageUrl(publishers[profile.user_id])" :src="getProfileImageUrl(publishers[profile.user_id])" alt="Profile photo" @error="handleImageError">
            <div v-else class="text-avatar">{{ getInitials(publishers[profile.user_id]?.nombre || 'R') }}</div>
          </div>
          <div class="profile-info">
            <h3>
              {{
                [
                  publishers[profile.user_id]?.nombre,
                  publishers[profile.user_id]?.apellidos
                ].filter(Boolean).join(' ') || 'Perfil RooMe'
              }}
            </h3>
            <div class="profile-chips">
              <span class="profile-chip career-chip">
                <i class="fa-solid fa-graduation-cap"></i> {{ publishers[profile.user_id]?.carrera_nombre || 'Estudiante' }}
              </span>
              <span class="profile-chip gender-chip">
                <i class="fa-solid fa-venus-mars"></i> {{ publishers[profile.user_id]?.genero || 'No especificado' }}
              </span>
            </div>
            <div class="hobbies-tags" v-if="publishers[profile.user_id]?.hobbies && publishers[profile.user_id].hobbies.length">
              <span v-for="hobby in Array.from(new Set(publishers[profile.user_id].hobbies))" :key="hobby" class="hobby-tag">
                {{ getHobbyLabel(hobby) }}
              </span>
            </div>
          </div>
        </div>
        <div class="feed-item-content">
          <div class="profile-details">
            <div class="detail-item">
              <span class="detail-label">Presupuesto:</span>
              <span class="profile-chip budget-chip">
                {{ profile.budget }}€/mes
              </span>            
            </div>
            <div class="detail-item">
              <span class="detail-label">Descripción:</span>
              <span>{{ truncateText(profile.description || profile.bio) }}</span>
            </div>
          </div>
        </div>
      </router-link>
    </div>
    <div v-else class="empty-state">
      <div class="empty-state-icon">👥</div>
      <p>No hay perfiles disponibles con los filtros seleccionados</p>
    </div>
  </main>
</div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'ProfileFeed',
  data() {
    return {
      showFilters: false,
      selectedHobbies: [],
      selectedGender: '',
      minBudget: '',
      maxBudget: '',
      availableHobbies: [], // será llenado dinámicamente
      profiles: [],
      publishers: {}, // Store user data for each profile
      error: ''
    }
  },
  computed: {
    filteredProfiles() {
      // Solo hobbies válidos (por value)
      const validHobbies = this.availableHobbies.map(h => h.value);
      let filtered = this.profiles.map(profile => {
        let preferences = profile.preferences;
        if (typeof preferences === 'string') {
          try { preferences = JSON.parse(preferences); } catch { preferences = []; }
        }
        // Solo hobbies válidos
        preferences = (preferences || []).filter(h => validHobbies.includes(h));
        return { ...profile, preferences };
      });
      if (this.selectedHobbies.length > 0) {
        filtered = filtered.filter(profile => {
          const prefs = profile.preferences || [];
          // Ahora prefs ya son IDs, así que comparamos directamente
          return this.selectedHobbies.some(hobbyId => prefs.includes(hobbyId));
        });
      }
      // Filtro por género
      if (this.selectedGender) {
        filtered = filtered.filter(profile => {
          const publisher = this.publishers[profile.user_id];
          return publisher?.genero === this.selectedGender;
        });
      }
      // Filtro por presupuesto
      if (this.minBudget) {
        filtered = filtered.filter(profile => Number(profile.budget) >= Number(this.minBudget));
      }
      if (this.maxBudget) {
        filtered = filtered.filter(profile => Number(profile.budget) <= Number(this.maxBudget));
      }
      return filtered;
    }
  },
  methods: {
    getInitials(name) {
      return (name || '').split(' ').map(word => word[0]).join('').toUpperCase()
    },
    handleImageError(e) {
      e.target.style.display = 'none'
      e.target.parentElement.querySelector('.text-avatar').style.display = 'flex'
    },
    getProfileImageUrl(user) {
      let imgPath = user && user.foto_perfil ? user.foto_perfil : null;
      if (imgPath) {
        if (imgPath.startsWith('http')) return imgPath;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const apiBase = base.replace(/\/api$/, '');
        if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
        return apiBase + imgPath;
      }
      return null;
    },
    applyFilters() {},
    clearFilters() {
      this.selectedHobbies = [];
      this.selectedGender = '';
      this.minBudget = '';
      this.maxBudget = '';
    },
    removeFilter(hobby) {
      if (hobby === null) {
        this.selectedHobbies = [];
      } else {
        this.selectedHobbies = this.selectedHobbies.filter(h => h !== hobby);
      }
    },
    getHobbyLabel(hobby) {
      const found = this.availableHobbies.find(h => h.value === hobby || h.label === hobby);
      return found ? found.label : hobby;
    },
    truncateText(text, maxWords = 10) {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '...';
    },
    async fetchProfiles() {
      this.error = '';
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Map backend data to frontend format
        this.profiles = res.data.map(profile => ({
          id: profile.publicacion_id,
          publicacion_id: profile.publicacion_id,
          description: profile.descripcion,
          bio: profile.descripcion,
          budget: profile.presupuesto,
          preferences: profile.hobbies || [],
          is_active: profile.estado === 'Activa',
          user_id: profile.estudiante_id
        }));
        
        // Fetch user data for each profile
        for (const profile of this.profiles) {
          try {
            const userRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/${profile.user_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            this.publishers[profile.user_id] = userRes.data;
          } catch (err) {
            console.error(`Error fetching user ${profile.user_id}:`, err);
          }
        }
      } catch (err) {
        this.error = err.response?.data?.error || 'Error al cargar perfiles';
      }
    }
  },
  async mounted() {
    // Cargar hobbies dinámicamente
    try {
      const hobbiesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/hobbies`);
      this.availableHobbies = hobbiesRes.data.map(h => ({ value: h.id, label: h.nombre }));
    } catch (e) {
      this.availableHobbies = [];
    }
    this.fetchProfiles();
  }
}
</script>

<style scoped>
.feed-container {
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

.profile-link {
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

.feed-filters {
  background-color: white;
  padding: 15px 20px;
  display: flex;
  gap: 15px;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #2c3e50;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-button:hover {
  background-color: #f8f9fa;
  border-color: #3498db;
}

.filter-icon {
  font-size: 18px;
}

.feed-content {
  padding: 20px;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.feed-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: block;
}

.feed-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.feed-item-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #eee;
}

.profile-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e0e0e0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  background-color: #e0e0e0;
}

.profile-info h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  text-align: left;
}

.career {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.gender {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.feed-item-content {
  padding: 20px;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.detail-label {
  color: #666;
  font-size: 14px;
}

.social-links {
  display: flex;
  gap: 15px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.social-link {
  font-size: 24px;
  text-decoration: none;
  color: #2c3e50;
  transition: transform 0.3s ease;
}

.social-link:hover {
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.filter-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.clear-button, .apply-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.clear-button {
  background: none;
  border: 1px solid #ddd;
  color: #666;
}

.apply-button {
  background-color: #3498db;
  border: none;
  color: white;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 20px;
}

.filter-tag {
  background-color: #e8f4fd;
  color: #3498db;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-filter {
  background: none;
  border: none;
  color: #3498db;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hobbies-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.hobby-tag {
  background-color: #e8f4fd;
  color: #3498db;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* Chips de perfil */
.profile-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0 0 0;
}
.profile-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 20px;
  padding: 6px 14px;
  background: #e8f4fd;
  color: #3498db;
}
.budget-chip {
  background: #e8f4fd;
  color: #2176ae;
}
.career-chip {
  background: #f9fbe7;
  color: #7cb342;
}
.gender-chip {
  background: #fce4ec;
  color: #d81b60;
}
.profile-chip i {
  font-size: 15px;
}

/* Añadir estilos para los íconos de los filtros activos */
.filter-tag .filter-icon {
  margin-right: 6px;
  font-size: 15px;
  vertical-align: middle;
}

@media (max-width: 768px) {
  .feed-filters {
    flex-direction: column;
    padding: 10px;
  }

  .filter-button {
    width: 100%;
    justify-content: center;
  }

  .feed-item-header {
    padding: 15px;
  }

  .profile-avatar {
    width: 50px;
    height: 50px;
  }

  .text-avatar {
    font-size: 20px;
  }

  .profile-info h3 {
    font-size: 16px;
  }

  .career {
    font-size: 12px;
  }

  .feed-item-content {
    padding: 15px;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }
  .profile-chips {
    flex-direction: column;
    gap: 7px;
  }
}
</style> 