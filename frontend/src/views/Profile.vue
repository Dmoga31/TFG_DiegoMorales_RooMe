<template>
  <div class="profile-container">
    <header class="header">
      <router-link to="/menu" class="back-button">       
         <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Mi Perfil</h1>
      <div class="header-spacer"></div>
    </header>

    <main class="main-content">
      <div class="profile-content">
        <div class="profile-image">
          <img v-if="profileImageUrl" :src="profileImageUrl" alt="Foto de perfil" class="real-avatar" />
          <div v-else class="text-avatar">{{ getInitials(currentUser.nombre) }}</div>
        </div>
        
        <h2 class="student-name">{{ currentUser.nombre }}</h2>
        
        <div class="profile-buttons">
          <button class="profile-button" @click="handleMyPublications">
            Mis Publicaciones
          </button>
          <button class="profile-button" @click="handleEditProfile">
            Editar Perfil
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';

export default {
  name: 'Profile',
  computed: {
    ...mapGetters(['currentUser']),
    profileImageUrl() {
      const user = this.currentUser;
      console.log('DEBUG currentUser:', user);
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
  async mounted() {
    // Fetch complete user data from backend to ensure all fields are loaded
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.user) {
        // Update Vuex store with complete user data
        this.$store.commit('setUser', response.data.user)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  },
  methods: {
    getInitials(name) {
      if (!name || typeof name !== 'string') return '';
      return name.split(' ').map(word => word[0]).join('').toUpperCase();
    },
    handleMyPublications() {
      // Navigate to my publications page
      this.$router.push('/my-publications')
    },
    handleEditProfile() {
      // Navigate to edit profile page
      this.$router.push('/edit-profile')
    }
  }
}
</script>

<style scoped>
.profile-container {
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
  padding: 40px 20px;
}

.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.real-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.text-avatar {
  font-size: 48px;
  color: #2c3e50;
  font-weight: bold;
}

.student-name {
  color: #2c3e50;
  font-size: 24px;
  margin: 0;
  text-align: center;
}

.profile-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  max-width: 300px;
  margin-top: 20px;
}

.profile-button {
  width: 100%;
  padding: 15px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.profile-button:hover {
  background-color: #2980b9;
}

@media (max-width: 768px) {
  .profile-image {
    width: 100px;
    height: 100px;
  }

  .text-avatar {
    font-size: 40px;
  }

  .student-name {
    font-size: 20px;
  }

  .profile-button {
    padding: 12px;
    font-size: 14px;
  }
}
</style> 