<script setup>
	import { ref, computed, onMounted } from "vue";
	import { useRoute } from "vue-router";
	import { useAuth } from "../../composables/useAuth";

	const route = useRoute();
	const { resetPassword, validateResetToken } = useAuth();

	const newPassword = ref("");
	const confirmPassword = ref("");
	const token = ref("");

	const loading = ref(true);
	const invalidToken = ref(false);
	const resetSuccess = ref(false);
	const error = ref(false);
	const errorMessage = ref("");

	const passwordsMatch = computed(
		() => newPassword.value === confirmPassword.value,
	);

	const passwordError = computed(() => {
		return (
			confirmPassword.value.length > 0 &&
			newPassword.value !== confirmPassword.value
		);
	});

	const submitNewPassword = async () => {
		if (!passwordsMatch.value) return;

		loading.value = true;
		error.value = false;

		const result = await resetPassword(token.value, newPassword.value);

		if (result.success) {
			resetSuccess.value = true;
		} else {
			error.value = true;
			errorMessage.value = result.error;
		}
		loading.value = false;
	};

	onMounted(async () => {
		const tokenParam = route.query.token;
		if (!tokenParam) {
			invalidToken.value = true;
			loading.value = false;
			return;
		}

		token.value = tokenParam;

		const validation = await validateResetToken(tokenParam);
		if (!validation.success) {
			invalidToken.value = true;
		}
		loading.value = false;
	});
</script>

<template>
	<div class="mc-page">
		<div
			class="container d-flex justify-content-center align-items-center"
			style="min-height: 60vh"
		>
			<div class="mc-card p-4" style="max-width: 500px; width: 100%">
				<div v-if="loading" class="text-center">
					<h2 class="mb-3">Vérification en cours...</h2>
				</div>

				<div v-else-if="invalidToken" class="text-center">
					<h2 class="mb-3">Lien invalide</h2>
					<router-link to="/forgot-password" class="btn btn-mc-primary">
						Demander un nouveau lien
					</router-link>
				</div>

				<div v-else-if="resetSuccess" class="text-center">
					<h2 class="mb-3">Mot de passe réinitialisé</h2>
					<router-link to="/" class="btn btn-mc-primary"
						>Se connecter</router-link
					>
				</div>

				<div v-else>
					<h2 class="mb-4">Réinitialiser votre mot de passe</h2>

					<form @submit.prevent="submitNewPassword">
						<div class="mb-3">
							<label for="password" class="form-label"
								>Nouveau mot de passe:</label
							>
							<input
								id="password"
								v-model="newPassword"
								type="password"
								placeholder="Nouveau mot de passe"
								class="form-control mc-input"
								pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
								title="Le mot de passe doit contenir au moins 8 caractères , 1 majuscule et un caractère spécial."
								required
							/>
						</div>

						<div class="mb-3">
							<label for="confirm" class="form-label"
								>Confirmer le mot de passe:</label
							>
							<input
								id="confirm"
								v-model="confirmPassword"
								type="password"
								placeholder="Confirmer le mot de passe"
								class="form-control mc-input"
								pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
								title="Le mot de passe doit contenir au moins 8 caractères , 1 majuscule et un caractère spécial."
								required
							/>
						</div>

						<div v-if="passwordError" class="alert alert-danger">
							Les mots de passe ne correspondent pas.
						</div>

						<button
							type="submit"
							class="btn btn-mc-primary w-100"
							:disabled="!passwordsMatch || loading"
						>
							{{ loading ? "Mise à jour..." : "Réinitialiser" }}
						</button>
					</form>

					<div v-if="error" class="alert alert-danger mt-3">
						{{ errorMessage }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
