import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App);

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || 'MonChat';
    next();
});

app.use(router);
app.mount("#app");

