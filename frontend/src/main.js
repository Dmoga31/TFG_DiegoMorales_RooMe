import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

const app = createApp(App)

// Check authentication status before mounting
store.dispatch('checkAuth')

app.use(router)
app.use(store)
app.mount('#app') 