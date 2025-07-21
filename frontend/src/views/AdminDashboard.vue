<template>
  <div class="admin-dashboard-container">
    <header class="header">
      <div class="header-title">Panel de Administración</div>
      <div class="header-actions">
        <router-link to="/menu" class="menu-btn" title="Ir al menú principal">
          <i class="fa-solid fa-house"></i>
        </router-link>
        <button class="logout-button" @click="handleLogout" title="Cerrar sesión">
          <i class="fas fa-right-from-bracket"></i>
        </button>
      </div>
    </header>
    <main class="main-content">
      <div class="tabs">
        <button :class="{active: activeTab === 'users'}" @click="activeTab = 'users'">Estudiantes</button>
        <button :class="{active: activeTab === 'publications'}" @click="activeTab = 'publications'">Publicaciones</button>
      </div>
      <div v-if="!isAdmin" class="not-admin">
        <p>No tienes permisos para ver este panel.</p>
      </div>
      <div v-else>
        <section v-if="activeTab === 'users'">
          <h2>Estudiantes registrados</h2>
          <div class="user-actions">
            <div class="search-bar">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" v-model="userSearchQuery" placeholder="Buscar por nombre o apellidos..." class="search-input" />
            </div>
            <button @click="goToCreateUser" class="create-user-btn">
              <i class="fa-solid fa-plus"></i> Crear Nuevo Usuario
            </button>
          </div>
          <div v-if="loadingUsers">Cargando Estudiantes...</div>
          <div v-else-if="usersError" class="error">{{ usersError }}</div>
          <table v-else class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.nombre }}</td>
                <td>{{ user.apellidos }}</td>
                <td>{{ user.correo_institucional }}</td>
                <td>{{ user.rol || user.role || 'Estudiante' }}</td>
                <td>
                  <!-- Acciones: editar/eliminar (placeholder) -->
                  <button v-if="!isCurrentAdmin(user) && user.rol !== 'Admin'" @click="deleteUser(user)" class="delete-btn">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                  <button @click="editUser(user)">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <section v-else-if="activeTab === 'publications'">
          <h2>Todas las publicaciones</h2>
          <div class="filter-bar">
            <div>
              <label>Filtrar por tipo:</label>
              <select v-model="publicationFilter" class="filter-select">
                <option value="all">Todas</option>
                <option value="Habitacion">Habitaciones</option>
                <option value="Perfil">Perfil RooMe</option>
              </select>
            </div>
            <div class="search-bar publication-search">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" v-model="publicationUserFilter" placeholder="Buscar por nombre de estudiante..." class="search-input" />
            </div>
          </div>
          <div v-if="loadingPublications">Cargando publicaciones...</div>
          <div v-else-if="publicationsError" class="error">{{ publicationsError }}</div>
          <table v-else class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th v-if="pubsHasDireccion">Dirección</th>
                <th>Nombre del Estudiante</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pub in filteredPublications" :key="pub.id">
                <td>{{ pub.id }}</td>
                <td>{{ pub.type }}</td>
                <td>{{ truncateWords(pub.descripcion || pub.description, 12) }}</td>
                <!-- Solo mostrar la columna Dirección si la publicación es de tipo Habitacion -->
                <td v-if="pub.type === 'Habitacion'">{{ pub.direccion }}</td>
                <td v-else-if="pubsHasDireccion"></td>
                <td>{{ getUserName(pub.user_id) }}</td>
                <td>{{ pub.status === 'Activa' ? 'Activa' : 'Inactiva' }}</td>
                <td class="actions-cell">
                  <button @click="togglePublicationStatus(pub)" :title="pub.status === 'Activa' ? 'Desactivar' : 'Activar'" class="icon-btn action-btn">
                    <i :class="pub.status === 'Activa' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'"></i>
                  </button>
                  <button @click="deletePublication(pub)" title="Eliminar" class="icon-btn delete-btn action-btn">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                  <button @click="editPublication(pub)" class="edit-btn action-btn">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </main>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
