<template>
  <div class="detail-container">
    <header class="header">
      <router-link :to="'/rooms'" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Detalles de la Habitación</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="detail-content" v-if="room">
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>
      
      <div class="image-gallery">
        <div v-if="photos && photos.length" class="slider-gallery">
          <img :src="getRoomImageUrl(mainPhoto)" class="main-image" @error="handleImageError" />
          <div class="thumbnails">
            <img v-for="(photo, idx) in photos" :key="idx" :src="getRoomImageUrl(photo)" class="thumbnail" :class="{active: mainPhoto === photo}" @click="mainPhoto = photo" @error="handleImageError" />
          </div>
        </div>
        <img v-else :src="room.image" :alt="room.title" @error="handleImageError" class="main-image">
      </div>

      <!-- NUEVO: Tarjeta de información principal -->
      <div class="main-info-card">
        <div class="main-info-item price">
          <span>{{ room.price }} €/mes</span>
        </div>
        <div class="main-info-item location">
          <i class="fa-solid fa-location-dot"></i>
          <span>{{ room.location }}</span>
        </div>
        <div class="main-info-item contract">
          <i class="fa-solid fa-file-signature"></i>
          <span>{{ room.contract_type }}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="section">
          <h3>Descripción</h3>
          <p>{{ room.description }}</p>
        </div>

        <div class="section" v-if="room.requirements && room.requirements.length">
          <h3>Requisitos</h3>
          <div class="requirements-tags">
            <span v-for="reqId in room.requirements" :key="reqId" class="requirement-chip">
              {{ getRequirementName(reqId) }}
            </span>
          </div>
        </div>

        <!-- NUEVO: Sección de usuario más responsiva -->
        <div class="publisher-section">
          <h3>Publicado por</h3>
          <div class="publisher-info-responsive" v-if="publisher">
            <div class="publisher-avatar">
              <img v-if="getProfileImageUrl(publisher)" :src="getProfileImageUrl(publisher)" :alt="getFullName(publisher)">
              <div v-else class="text-avatar">{{ getInitials(publisher) }}</div>
            </div>
            <div class="publisher-details">
              <h4>{{ getFullName(publisher) }}</h4>
              <p class="publisher-career">{{ publisher?.carrera_nombre || publisher?.carrera }}</p>
              <div class="publisher-stats">
                <div class="stat-item" v-if="publisher?.edad">
                  <span class="stat-label">Edad:</span>
                  <span class="stat-value">{{ publisher.edad }} años</span>
                </div>
                <div class="stat-item" v-if="publisher?.genero">
                  <span class="stat-label">Género:</span>
                  <span class="stat-value">{{ publisher.genero }}</span>
                </div>
                <div class="stat-item" v-if="publisher?.correo_institucional">
                  <span class="stat-label">Email:</span>
                  <span class="stat-value">{{ publisher.correo_institucional }}</span>
                </div>
              </div>
              <div class="social-links">
                <a v-if="publisher?.whatsapp" :href="'https://wa.me/' + publisher.whatsapp" class="social-link" title="Contactar por WhatsApp">
                  📱 WhatsApp
                </a>
                <a v-if="publisher?.instagram" :href="'https://instagram.com/' + publisher.instagram" class="social-link" title="Ver Instagram">
                  📸 Instagram
                </a>
              </div>
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
export default {
  name: 'RoomDetail',
  data() {
    return {
      room: {},
      requisitosDisponibles: [],
      publisher: null,
      error: '',
      mainPhoto: null,
      photos: []
    }
  },
  computed: {
    // Eliminar parsedRequirements ya que ahora usamos room.requisitos directamente
  },
  async created() {
    try {
      const token = localStorage.getItem('token');
      const roomId = this.$route.params.id;
      
      console.log('Cargando habitación con ID:', roomId);
      
      // Cargar datos de la habitación
      const roomRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Map backend data to frontend format
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
      
      console.log('Datos de la habitación:', this.room);
      console.log('ID del estudiante:', this.room.user_id);
      
      // Cargar fotos de la habitación
      try {
        const photosRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${roomId}/photos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.photos = photosRes.data;
        this.mainPhoto = this.photos.length > 0 ? this.photos[0] : null;
        console.log('Fotos cargadas:', this.photos);
      } catch (photoErr) {
        console.error('Error cargando fotos:', photoErr);
        this.photos = [];
      }
      
      // Cargar información del usuario que publicó
      try {
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/${this.room.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.publisher = userRes.data;
        console.log('Datos del publicador:', this.publisher);
      } catch (userErr) {
        console.error('Error cargando datos del usuario:', userErr);
        this.publisher = null;
      }
    } catch (err) {
      console.error('Error cargando habitación:', err);
      this.error = err.response?.data?.error || 'Error al cargar la habitación';
    }
  },
  async mounted() {
    try {
      const reqRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/requisitos`);
      this.requisitosDisponibles = reqRes.data;
    } catch (e) {
      this.error = 'No se pudieron cargar los requisitos';
    }
  },
  methods: {
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IiNhYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+APC90ZXh0Pjwvc3ZnPg=='
    },
    getInitials(name) {
      if (!name) return '';
      // Si es un objeto con nombre y apellidos, combinarlos
      if (typeof name === 'object') {
        const fullName = `${name.nombre || ''} ${name.apellidos || ''}`.trim();
        return fullName.split(' ').map(word => word[0]).join('').toUpperCase();
      }
      // Si es un string, procesarlo directamente
      return name.split(' ').map(word => word[0]).join('').toUpperCase();
    },
    getFullName(user) {
      if (!user) return '';
      if (typeof user === 'object' && user.nombre && user.apellidos) {
        return `${user.nombre} ${user.apellidos}`.trim();
      }
      return user.nombre || user.apellidos || '';
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
    getRoomImageUrl(photo) {
      let imgPath = photo;
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
    getRequirementName(id) {
      const req = this.requisitosDisponibles.find(r => Number(r.id) === Number(id));
      return req ? req.nombre : id;
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

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  border: 1px solid #ef9a9a;
}

.image-gallery {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

/* NUEVO: Tarjeta de información principal */
.main-info-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.08);
  padding: 24px 20px;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.main-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 8px;
  background: #f4faff;
  color: #3498db;
  box-shadow: 0 1px 2px rgba(52, 152, 219, 0.05);
}
.main-info-item.price {
  background: #e8f4fd;
  color: #2176ae;
  font-size: 28px;
  font-weight: 700;
}
.main-info-item.location {
  background: #f9fbe7;
  color: #7cb342;
}
.main-info-item.contract {
  background: #fce4ec;
  color: #d81b60;
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
  margin: 0 0 10px 0;
  font-size: 18px;
}
.section p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* NUEVO: Chips de requisitos */
.requirements-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  justify-content: center;
}
.requirement-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #e3f2fd;
  color: #1976d2;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(25, 118, 210, 0.08);
}
.requirement-chip i {
  color: #43a047;
  font-size: 16px;
}

/* NUEVO: Publisher info responsivo */
.publisher-section {
  margin-top: 30px;
  padding: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}
.publisher-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}
.publisher-info-responsive {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}
@media (max-width: 700px) {
  .publisher-info-responsive {
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 15px;
  }
}
.publisher-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e0e0e0;
  border: 3px solid #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
}
.publisher-avatar img {
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
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
  background-color: #e0e0e0;
}
.publisher-details {
  text-align: left;
  min-width: 180px;
}
.publisher-details h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 20px;
}
.publisher-details p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 16px;
}
.publisher-career {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 16px;
  font-weight: 500;
}
.publisher-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #e8f4fd;
  color: #3498db;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}
.stat-label {
  font-weight: 500;
}
.stat-value {
  font-weight: bold;
}
.social-links {
  display: flex;
  justify-content: flex-start;
  gap: 15px;
  margin-top: 20px;
}
.social-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  text-decoration: none;
  color: #3498db;
  background-color: #e8f4fd;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}
.social-link:hover {
  background-color: #3498db;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}
.publisher-not-found {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}

@media (max-width: 768px) {
  .detail-content {
    padding: 15px;
  }
  .main-image {
    height: 250px;
  }
  .main-info-card {
    flex-direction: column;
    align-items: stretch;
    padding: 16px 10px;
    gap: 10px;
  }
  .main-info-item {
    font-size: 18px;
    padding: 8px 10px;
  }
  .main-info-item.price {
    font-size: 22px;
  }
  .publisher-avatar {
    width: 80px;
    height: 80px;
  }
  .text-avatar {
    font-size: 28px;
  }
  .publisher-details h4 {
    font-size: 18px;
  }
  .publisher-details p {
    font-size: 14px;
  }
  .social-link {
    font-size: 16px;
    padding: 8px 12px;
  }
}

.slider-gallery {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.thumbnails {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s;
}
.thumbnail.active {
  border-color: #3498db;
}
</style> 