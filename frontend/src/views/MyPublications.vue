<template>
  <div class="publications-container">
    <header class="header">
      <router-link to="/profile" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Mis Publicaciones</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="main-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">⏳</div>
        <p>Cargando publicaciones...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button class="retry-button" @click="created()">
          Reintentar
        </button>
      </div>
      
      <!-- Publications list -->
      <div v-else-if="publications.length > 0" class="publications-list">
        <!-- Room Publications -->
        <div v-for="publication in publications" :key="publication.id" class="publication-item" :class="{ inactive: !publication.is_active }">
          <!-- Room Publication -->
          <template v-if="publication.type === 'room'">
            <div class="publication-type">
              Publicación de Habitación
              <span v-if="!publication.is_active" class="hidden-label">Oculta</span>
            </div>
            <div class="feed-item-image">
              <img
                :src="getRoomImageUrl(publication)"
                :alt="publication.title"
                @error="handleImageError"
              >
            </div>
            <div class="feed-item-content">
              <p class="feed-description">{{ truncateText(publication.description) }}</p>
              <div class="feed-item-details">
                <span class="feed-price">{{ publication.price }}€/mes</span>
                <span class="feed-location"><i class="fa-solid fa-location-dot"></i> {{ publication.location }}</span>
                <span class="feed-contract"><i class="fa-solid fa-file-signature"></i> {{ publication.contract_type }}</span>
              </div>
              <div class="requirements-tags">
                <template v-if="publication.requirements.length">
                  <span v-for="reqId in publication.requirements" :key="reqId" class="requirement-tag">
                    {{ getRequirementName(reqId) }}
                  </span>
                </template>
                <template v-else>
                  <span class="requirement-tag">Sin requisitos</span>
                </template>
              </div>
            </div>
          </template>

          <!-- Profile Publication -->
          <template v-else>
            <div class="publication-type">
              Publicación de Perfil RooMe
              <span v-if="!publication.is_active" class="hidden-label">Oculta</span>
            </div>
            <div class="feed-item-header">
              <div class="profile-avatar">
                <img v-if="getProfileImageUrl(publishers[publication.user_id])"
                     :src="getProfileImageUrl(publishers[publication.user_id])"
                     alt="Profile photo"
                     @error="handleImageError">
                <div v-else class="text-avatar">{{ getInitials(publishers[publication.user_id]?.nombre || 'R') }}</div>
              </div>
              <div class="profile-info">
                <h3>{{ [publishers[publication.user_id]?.nombre, publishers[publication.user_id]?.apellidos].filter(Boolean).join(' ') || 'Perfil RooMe' }}</h3>
                <div class="profile-chips">
                  <span class="profile-chip career-chip">
                    <i class="fa-solid fa-graduation-cap"></i> {{ publishers[publication.user_id]?.carrera_nombre || 'Estudiante' }}
                  </span>
                  <span class="profile-chip gender-chip">
                    <i class="fa-solid fa-venus-mars"></i> {{ publishers[publication.user_id]?.genero || 'No especificado' }}
                  </span>
                </div>
                <div class="hobbies-tags" v-if="publishers[publication.user_id]?.hobbies && publishers[publication.user_id].hobbies.length">
                  <span v-for="hobby in Array.from(new Set(publishers[publication.user_id].hobbies))" :key="hobby" class="hobby-tag">
                    {{ getHobbyLabel(hobby) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="feed-item-content">
              <div class="profile-details">
                <div class="detail-item">
                  <span class="detail-label">Presupuesto:</span>
                  <span class="profile-chip budget-chip">{{ publication.budget }}€/mes</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Descripción:</span>
                  <span>{{ truncateText(publication.description || publication.bio) }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Common Actions -->
          <div class="publication-actions">
            <button 
              class="action-button edit"
              @click="handleEdit(publication)"
              title="Editar publicación"
            >
              ✎
            </button>
            <button 
              class="action-button visibility"
              @click="toggleVisibility(publication)"
              :title="publication.is_active ? 'Desactivar publicación' : 'Activar publicación'"
              :class="{ 'inactive': !publication.is_active }"
            >
              👁
            </button>
            <button 
              class="action-button delete"
              @click="handleDelete(publication)"
              title="Eliminar publicación"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>No tienes publicaciones</p>
        <button class="new-publication-button" @click="handleNewPublication">
          Crear Publicación
        </button>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'MyPublications',
  data() {
    return {
      publications: [],
      publishers: {},
      error: '',
      loading: false,
      requisitosDisponibles: [],
      hobbiesList: [] // será llenado dinámicamente
    }
  },
  async created() {
    this.loading = true;
    this.error = '';
    try {
      const token = localStorage.getItem('token');
      // Cargar requisitos desde la base de datos
      const reqRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/requisitos`);
      this.requisitosDisponibles = reqRes.data;
      // Cargar hobbies dinámicamente
      const hobbiesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/hobbies`);
      this.hobbiesList = hobbiesRes.data;
      // Fetch user's room (all, active and inactive)
      const roomRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fetch user's profile (all, active and inactive)
      const profileRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Map room data to frontend format
      const rooms = roomRes.data.map(r => ({
        id: r.publicacion_id,
        type: 'room',
        title: r.descripcion,
        description: r.descripcion,
        price: r.precio,
        location: r.direccion,
        contract_type: r.tipo_contrato,
        requirements: r.requisitos || [],
        is_active: r.estado === 'Activa',
        user_id: r.estudiante_id,
        photos: []
      }));
      // Map profile data to frontend format
      const profiles = profileRes.data.map(p => ({
        id: p.publicacion_id,
        type: 'profile',
        description: p.descripcion_personal,
        bio: p.descripcion_personal,
        budget: p.presupuesto,
        preferences: p.hobbies || [],
        is_active: p.estado === 'Activa',
        user_id: p.estudiante_id
      }));
      console.log('Perfiles mapeados:', profiles); // <-- Log de depuración
      this.publications = [...rooms, ...profiles];
      // Load photos for room publications
      for (const room of rooms) {
        try {
          const photosRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${room.id}/photos`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          room.photos = photosRes.data;
        } catch (err) {
          room.photos = [];
        }
      }
      // Fetch user data for each profile publication
      for (const profile of profiles) {
        try {
          const userRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/${profile.user_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          this.publishers[profile.user_id] = userRes.data;
        } catch (err) {}
      }
    } catch (err) {
      this.error = err.response?.data?.error || 'Error al cargar tus publicaciones';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    handleEdit(publication) {
      console.log('Editando publicación:', publication); // <-- Log de depuración
      // Navigate to edit page based on publication type
      if (publication.type === 'room') {
        this.$router.push(`/edit-room/${publication.id}`);
      } else {
        this.$router.push(`/edit-profile-publi/${publication.id}`);
      }
    },
    async toggleVisibility(publication) {
      try {
        const token = localStorage.getItem('token');
        
        if (publication.is_active) {
          // Deactivate using existing DELETE endpoint
          if (publication.type === 'room') {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${publication.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } else {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/${publication.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          publication.is_active = false;
        } else {
          // For activation, we need to update the publication status directly
          // We'll use a PATCH request to update just the status
          const newStatus = 'Activa';
          if (publication.type === 'room') {
            await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${publication.id}/status`, { 
              estado: newStatus
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } else {
            await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/${publication.id}/status`, { 
              estado: newStatus
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          publication.is_active = true;
        }
      } catch (error) {
        console.error('Error toggling visibility:', error);
        this.error = 'Error al cambiar la visibilidad';
      }
    },
    async handleDelete(publication) {
      try {
        if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
          const token = localStorage.getItem('token');
          let url = '';
          if (publication.type === 'room') {
            url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${publication.id}/hard`;
          } else {
            url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/${publication.id}/hard`;
          }
          const response = await axios.delete(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Si la respuesta es exitosa, elimina de la lista local
          if (response.status === 200 || response.status === 204) {
            this.publications = this.publications.filter(p => p.id !== publication.id);
            this.error = '';
          } else {
            this.error = 'No se pudo eliminar la publicación. Intenta de nuevo.';
          }
        }
      } catch (error) {
        console.error('Error deleting publication:', error);
        // Mensaje más detallado si viene del backend
        this.error = error.response?.data?.error || 'Error al eliminar la publicación';
      }
    },
    handleNewPublication() {
      this.$router.push('/new-publi-type')
    },
    handleImageError(e) {
      e.target.style.display = 'none';
      const textAvatar = e.target.parentElement.querySelector('.text-avatar');
      if (textAvatar) textAvatar.style.display = 'flex';
    },
    getInitials(name) {
      return name ? name.split(' ').map(word => word[0]).join('').toUpperCase() : '';
    },
    getHobbyLabel(hobby) {
      const found = this.hobbiesList.find(h => h.id === hobby || h.nombre === hobby);
      return found ? found.nombre : hobby;
    },
    getRequirementName(id) {
      const req = this.requisitosDisponibles.find(r => Number(r.id) === Number(id));
      return req ? req.nombre : id;
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
    getRoomImageUrl(room) {
      let imgPath = room && room.photos && room.photos[0] ? room.photos[0] : null;
      if (imgPath) {
        if (imgPath.startsWith('http')) return imgPath;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const apiBase = base.replace(/\/api$/, '');
        if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
        return apiBase + imgPath;
      }
      // Placeholder si no hay imagen
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IiNhYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+APC90ZXh0Pjwvc3ZnPg==';
    },
    parseValidHobbies(preferences) {
      let prefs = preferences;
      if (typeof prefs === 'string') {
        try { prefs = JSON.parse(prefs); } catch { prefs = []; }
      }
      // Solo hobbies válidos (por id)
      const validHobbies = this.hobbiesList.map(h => h.id);
      return (prefs || []).filter(h => validHobbies.includes(h));
    },
    truncateText(text, maxWords = 10) {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '...';
    }
  }
}
</script>

<style scoped>
.publications-container {
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
  max-width: 800px;
  margin: 0 auto;
}

.publications-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.publication-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.publication-type {
  padding: 15px 20px;
  background-color: #f8f9fa;
  color: #2c3e50;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

/* Room Publication Styles */
.feed-item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.feed-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feed-item-content {
  padding: 20px;
}

.feed-item-content h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 18px;
}

.feed-item-content p {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.feed-item-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.feed-price {
  font-weight: bold;
  color: #2176ae;
  font-size: 18px;
  background: #e8f4fd;
  padding: 6px 14px;
  border-radius: 8px;
  margin-right: 8px;
}
.feed-location {
  color: #7cb342;
  background: #f9fbe7;
  font-size: 15px;
  padding: 6px 14px;
  border-radius: 8px;
  margin-right: 8px;
}
.feed-contract {
  color: #d81b60;
  background: #fce4ec;
  font-size: 15px;
  padding: 6px 14px;
  border-radius: 8px;
}

.feed-description {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
}

/* Profile Publication Styles */
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
}

.career {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
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

/* Action Buttons */
.publication-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.action-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: scale(1.1);
}

.action-button.edit:hover {
  background-color: #e3f2fd;
  color: #2196f3;
}

.action-button.visibility {
  opacity: 1;
}

.action-button.visibility.inactive {
  opacity: 0.3;
}

.action-button.visibility:hover {
  background-color: #e8f5e9;
  color: #4caf50;
}

.action-button.delete:hover {
  background-color: #ffebee;
  color: #f44336;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.new-publication-button {
  margin-top: 20px;
  padding: 12px 24px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.new-publication-button:hover {
  background-color: #2980b9;
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

.requirements-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.requirement-tag {
  background-color: #e8f4fd;
  color: #3498db;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.publication-item.inactive {
  opacity: 0.5;
  position: relative;
}
.hidden-label {
  color: #f44336;
  font-weight: bold;
  margin-left: 10px;
}

/* Loading and Error States */
.loading-state, .error-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-spinner {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.retry-button {
  margin-top: 20px;
  padding: 12px 24px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #2980b9;
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

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .publication-type {
    padding: 12px 15px;
    font-size: 12px;
  }

  .feed-item-content {
    padding: 15px;
  }

  .feed-item-image {
    height: 150px;
  }

  .feed-item-content h3 {
    font-size: 16px;
  }

  .price {
    font-size: 16px;
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

  .action-button {
    font-size: 18px;
    width: 35px;
    height: 35px;
  }
}
</style> 