export default {
  name: 'AdminDashboard',
  data() {
    return {
      activeTab: 'users',
      users: [],
      usersError: '',
      loadingUsers: false,
      publications: [],
      publicationsError: '',
      loadingPublications: false,
      publicationFilter: 'all',
      userSearchQuery: '',
      publicationUserFilter: '',
    }
  },
  computed: {
    ...mapGetters(['currentUser']),
    isAdmin() {
      return this.currentUser && (this.currentUser.rol === 'Admin' || this.currentUser.rol === 'admin' || this.currentUser.role === 'admin');
    },
    pubsHasDireccion() {
      return this.publications.some(pub => pub.type === 'Habitacion');
    },
    filteredPublications() {
      let filtered = [...this.publications];

      if (this.publicationFilter !== 'all') {
        filtered = filtered.filter(pub => pub.type === this.publicationFilter);
      }

      const userQuery = this.publicationUserFilter.toLowerCase().trim();
      if (userQuery) {
        const matchingUserIds = this.users
          .filter(user => {
            const fullName = `${user.nombre} ${user.apellidos}`.toLowerCase();
            return fullName.includes(userQuery);
          })
          .map(user => user.id);
        
        if (matchingUserIds.length > 0) {
          filtered = filtered.filter(pub => matchingUserIds.includes(pub.user_id));
        } else {
          return [];
        }
      }

      return filtered;
    },
    filteredUsers() {
      if (!this.userSearchQuery) {
        return this.users;
      }
      const query = this.userSearchQuery.toLowerCase().trim();
      return this.users.filter(user => {
        const fullName = `${user.nombre} ${user.apellidos}`.toLowerCase();
        return fullName.includes(query);
      });
    }
  },
  mounted() {
    if (this.isAdmin) {
      this.fetchUsers();
      this.fetchPublications();
    }
  },
  methods: {
    ...mapActions(['logout']),
    goToCreateUser() {
      this.$router.push('/admin/users/create');
    },
    async handleLogout() {
      try {
        await this.logout();
        this.$router.push('/login');
      } catch (error) {
        console.error('Error during logout:', error);
      }
    },
    async fetchUsers() {
      this.loadingUsers = true;
      this.usersError = '';
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al cargar Estudiantes');
        this.users = await res.json();
      } catch (e) {
        this.usersError = e.message;
      } finally {
        this.loadingUsers = false;
      }
    },
    async fetchPublications() {
      this.loadingPublications = true;
      this.publicationsError = '';
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/publications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al cargar publicaciones');
        this.publications = await res.json();
      } catch (e) {
        this.publicationsError = e.message;
      } finally {
        this.loadingPublications = false;
      }
    },
    viewUser(user) {
      this.$router.push(`/admin/users/${user.id}/edit`);
    },
    editUser(user) {
      this.$router.push(`/admin/users/${user.id}/edit`);
    },
    async deleteUser(user) {
      if (confirm('¿Seguro que quieres eliminar este usuario?')) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/users/${user.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Error al eliminar usuario');
          this.fetchUsers();
        } catch (e) {
          alert(e.message);
        }
      }
    },
    viewPublication(pub) {
      if (pub.type === 'Habitación' || pub.type === 'Habitacion' || pub.type === 'Room') {
        this.$router.push(`/admin/publications/room/${pub.id}/edit`);
      } else {
        this.$router.push(`/admin/publications/profile/${pub.id}/edit`);
      }
    },
    editPublication(pub) {
      if (pub.type === 'Habitacion') {
        this.$router.push(`/admin/publications/room/${pub.id}/edit`);
      } else {
        this.$router.push(`/admin/publications/profile/${pub.id}/edit`);
      }
    },
    async deletePublication(pub) {
      if (confirm('¿Seguro que quieres eliminar esta publicación permanentemente?')) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/publications/${pub.id}/hard`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Error al eliminar publicación');
          this.fetchPublications();
        } catch (e) {
          alert(e.message);
        }
      }
    },
    async togglePublicationStatus(pub) {
      try {
        const token = localStorage.getItem('token');
        const newStatus = pub.status === 'Activa' ? 'Desactivada' : 'Activa';
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/publications/${pub.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ estado: newStatus })
        });
        if (!res.ok) throw new Error('Error al cambiar el estado');
        this.fetchPublications();
      } catch (e) {
        alert(e.message);
      }
    },
    truncateWords(text, maxWords) {
      if (!text) return '';
      const words = text.split(' ');
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '...';
    },
    isCurrentAdmin(user) {
      return this.currentUser?.id === user.id;
    },
    getUserName(userId) {
      const user = this.users.find(u => u.id === userId);
      return user ? `${user.nombre} ${user.apellidos}` : `ID: ${userId}`;
    }
  }
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
.admin-dashboard-container {
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
.header-title {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  flex: 1;
  text-align: left;
}
.header-spacer {
  flex: 1;
}
.main-content {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.tabs button {
  padding: 10px 30px;
  border: none;
  background: #e0e0e0;
  color: #2c3e50;
  font-weight: bold;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}
.tabs button.active {
  background: #3498db;
  color: white;
}
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}
.admin-table th, .admin-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.admin-table th {
  background: #f8f9fa;
  color: #2c3e50;
  font-weight: bold;
}
.admin-table tr:last-child td {
  border-bottom: none;
}
.admin-table button {
  margin-right: 5px;
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: #3498db;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.admin-table button:hover {
  background: #2176ae;
}
.error {
  color: #e74c3c;
  margin: 10px 0;
}
.not-admin {
  color: #e74c3c;
  font-weight: bold;
  margin: 30px 0;
  text-align: center;
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
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  margin-right: 4px;
  color: #3498db;
  font-size: 16px;
  transition: color 0.2s;
}
.icon-btn:hover {
  color: #2176ae;
}
.delete-btn {
  color: #e74c3c;
}
.delete-btn:hover {
  color: #c0392b;
}
.filter-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.filter-bar .search-bar {
  flex-grow: 1;
}
.publication-search {
  max-width: 400px;
}
.filter-select {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 16px;
  background-color: white;
  height: 42px; /* Alineación con la barra de búsqueda */
}
.filter-bar label {
  font-weight: bold;
  color: #2c3e50;
  margin-right: 10px;
  display: block;
  margin-bottom: 5px;
}
.actions-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}
.action-btn {
  min-width: 36px;
  min-height: 36px;
  padding: 0 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-btn {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0 14px;
  height: 36px;
}
.edit-btn:hover {
  background: #2176ae;
}
.user-actions {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.search-bar {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0 10px;
  flex-grow: 1;
  max-width: 400px;
}
.search-icon {
  color: #999;
  margin-right: 8px;
}
.search-input {
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 16px;
  width: 100%;
  background: transparent;
}
.create-user-btn {
  background-color: #28a745;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  flex-shrink: 0;
}
.create-user-btn:hover {
  background-color: #218838;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.menu-btn {
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
.menu-btn:hover {
  background: #eaf6fb;
  color: #2176ae;
}
</style> 