<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../../composables/useAuth";

const route = useRoute();
const router = useRouter();
const { verifyEmail } = useAuth();

const loading = ref(true);
const success = ref(false);
const error = ref(false);
const errorMessage = ref("");

onMounted(async () => {
    const token = route.query.token;
    
    if (!token) {
        error.value = true;
        errorMessage.value = "Token manquant";
        loading.value = false;
        return;
    }

    const result = await verifyEmail(token);
    loading.value = false;

    if (result.success) {
        success.value = true;
        setTimeout(() => router.push("/"), 2000);
    } else {
        error.value = true;
        errorMessage.value = result.error;
    }
});

</script>

<template>
    <div class="mc-page">
        <div class="container d-flex justify-content-center align-items-center" style="min-height: 60vh">
            <div class="mc-card p-4" style="max-width: 500px; width: 100%">
                
                <div v-if="loading" class="text-center">
                    <h2 class="mb-3">Vérification en cours...</h2>
                </div>

                <div v-else-if="success" class="text-center">
                    <h2 class="mb-3">Email vérifié</h2>
                    <p class="mb-3">Vous pouvez maintenant vous connecter.</p>
                    <router-link to="/signin" class="btn btn-mc-primary">Se connecter</router-link>
                </div>

                <div v-else-if="error" class="text-center">
                    <h2 class="mb-3">Erreur de vérification</h2>
                    <p class="mb-3 mc-text-muted">{{ errorMessage }}</p>
                    <router-link to="/" class="btn btn-mc-primary me-2">Retour</router-link>
                </div>

            </div>
        </div>
    </div>
</template>