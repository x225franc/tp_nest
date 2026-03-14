<script setup>
	import { ref } from "vue";
	import { useAuth } from "../composables/useAuth";
	import { useRouter } from "vue-router";

	const router = useRouter();
	const { currentUser, updateProfile } = useAuth();

	const errorMessage = ref("");
	const successMessage = ref("");
	const isLoading = ref(false);

	const form = ref({
		username: currentUser.value?.username || "",
		customColor: currentUser.value?.customColor || "#ffffff",
	});

	const handleSubmit = async () => {
		errorMessage.value = "";
		successMessage.value = "";
		isLoading.value = true;

		const result = await updateProfile({
			username: form.value.username,
			customColor: form.value.customColor,
		});

		if (result.success) {
			successMessage.value = "Profil mis à jour avec succès!";
			setTimeout(() => {
				successMessage.value = "";
			}, 2000);
		} else {
			errorMessage.value = result.error;
		}

		isLoading.value = false;
	};

	const handleReset = () => {
		form.value.username = currentUser.value?.username || "";
		form.value.customColor = currentUser.value?.customColor || "#ffffff";
		errorMessage.value = "";
		successMessage.value = "";
	};

	const handleGoBack = () => {
		window.history.back();
	};
</script>

<template>
	<div class="mc-page">
		<div class="container" style="max-width: 560px">
			<div
				class="d-flex justify-content-between align-items-center mb-4 text-white"
			>
				<h1 class="h4 mb-0">Paramètres du profil</h1>
				<button class="btn btn-outline-light btn-sm" @click="handleGoBack">
					← Retour
				</button>
			</div>

			<div class="card mc-card">
				<div class="card-body">
					<form @submit.prevent="handleSubmit">
						<div class="mb-3">
							<label for="username" class="form-label">Nom d'utilisateur</label>
							<input
								id="username"
								v-model="form.username"
								type="text"
								placeholder="Votre nom d'utilisateur"
								class="form-control mc-input"
								required
							/>
						</div>

						<div class="mb-3">
							<label for="color" class="form-label"
								>Couleur personnalisée</label
							>
							<div class="d-flex align-items-center gap-3">
								<input
									id="color"
									v-model="form.customColor"
									type="color"
									class="form-control form-control-color"
								/>
								<span class="badge text-bg-dark">{{ form.customColor }}</span>
							</div>
						</div>

						<div v-if="errorMessage" class="alert alert-danger py-2">
							{{ errorMessage }}
						</div>
						<div v-if="successMessage" class="alert alert-success py-2">
							{{ successMessage }}
						</div>

						<div class="d-flex gap-2 mt-4">
							<button
								type="submit"
								class="btn btn-mc-primary flex-fill"
								:disabled="isLoading"
							>
								{{ isLoading ? "En cours..." : "Enregistrer" }}
							</button>
							<button
								type="button"
								class="btn btn-secondary flex-fill"
								@click="handleReset"
							>
								Annuler
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>
