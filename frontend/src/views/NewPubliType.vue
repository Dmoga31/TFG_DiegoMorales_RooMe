<template>
    <div class="menu-container">
    <header class="header">
      <router-link to="/menu" class="back-button">
        <i class="fa-solid fa-arrow-left"></i>
      </router-link>
      <h1>Nueva Publicación</h1>
      <router-link to="/profile" class="profile-link">👤</router-link>
    </header>
      <main class="main-content">
        <div class="content-container">
          <h2 class="welcome-text">¿Qué tipo de publicación quieres hacer?</h2>
          <div class="menu-buttons">
            <button class="menu-button" @click="handleNewRoomPublication">
              Habitación
            </button>
            <button class="menu-button" @click="handleNewProfilePublication">
              Perfil RooMe
            </button>
          </div>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
import { mapActions, mapGetters } from 'vuex';
  
  export default {
    name: 'MenuPrincipal',
    computed: {
      ...mapGetters(['currentUser'])
    },
    methods: {
      ...mapActions(['logout']),
      async handleNewRoomPublication() {
        const token = localStorage.getItem('token');
        try {
          // Consultar si ya tiene publicación de habitación
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/rooms/all`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (Array.isArray(res.data) && res.data.length > 0) {
            window.alert('Ya tienes una publicación de habitación. No puedes crear otra.');
            return;
          }
          this.$router.push('/new-room-publi');
        } catch (err) {
          window.alert('Error al comprobar tus publicaciones.');
        }
      },
      async handleNewProfilePublication() {
        const token = localStorage.getItem('token');
        try {
          // Consultar si ya tiene publicación de perfil
          const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/all`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (Array.isArray(res.data) && res.data.length > 0) {
            window.alert('Ya tienes una publicación de perfil. No puedes crear otra.');
            return;
          }
          this.$router.push('/new-profile-publi');
        } catch (err) {
          window.alert('Error al comprobar tus publicaciones.');
        }
      }
    }
  }
  </script>
  
  <style scoped>
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
  
  .profile-container {
    display: flex;
    align-items: center;
    gap: 10px;
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
  
  .name {
    font-size: 16px;
    font-weight: bold;
    color: #2c3e50;
  }

  .welcome-text {
    color: #2c3e50;
    font-size: 24px;
    text-align: center;
    margin: 0;
    font-weight: 600;
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
  
    .logout-button, .profile-icon {
      width: 32px;
      height: 32px;
    }
  
    .logout-icon, .profile-icon span {
      font-size: 20px;
    }
  }
  </style> 