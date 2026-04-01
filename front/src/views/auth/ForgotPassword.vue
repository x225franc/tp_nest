<script setup>
import { ref } from "vue";
import { useAuth } from "../../composables/useAuth";

const { forgotPassword } = useAuth();

const email = ref("");
const loading = ref(false);
const error = ref(false);
const errorMessage = ref("");
const emailSent = ref(false);

const submitEmail = async () => {
    loading.value = true;
    error.value = false;
    
    const result = await forgotPassword(email.value);
    
    if (result.success) {
        emailSent.value = true;
    } else {
        error.value = true;
        errorMessage.value = result.error;
    }
    
    loading.value = false;
};
</script>

<template>
    <div class="mc-page">
        <div class="container d-flex justify-content-center align-items-center" style="min-height: 60vh">
            <div class="mc-card p-4" style="max-width: 500px; width: 100%">
                <h2 class="mb-4 text-center">Mot de passe oublié?</h2>

                <div v-if="!emailSent">
                    <p class="mb-3 mc-text-muted">
                        Entrez votre adresse email pour recevoir un lien de réinitialisation.
                    </p>

                    <form @submit.prevent="submitEmail">
                        <div class="mb-3">
                            <label for="email" class="form-label">Adresse email:</label>
                            <input
                                id="email"
                                v-model="email"
                                type="email"
                                class="form-control mc-input"
                                placeholder="votre@email.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            class="btn btn-mc-primary w-100 mb-2"
                            :disabled="loading"
                        >
                            {{ loading ? "Envoi en cours..." : "Envoyer le lien" }}
                        </button>
                    </form>

                    <div v-if="error" class="alert alert-danger mt-3">
                        {{ errorMessage }}
                    </div>

                    <router-link to="/" class="d-block text-center mt-3 text-muted">
                        Retour
                    </router-link>
                </div>

                <div v-else class="text-center">
                    <h3 class="mb-3">Email envoyé</h3>
                    <p class="mb-2">
                        Lien de réinitialisation envoyé à <strong>{{ email }}</strong>
                    </p>
                    <p class="mb-3 mc-text-muted">
                        vérifier votre email et cliquez sur le lien pour réinitialiser votre mot de passe.
                    </p>

                    <router-link to="/" class="btn btn-mc-primary mt-3">
                        Retour
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>