import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue';
import General from '../views/General.vue';
import Settings from '../views/Settings.vue';
import Rooms from '../views/Rooms.vue';

const routes = [
    { path: '/', name: 'Home', component: Home, meta: { title: 'Accueil' } },
    { path: '/general', name: 'General', component: General, meta: { title: 'Général', requiresAuth: true } },
    { path: '/rooms', name: 'Rooms', component: Rooms, meta: { title: 'Salles', requiresAuth: true } },
    { path: '/settings', name: 'Settings', component: Settings, meta: { title: 'Paramètres', requiresAuth: true } },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('currentUser')
    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Home' })
    } else {
        next()
    }
})

export default router