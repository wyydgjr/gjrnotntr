import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/front-router'
import i18n from './i18n'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import lazyLoad from './directives/lazy-load'
import { setupGlobalErrorHandler, trackPageLoad } from './utils/monitoring'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.directive('lazy', lazyLoad)

app.config.errorHandler = (err, instance, info) => {
  console.error('[VeStore Error]', err, { instance, info })
  if (import.meta.env.PROD) {
    // TODO: Sentry.captureException(err, { extra: { info } })
  }
}

setupGlobalErrorHandler()
trackPageLoad()

const auth = useAuthStore()
auth.initFromStorage()

if (auth.isLoggedIn) {
  const cart = useCartStore()
  cart.loadFromServer()
}

app.mount('#app')
