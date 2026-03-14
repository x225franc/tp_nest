<script setup>
import { ref, provide } from 'vue';
import Header from './components/Header.vue';
import { useAuth } from './composables/useAuth';
import { useRouter } from 'vue-router';

const router = useRouter();
const { isLoggedIn, currentUser, logout, signin, signup } = useAuth();

provide('openSigninModal', () => { isSigninModalOpen.value = true; errorMessage.value = ''; successMessage.value = ''; });

const isSigninModalOpen = ref(false);
const isSignupModalOpen = ref(false);

const signinForm = ref({ email: '', password: '' });
const signupForm = ref({ username: '', email: '', password: '' });
const errorMessage = ref('');
const successMessage = ref('');

const openSigninModal = () => { isSigninModalOpen.value = true; errorMessage.value = ''; successMessage.value = ''; };
const closeSigninModal = () => { isSigninModalOpen.value = false; signinForm.value = { email: '', password: '' }; };
const openSignupModal = () => { isSignupModalOpen.value = true; errorMessage.value = ''; successMessage.value = ''; };
const closeSignupModal = () => { isSignupModalOpen.value = false; signupForm.value = { username: '', email: '', password: '' }; };

const handleSignin = async () => {
	errorMessage.value = '';
	successMessage.value = '';
	
	const result = await signin(signinForm.value.email, signinForm.value.password);
	if (result.success) {
		successMessage.value = `Bienvenue ${result.user.username} !`;
		setTimeout(() => {
			closeSigninModal();
            router.push('/general');
		}, 1500);
	} else {
		errorMessage.value = result.error;
	}
};

const handleSignup = async () => {
	errorMessage.value = '';
	successMessage.value = '';
	
	const result = await signup(signupForm.value.username, signupForm.value.email, signupForm.value.password);
	if (result.success) {
		successMessage.value = result.message;
		setTimeout(() => {
			closeSignupModal();
		}, 1500);
	} else {
		errorMessage.value = result.error;
	}
};
</script>

<template>
	<div>
		<Header 
			:isLoggedIn="isLoggedIn" 
			:currentUser="currentUser"
			@logout="logout"
			@signin="openSigninModal"
			@signup="openSignupModal"
		/>

		<div v-if="isSigninModalOpen" class="modal-overlay-custom" @click.self="closeSigninModal">
			<div class="card mc-card w-100" style="max-width:420px;">
				<div class="card-header d-flex justify-content-between align-items-center border-0">
					<h2 class="h5 mb-0">Connexion</h2>
					<button type="button" class="btn-close btn-close-white" aria-label="Close" @click="closeSigninModal"></button>
				</div>
				<div class="card-body">
					<form @submit.prevent="handleSignin">
						<div class="mb-3">
							<label for="signin-email" class="form-label">Email</label>
							<input 
								id="signin-email"
								v-model="signinForm.email" 
								type="email" 
								placeholder="exemple@email.com"
								class="form-control mc-input"
								required
							/>
						</div>
						<div class="mb-3">
							<label for="signin-password" class="form-label">Mot de passe</label>
							<input 
								id="signin-password"
								v-model="signinForm.password" 
								type="password" 
								placeholder="••••••••"
								class="form-control mc-input"
								required
							/>
						</div>
						<div v-if="errorMessage" class="alert alert-danger py-2">{{ errorMessage }}</div>
						<div v-if="successMessage" class="alert alert-success py-2">{{ successMessage }}</div>
						<button type="submit" class="btn btn-mc-primary w-100">Se connecter</button>
						<p class="mt-3 mb-0 text-center small">Pas encore inscrit ? <a href="#" @click.prevent="() => { closeSigninModal(); openSignupModal(); }">S'inscrire</a></p>
					</form>
				</div>
			</div>
		</div>

		<div v-if="isSignupModalOpen" class="modal-overlay-custom" @click.self="closeSignupModal">
			<div class="card mc-card w-100" style="max-width:420px;">
				<div class="card-header d-flex justify-content-between align-items-center border-0">
					<h2 class="h5 mb-0">Inscription</h2>
					<button type="button" class="btn-close btn-close-white" aria-label="Close" @click="closeSignupModal"></button>
				</div>
				<div class="card-body">
					<form @submit.prevent="handleSignup">
						<div class="mb-3">
							<label for="signup-username" class="form-label">Nom d'utilisateur</label>
							<input 
								id="signup-username"
								v-model="signupForm.username" 
								type="text" 
								placeholder="MonPseudo"
								class="form-control mc-input"
								required
							/>
						</div>
						<div class="mb-3">
							<label for="signup-email" class="form-label">Email</label>
							<input 
								id="signup-email"
								v-model="signupForm.email" 
								type="email" 
								placeholder="exemple@email.com"
								class="form-control mc-input"
								required
							/>
						</div>
						<div class="mb-3">
							<label for="signup-password" class="form-label">Mot de passe</label>
							<input 
								id="signup-password"
								v-model="signupForm.password" 
								type="password" 
								placeholder="••••••••"
								class="form-control mc-input"
								pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
                                title="Le mot de passe doit contenir au moins 8 caractères , 1 majuscule et un caractère spécial."
								required
							/>
						</div>
						<div v-if="errorMessage" class="alert alert-danger py-2">{{ errorMessage }}</div>
						<div v-if="successMessage" class="alert alert-success py-2">{{ successMessage }}</div>
						<button type="submit" class="btn btn-mc-primary w-100">S'inscrire</button>
						<p class="mt-3 mb-0 text-center small">Déjà inscrit ? <a href="#" @click.prevent="() => { closeSignupModal(); openSigninModal(); }">Se connecter</a></p>
					</form>
				</div>
			</div>
		</div>

		<router-view />
	</div>
</template>