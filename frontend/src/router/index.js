import { createRouter, createWebHistory } from 'vue-router'
import AdminDashboard from '../views/AdminDashboard.vue'
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
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/users/:id/edit',
    name: 'EditUser',
    component: EditUser,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/publications/room/:id/edit',
    name: 'EditRoomPubliAdmin',
    component: EditRoomPubli,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/publications/profile/:id/edit',
    name: 'EditProfilePubliAdmin',
    component: EditProfilePubli,
    meta: { requiresAuth: true, adminOnly: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard mejorado para rutas adminOnly
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const user = localStorage.getItem('user')
    if (!user) {
      next('/login')
    } else {
      if (to.matched.some(record => record.meta.adminOnly)) {
        const userObj = JSON.parse(user)
        if (userObj.rol === 'Admin' || userObj.rol === 'admin' || userObj.role === 'admin') {
          next()
        } else {
          next('/menu')
        }
      } else {
        next()
      }
    }
  } else {
    next()
  }
})

export default router 