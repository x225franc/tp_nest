<script setup>
	import { ref, computed } from "vue";
	import { useAuth } from "../composables/useAuth";
	import { useRouter } from "vue-router";

	const router = useRouter();
	const { currentUser, updateProfile, changePassword, enable2FA, disable2FA } = useAuth();

	const errorMessage = ref("");
	const successMessage = ref("");
	const isLoading = ref(false);

	const twoFactorEnabled = ref(currentUser.value?.twoFactorEnabled || false);
	const twoFactorLoading = ref(false);
	const twoFactorMessage = ref("");
	const twoFactorError = ref(false);

	const form = ref({
		username: currentUser.value?.username || "",
		customColor: currentUser.value?.customColor || "#ffffff",
	});

	const oldPassword = ref("");
	const newPassword = ref("");
	const confirmPassword = ref("");
	const changePasswordLoading = ref(false);
	const changePasswordError = ref(false);
	const changePasswordErrorMessage = ref("");
	const changePasswordSuccess = ref(false);
	const changePasswordSuccessMessage = ref("");

	const passwordsMatch = computed(() => newPassword.value === confirmPassword.value);
	const formValid = computed(() => oldPassword.value.length > 0 && passwordsMatch.value && newPassword.value.length >= 6);
	const passwordError = computed(() => confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value);
	const changePasswordFormValid = computed(() => oldPassword.value && passwordsMatch.value && newPassword.value);

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

	const submitChangePassword = async () => {
		if (!changePasswordFormValid.value) return;
		changePasswordLoading.value = true;
		changePasswordError.value = false;
		changePasswordSuccess.value = false;
		changePasswordErrorMessage.value = "";
		changePasswordSuccessMessage.value = "";
		const result = await changePassword(oldPassword.value, newPassword.value);
		if (result.success) {
			changePasswordSuccess.value = true;
			changePasswordSuccessMessage.value = result.message;
			oldPassword.value = "";
			newPassword.value = "";
			confirmPassword.value = "";
			setTimeout(() => { changePasswordSuccess.value = false; changePasswordSuccessMessage.value = ""; }, 3000);
		} else {
			changePasswordError.value = true;
			changePasswordErrorMessage.value = result.error;
		}
		changePasswordLoading.value = false;
	};

	const showChangePassword = ref(false);

	const toggle2FA = async () => {
		twoFactorLoading.value = true;
		twoFactorError.value = false;
		twoFactorMessage.value = "";

		let result;
		if (twoFactorEnabled.value) {
			result = await enable2FA();
		} else {
			result = await disable2FA();
		}

		if (result.success) {
			twoFactorMessage.value = result.message;
			setTimeout(() => {
				twoFactorMessage.value = "";
			}, 3000);
		} else {
			twoFactorError.value = true;
			twoFactorMessage.value = result.error;
			twoFactorEnabled.value = !twoFactorEnabled.value;
		}

		twoFactorLoading.value = false;
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

					<hr class="my-4" />
					<button class="btn btn-outline-secondary mb-2" type="button" @click="showChangePassword = !showChangePassword">
						{{ showChangePassword ? 'Masquer' : 'Changer le mot de passe' }}
					</button>
					<transition name="fade">
						<div v-if="showChangePassword">
							<h5 class="mb-3">Changer le mot de passe</h5>
							<form @submit.prevent="submitChangePassword" class="mb-0">
								<div class="mb-2">
									<label for="oldPassword" class="form-label">Mot de passe actuel</label>
									<input
										id="oldPassword"
										v-model="oldPassword"
										type="password"
										class="form-control mc-input"
										placeholder="Mot de passe actuel"
										required
									/>
								</div>
								<div class="mb-2">
									<label for="newPassword" class="form-label">Nouveau mot de passe</label>
									<input
										id="newPassword"
										v-model="newPassword"
										type="password"
										placeholder="Nouveau mot de passe"
										class="form-control mc-input"
										pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
										title="Le mot de passe doit contenir au moins 8 caractères , 1 majuscule et un caractère spécial."
										required
									/>
								</div>
								<div class="mb-2">
									<label for="confirmPassword" class="form-label">Confirmer le nouveau mot de passe</label>
									<input
										id="confirmPassword"
										v-model="confirmPassword"
										type="password"
										placeholder="Confirmer le nouveau mot de passe"
										class="form-control mc-input"
										pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
										title="Le mot de passe doit contenir au moins 8 caractères , 1 majuscule et un caractère spécial."
										required
									/>
								</div>
								<div v-if="passwordError" class="alert alert-danger py-2">
									{{ passwordError ? "Les mots de passe ne correspondent pas." : "" }}
								</div>
								<div v-if="changePasswordError" class="alert alert-danger py-2">
									{{ changePasswordErrorMessage  }}
								</div>
								<div v-if="changePasswordSuccess" class="alert alert-success py-2">
									{{ changePasswordSuccessMessage }}
								</div>
								<button
									type="submit"
									class="btn btn-mc-primary w-100 mt-2"
									:disabled="!changePasswordFormValid || changePasswordLoading"
								>
									{{ changePasswordLoading ? "Mise à jour..." : "Changer le mot de passe" }}
								</button>
							</form>
						</div>
					</transition>

					<hr class="my-4" />
					<div class="mb-3">
						<label class="form-label">Authentification à 2 facteurs (2FA)</label>
						<div class="form-check form-switch">
							<input class="form-check-input" type="checkbox" id="2faSwitch" v-model="twoFactorEnabled" @change="toggle2FA" :disabled="twoFactorLoading">
							<label class="form-check-label" for="2faSwitch">
								{{ twoFactorEnabled ? 'Activée' : 'Désactivée' }}
							</label>
						</div>
						<div v-if="twoFactorMessage" :class="['mt-2', twoFactorError ? 'alert alert-danger' : 'alert alert-success']">
							{{ twoFactorMessage }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
