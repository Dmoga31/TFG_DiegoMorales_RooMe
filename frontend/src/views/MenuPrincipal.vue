<template>
  <div class="menu-container">
    <header class="header">
      <div class="title-container">
        <h1>RooMe</h1>
      </div>
      <div class="profile-container">
        <div class="name">
          <p>Bienvenido, {{ currentUser.nombre }}</p>
        </div>
        <router-link to="/profile" class="profile-link" title="Mi Perfil">
          <div class="profile-icon">
            <span>👤</span>
          </div>
        </router-link>
        <router-link v-if="isAdmin" to="/admin" class="dashboard-btn" title="Panel de administración">
          <i class="fa-solid fa-gauge-high"></i>
        </router-link>
        <button class="logout-button" @click="handleLogout" title="Cerrar sesión">
          <i class="fas fa-right-from-bracket"></i>
        </button>
      </div>
    </header>

    <main class="main-content">
      <div class="content-container">
        <h2 class="welcome-text">¡Bienvenido! ¿Qué deseas hacer?</h2>
        <div class="menu-buttons">
          <button class="menu-button" @click="handleNewPublication">
           Nueva Publicación
          </button>
          <button class="menu-button" @click="handleViewRooms">
            Ver Habitaciones
          </button>
          <button class="menu-button" @click="handleViewProfiles">
            Ver Perfiles RooMe
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: 'MenuPrincipal',
  computed: {
    ...mapGetters(['currentUser']),
    isAdmin() {
      return this.currentUser && (this.currentUser.rol === 'Admin' || this.currentUser.rol === 'admin' || this.currentUser.role === 'admin');
    }
  },
  methods: {
    ...mapActions(['logout']),
    handleNewPublication() {
      // TODO: Implement navigation to new publication page
      this.$router.push('/new-publi-type')
    },
    handleViewRooms() {
      // Navigate to rooms feed
      this.$router.push('/rooms')
    },
    handleViewProfiles() {
      // Navigate to profiles feed
      this.$router.push('/profiles')
    },
    async handleLogout() {
      try {
        await this.logout()
        this.$router.push('/login')
      } catch (error) {
        console.error('Error during logout:', error)
      }
    }
  }
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

.menu-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-container {
  display: flex;
  align-items: center;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 1px;
}

.profile-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}

.profile-link {
  text-decoration: none;
}

.profile-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.profile-icon span {
  font-size: 24px;
}

.profile-icon:hover {
  background-color: #e9ecef;
  transform: scale(1.1);
}

.logout-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  transition: all 0.3s ease;
  border-radius: 50%;
  width: 40px;
  height: 40px;
}

.logout-button:hover {
  background-color: #fee2e2;
  transform: scale(1.1);
}

.logout-button i {
  font-size: 20px;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.content-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  margin: 0 auto;
}

.welcome-text {
  color: #2c3e50;
  font-size: 24px;
  text-align: center;
  margin: 0;
  font-weight: 600;
}

.menu-buttons {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.menu-button {
  width: 100%;
  padding: 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.dashboard-btn {
  background: none;
  border: none;
  color: #3498db;
  font-size: 22px;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
  cursor: pointer;
}
.dashboard-btn:hover {
  background: #eaf6fb;
  color: #2176ae;
}

@media (max-width: 768px) {
  .menu-buttons {
    padding: 0 20px;
  }
  
  .menu-button {
    padding: 15px;
    font-size: 14px;
  }

  .header {
    padding: 15px;
  }

  .header h1 {
    font-size: 28px;
  }

  .welcome-text {
    font-size: 20px;
    padding: 0 20px;
  }

  .name {
    font-size: 14px;
  }

  .logout-button, .profile-icon {
    width: 32px;
    height: 32px;
  }

  .logout-button i {
    font-size: 16px;
  }

  .profile-icon span {
    font-size: 20px;
  }

}
</style> 