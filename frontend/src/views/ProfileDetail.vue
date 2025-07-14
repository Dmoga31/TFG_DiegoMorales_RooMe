<template>
<div class="detail-container">
  <header class="header">
    <router-link :to="'/profiles'" class="back-button">
      <i class="fa-solid fa-arrow-left"></i>
    </router-link>
    <h1>Detalles del Perfil</h1>
    <div class="header-spacer"></div>
  </header>

  <main class="detail-content" v-if="profile">
    <div class="profile-header">
      <div class="profile-avatar">
        <img v-if="profileImageUrl" :src="profileImageUrl" :alt="profile.nombre">
        <div v-else class="text-avatar">{{ getInitials(publisher?.nombre || profile.nombre) }}</div>
      </div>
      <h2>
        {{
          [publisher?.nombre, publisher?.apellidos].filter(Boolean).join(' ') || profile.nombre
        }}
      </h2>
    </div>

    <div class="detail-section">
      <div class="section">
        <h3>Sobre mí</h3>
        <p>{{ profile.description || profile.bio }}</p>
      </div>

      <div class="section">
        <h3>Información Personal</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Carrera</span>
            <span class="info-value">{{ publisher?.carrera_nombre }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Edad</span>
            <span class="info-value">{{ publisher?.edad }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Género</span>
            <span class="info-value">{{ publisher?.genero }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Presupuesto</span>
            <span class="info-value">{{ profile.budget }}€/mes</span>
          </div>
        </div>
      </div>

      <div class="section" v-if="profile.preferences && profile.preferences.length">
        <h3>Hobbies</h3>
        <div class="hobbies-tags">
          <span v-for="hobby in profile.preferences" :key="hobby" class="hobby-tag">
            {{ getHobbyLabel(hobby) }}
          </span>
        </div>
      </div>

      <!-- NUEVO: Sección de contacto centrada y con estilo igual a RoomDetail -->
      <div class="publisher-section">
        <h3>Contacto</h3>
        <div class="publisher-info-responsive centered-contact" v-if="publisher">
          <div class="social-links contact-chips">
            <a v-if="publisher?.whatsapp" :href="'https://wa.me/' + publisher.whatsapp" class="contact-chip" title="Contactar por WhatsApp" target="_blank" rel="noopener">
              📱 WhatsApp
            </a>
            <a v-if="publisher?.instagram" :href="'https://instagram.com/' + publisher.instagram" class="contact-chip" title="Ver Instagram" target="_blank" rel="noopener">
              📸 Instagram
            </a>
          </div>
        </div>
        <div v-else class="publisher-not-found">
          <p>Información del publicador no disponible</p>
        </div>
      </div>
    </div>
  </main>
</div>
</template>

<script>
import axios from 'axios';
import { mapGetters } from 'vuex';

export default {
  name: 'ProfileDetail',
  data() {
    return {
      hobbiesList: [],
      profile: null,
      publisher: null,
      error: ''
    }
  },
  computed: {
    ...mapGetters(['currentUser']),
    parsedPreferences() {
      if (!this.profile) return [];
      let prefs = this.profile.preferences;
      if (typeof prefs === 'string') {
        try { prefs = JSON.parse(prefs); } catch { prefs = []; }
      }
      // Solo hobbies válidos
      const validHobbies = this.HOBBIES.map(h => h.value);
      return (prefs || []).filter(h => validHobbies.includes(h));
    },
    profileImageUrl() {
      const user = this.publisher;
      let imgPath = user && user.foto_perfil ? user.foto_perfil : null;
      if (imgPath) {
        if (imgPath.startsWith('http')) return imgPath;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const apiBase = base.replace(/\/api$/, '');
        if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
        return apiBase + imgPath;
      }
      return null;
    }
  },
  async created() {
    try {
      const token = localStorage.getItem('token');
      // Cargar hobbies dinámicamente
      const hobbiesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/hobbies`);
      this.hobbiesList = hobbiesRes.data;
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/${this.$route.params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Map backend data to frontend format
      const profileData = res.data;
      this.profile = {
        id: profileData.publicacion_id,
        publicacion_id: profileData.publicacion_id,
        description: profileData.descripcion,
        bio: profileData.descripcion,
        budget: profileData.presupuesto,
        preferences: profileData.hobbies || [],
        is_active: profileData.estado === 'Activa',
        user_id: profileData.estudiante_id
      };
      // Fetch publisher info
      const userRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/${this.profile.user_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.publisher = userRes.data;
    } catch (err) {
      this.error = err.response?.data?.error || 'Error al cargar el perfil';
    }
  },
  methods: {
    getInitials(name) {
      return name ? name.split(' ').map(word => word[0]).join('').toUpperCase() : '';
    },
    getHobbyLabel(hobby) {
      // hobby puede ser id o nombre
      if (!this.hobbiesList.length) return hobby;
      // Buscar por id o por nombre
      const found = this.hobbiesList.find(h => h.id === hobby || h.nombre === hobby);
      return found ? found.nombre : hobby;
    }
  }
}
</script>

<style scoped>
.detail-container {
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

.detail-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin: 0 auto 20px;
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
  font-size: 48px;
  font-weight: bold;
  color: #2c3e50;
  background-color: #e0e0e0;
}

.profile-header h2 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.career {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.detail-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section h3 {
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-size: 18px;
}

.section p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.info-value {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
}

.hobbies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hobby-tag {
  background-color: #e8f4fd;
  color: #3498db;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.social-links {
  display: flex;
  gap: 20px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #2c3e50;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.social-link:hover {
  background-color: #f8f9fa;
}

.social-icon {
  font-size: 24px;
}

.social-label {
  font-size: 14px;
}

/* New styles for publisher section */
.publisher-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.publisher-info-responsive {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.publisher-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e0e0e0;
}

.publisher-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.publisher-details h4 {
  color: #2c3e50;
  margin: 0 0 5px 0;
  font-size: 20px;
}

.publisher-career {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.publisher-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
}

.publisher-not-found {
  text-align: center;
  color: #666;
  font-size: 16px;
}

/* Agrega estilos para centrar y para los chips de contacto */
.centered-contact {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin-top: 10px;
}
.contact-chips {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 10px;
}
.contact-chip {
  background-color: #e8f4fd;
  color: #3498db;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.contact-chip:hover {
  background-color: #3498db;
  color: #fff;
}
@media (max-width: 768px) {
  .detail-content {
    padding: 15px;
  }

  .profile-header {
    padding: 20px;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
  }

  .text-avatar {
    font-size: 36px;
  }

  .profile-header h2 {
    font-size: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .publisher-info-responsive {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .publisher-avatar {
    width: 100px;
    height: 100px;
  }

  .publisher-details h4 {
    font-size: 18px;
  }

  .publisher-career {
    font-size: 14px;
  }

  .publisher-stats {
    flex-direction: column;
    gap: 5px;
  }

  .stat-label, .stat-value {
    font-size: 14px;
  }

  .social-links {
    flex-direction: column;
    gap: 10px;
  }
  .contact-chips {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 