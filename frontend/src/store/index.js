import axios from 'axios'
import { createStore } from 'vuex'

export default createStore({
  state: {
    user: null,
    isAuthenticated: false
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isAuthenticated = !!user
      // Store user in localStorage for persistence
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    }
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/login`,
          credentials
        )
        // Save token and user info
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        commit('setUser', res.data.user)
        return res.data.user
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Credenciales incorrectas')
      }
    },
    logout({ commit }) {
      localStorage.removeItem('token')
      commit('setUser', null)
    },
    checkAuth({ commit }) {
      const user = localStorage.getItem('user')
      if (user) {
        commit('setUser', JSON.parse(user))
      }
    }
  },
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.user
  }
}) 