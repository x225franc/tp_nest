import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue';
import General from '../views/General.vue';
import Settings from '../views/Settings.vue';
import Rooms from '../views/Rooms.vue';
import VerifyEmail from '../views/auth/VerifyEmail.vue';
import ForgotPassword from '../views/auth/ForgotPassword.vue';
import ResetPassword from '../views/auth/ResetPassword.vue';
import NotFound from '../views/NotFound.vue';

const routes = [
    { path: '/', name: 'Home', component: Home, meta: { title: 'Accueil' } },
    { path: '/general', name: 'General', component: General, meta: { title: 'Général', requiresAuth: true } },
    { path: '/rooms', name: 'Rooms', component: Rooms, meta: { title: 'Salles', requiresAuth: true } },
    { path: '/settings', name: 'Settings', component: Settings, meta: { title: 'Paramètres', requiresAuth: true } },
    { path: '/verify-email', name: 'VerifyEmail', component: VerifyEmail, meta: { title: 'Vérifier votre email' } },
    { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { title: 'Mot de passe oublié' } },
    { path: '/reset-password', name: 'ResetPassword', component: ResetPassword, meta: { title: 'Réinitialiser le mot de passe' } },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound, meta: { title: '404' } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from) => {
    const isAuthenticated = localStorage.getItem('currentUser')
    if (to.meta.requiresAuth && !isAuthenticated) {
        return { name: 'Home' }
    }
})

export default router