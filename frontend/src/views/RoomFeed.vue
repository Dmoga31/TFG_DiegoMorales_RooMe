<template>
  <div class="feed-container">
    <header class="header">
      <router-link to="/menu" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
        <h1>Habitaciones</h1>
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
          <h2>Filtrar por Requisitos</h2>
          <button class="close-button" @click="showFilters = false">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Filtro por tipo de contrato -->
          <div class="filter-section">
            <h3>Tipo de contrato:</h3>
            <div class="filter-options">
              <label class="filter-option">
                <input 
                  type="radio" 
                  name="contractType" 
                  value="" 
                  v-model="selectedContractType"
                >
                <span>Todos</span>
              </label>
              <label class="filter-option">
                <input 
                  type="radio" 
                  name="contractType" 
                  value="Fijo" 
                  v-model="selectedContractType"
                >
                <span>Fijo</span>
              </label>
              <label class="filter-option">
                <input 
                  type="radio" 
                  name="contractType" 
                  value="Escolar" 
                  v-model="selectedContractType"
                >
                <span>Escolar</span>
              </label>
            </div>
          </div>

          <!-- Filtro por rango de precio -->
          <div class="filter-section">
            <h3>Rango de precio (€/mes):</h3>
            <div class="price-range">
              <div class="price-input">
                <label>Mínimo:</label>
                <input 
                  type="number" 
                  v-model="minPrice" 
                  placeholder="0"
                  min="0"
                />
              </div>
              <div class="price-input">
                <label>Máximo:</label>
                <input 
                  type="number" 
                  v-model="maxPrice" 
                  placeholder="1000"
                  min="0"
                />
              </div>
            </div>
          </div>

          <!-- Filtro por requisitos -->
          <div class="filter-section">
            <h3>Requisitos:</h3>
            <div class="filter-options">
              <label class="filter-option" v-for="req in requisitosDisponibles" :key="req.id">
                <input 
                  type="checkbox" 
                  :value="req.id" 
                  v-model="selectedRequirements"
                >
                <span>{{ req.nombre }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="clear-button" @click="clearFilters">Limpiar Filtros</button>
          <button class="apply-button" @click="showFilters = false">Cerrar</button>
        </div>
      </div>
    </div>

    <main class="feed-content">
      <div class="active-filters" v-if="selectedRequirements.length > 0 || selectedContractType || minPrice || maxPrice">
        <div class="filter-tag" v-if="selectedRequirements.length > 0">
          <i class="fa-solid fa-star filter-icon"></i>
          Requisitos: {{ selectedRequirements.map(req => requisitosDisponibles.find(r => Number(r.id) === Number(req))?.nombre || req).join(', ') }}
          <button class="remove-filter" @click="clearFilters">&times;</button>
        </div>
        <div class="filter-tag" v-if="selectedContractType">
          <i class="fa-solid fa-file-signature filter-icon"></i>
          {{ selectedContractType === 'Fijo' ? 'Contrato fijo' : (selectedContractType === 'Escolar' ? 'Contrato escolar' : selectedContractType) }}
          <button class="remove-filter" @click="removeContractType">&times;</button>
        </div>
        <div class="filter-tag" v-if="minPrice || maxPrice">
          <i class="fa-solid fa-euro-sign filter-icon"></i>
          {{ getPriceRangeText() }}
          <button class="remove-filter" @click="removePriceRange">&times;</button>
        </div>
      </div>

      <div class="feed-list" v-if="filteredRooms.length > 0">
        <router-link 
          v-for="room in filteredRooms" 
          :key="room.publicacion_id" 
          :to="'/rooms/' + room.publicacion_id"
          class="feed-item"
        >
          <div class="feed-item-image">
            <img :src="getRoomImageUrl(room)" :alt="room.direccion" @error="handleImageError">
          </div>
          <div class="feed-item-content">
            <p class="feed-description">{{ truncateText(room.description) }}</p>
            <div class="feed-item-details">
              <span class="feed-price">{{ room.price }}€/mes</span>
              <span class="feed-location"><i class="fa-solid fa-location-dot"></i> {{ room.location }}</span>
              <span class="feed-contract"><i class="fa-solid fa-file-signature"></i> {{ room.contract_type }}</span>
            </div>
            <div class="requirements-tags">
              <template v-if="room.requirements && room.requirements.length">
                <span v-for="req in room.requirements" :key="req" class="requirement-tag">
                  {{ requisitosDisponibles.find(r => r.id === req)?.nombre || req }}
                </span>
              </template>
              <template v-else>
                <span class="requirement-tag">Sin requisitos</span>
              </template>
            </div>
          </div>
        </router-link>
      </div>
      <div v-else class="empty-state">
        <div class="empty-state-icon">🏠</div>
        <p>No hay habitaciones disponibles con los filtros seleccionados</p>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RoomFeed',
  data() {
    return {
      showFilters: false,
      selectedRequirements: [],
      selectedContractType: '',
      minPrice: '',
      maxPrice: '',
      requisitosDisponibles: [],
      rooms: [],
      error: ''
    }
  },
  async mounted() {
    try {
      const reqRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/requisitos`);
      this.requisitosDisponibles = reqRes.data;
      console.log('Requisitos cargados desde la tabla "requisitos":', this.requisitosDisponibles);
    } catch (e) {
      console.error('Error cargando requisitos:', e);
      this.error = 'No se pudieron cargar los requisitos';
    }
    this.fetchRooms();
  },
  computed: {
    filteredRooms() {
      let filtered = this.rooms;
      
      // Filtro de tipo de contrato
      if (this.selectedContractType) {
        filtered = filtered.filter(room => {
          const type = room.contract_type || '';
          return type === this.selectedContractType;
        });
      }
      
      // Filtro de rango de precio
      if (this.minPrice || this.maxPrice) {
        filtered = filtered.filter(room => {
          const price = parseFloat(room.price) || 0;
          const min = this.minPrice ? parseFloat(this.minPrice) : 0;
          const max = this.maxPrice ? parseFloat(this.maxPrice) : Infinity;
          return price >= min && price <= max;
        });
      }
      
      // Filtro de requisitos por id
      if (this.selectedRequirements.length > 0) {
        filtered = filtered.filter(room => {
          const roomReqs = room.requirements || [];
          return this.selectedRequirements.every(reqId => roomReqs.includes(reqId));
        });
      }
      
      return filtered;
    }
  },
  methods: {
    handleImageError(e) {
      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IiNhYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+APC90ZXh0Pjwvc3ZnPg=='
    },
    clearFilters() {
      this.selectedRequirements = [];
      this.selectedContractType = '';
      this.minPrice = '';
      this.maxPrice = '';
    },
    removeFilter(requirement) {
      this.selectedRequirements = this.selectedRequirements.filter(req => req !== requirement);
    },
    removeContractType() {
      this.selectedContractType = '';
    },
    removePriceRange() {
      this.minPrice = '';
      this.maxPrice = '';
    },
    getPriceRangeText() {
      if (this.minPrice && this.maxPrice) {
        return `${this.minPrice}€ - ${this.maxPrice}€`;
      } else if (this.minPrice) {
        return `Mínimo ${this.minPrice}€`;
      } else if (this.maxPrice) {
        return `Máximo ${this.maxPrice}€`;
      }
      return '';
    },
    truncateText(text, maxWords = 10) {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '...';
    },
    async fetchRooms() {
      this.error = '';
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Map backend data to frontend format
        this.rooms = res.data.map(room => ({
          id: room.publicacion_id,
          publicacion_id: room.publicacion_id,
          title: room.descripcion,
          description: room.descripcion,
          location: room.direccion,
          price: room.precio,
          contract_type: room.tipo_contrato,
          requirements: room.requisitos || [],
          is_active: room.estado === 'Activa',
          user_id: room.estudiante_id,
          photos: []
        }));
        
        console.log('Habitaciones cargadas:', this.rooms);
        console.log('Primera habitación:', this.rooms[0]);
        
        // Cargar fotos para todas las habitaciones
        await this.loadRoomPhotos();
      } catch (err) {
        console.error('Error cargando habitaciones:', err);
        this.error = err.response?.data?.error || 'Error al cargar habitaciones';
      }
    },
    async getRoomPhotos(habitacionId) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/${habitacionId}/photos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
      } catch (err) {
        console.error('Error cargando fotos:', err);
        return [];
      }
    },
    getRoomImageUrl(room) {
      // Si la habitación ya tiene fotos cargadas, usar la primera
      if (room.photos && room.photos.length > 0) {
        const imgPath = room.photos[0];
        if (imgPath.startsWith('http')) return imgPath;
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const apiBase = base.replace(/\/api$/, '');
        if (!imgPath.startsWith('/')) imgPath = '/' + imgPath;
        return apiBase + imgPath;
      }
      // Placeholder si no hay imagen
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IiNhYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn4+APC90ZXh0Pjwvc3ZnPg==';
    },
    async loadRoomPhotos() {
      // Cargar fotos para todas las habitaciones
      for (let room of this.rooms) {
        try {
          const photos = await this.getRoomPhotos(room.publicacion_id);
          room.photos = photos;
        } catch (err) {
          console.error(`Error cargando fotos para habitación ${room.publicacion_id}:`, err);
          room.photos = [];
        }
      }
    }
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
  font-weight: bold;
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

.filter-section {
  margin-bottom: 25px;
}

.filter-section h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.filter-option input[type="checkbox"],
.filter-option input[type="radio"] {
  width: 18px;
  height: 18px;
}

.price-range {
  display: flex;
  gap: 15px;
}

.price-input {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.price-input label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.price-input input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.price-input input:focus {
  border-color: #3498db;
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

.requirements-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.requirement-tag {
  background-color: #e8f4fd;
  color: #3498db;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.filter-option.selected {
  background: #e8f4fd;
  border-radius: 8px;
  font-weight: bold;
  color: #3498db;
}
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

  .feed-item-content {
    padding: 15px;
  }

  .feed-item-content h3 {
    font-size: 16px;
  }

  .price {
    font-size: 16px;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .price-range {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 