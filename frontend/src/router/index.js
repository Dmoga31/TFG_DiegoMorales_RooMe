import { createRouter, createWebHistory } from 'vue-router'
import AdminDashboard from '../views/AdminDashboard.vue'
import CreateUser from '../views/CreateUser.vue'
import EditProfile from '../views/EditProfile.vue'
import EditProfilePubli from '../views/EditProfilePubli.vue'
import EditRoomPubli from '../views/EditRoomPubli.vue'
import EditUser from '../views/EditUser.vue'
import Login from '../views/Login.vue'
import MenuPrincipal from '../views/MenuPrincipal.vue'
import MyPublications from '../views/MyPublications.vue'
import NewProfilePubli from '../views/NewProfilePubli.vue'
import NewPubliType from '../views/NewPubliType.vue'
import NewRoomPubli from '../views/NewRoomPubli.vue'
import Profile from '../views/Profile.vue'
import ProfileDetail from '../views/ProfileDetail.vue'
import ProfileFeed from '../views/ProfileFeed.vue'
import Register from '../views/Register.vue'
import RoomDetail from '../views/RoomDetail.vue'
import RoomFeed from '../views/RoomFeed.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/menu',
    name: 'MenuPrincipal',
    component: MenuPrincipal,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: EditProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/rooms',
    name: 'RoomFeed',
    component: RoomFeed,
    meta: { requiresAuth: true }
  },
  {
    path: '/rooms/:id',
    name: 'RoomDetail',
    component: RoomDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/profiles',
    name: 'ProfileFeed',
    component: ProfileFeed,
    meta: { requiresAuth: true }
  },
  {
    path: '/profiles/:id',
    name: 'ProfileDetail',
    component: ProfileDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/new-publi-type',
    name: 'NewPubliType',
    component: NewPubliType,
    meta: { requiresAuth: true }
  },
  {
    path: '/my-publications',
    name: 'MyPublications',
    component: MyPublications,
    meta: { requiresAuth: true }
  },
  {
    path: '/new-room-publi',
    name: 'NewRoomPubli',
    component: NewRoomPubli,
    meta: { requiresAuth: true }
  },
  {
    path: '/new-profile-publi',
    name: 'NewProfilePubli',
    component: NewProfilePubli,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-room/:id',
    name: 'EditRoomPubli',
    component: EditRoomPubli,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-profile-publi/:id',
    name: 'EditProfilePubli',
    component: EditProfilePubli,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/users/:id/edit',
    name: 'EditUser',
    component: EditUser,
    props: true,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/users/create',
    name: 'CreateUser',
    component: CreateUser,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/publications/room/:id/edit',
    name: 'AdminEditRoom',
    component: EditRoomPubli,
    props: true,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/publications/profile/:id/edit',
    name: 'AdminEditProfile',
    component: EditProfilePubli,
    props: true,
    meta: { requiresAuth: true, adminOnly: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard mejorado para rutas adminOnly
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login');
    } else {
      if (to.matched.some(record => record.meta.adminOnly)) {
        if (user && (user.rol === 'Admin' || user.rol === 'admin' || user.role === 'admin')) {
          next();
        } else {
          next('/menu'); // o a una página de 'no autorizado'
        }
      } else {
        next();
      }
    }
  } else {
    next();
  }
})

export default router 