<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
defineProps({isLoggedIn: Boolean,currentUser: Object,});
defineEmits(['logout', 'signin', 'signup']);
const goToSettings = () => {router.push('/settings');};
const goToRooms = () => {router.push('/rooms');};
const goToGeneral = () => {router.push('/general');};

</script>

<template>
	<nav class="navbar navbar-expand-lg px-3 px-md-4" style="background:#410867;">
		<div class="container-fluid p-0">
			<span class="navbar-brand text-white fw-bold" @click="router.push('/general')" style="cursor: pointer">
				MonChat
			</span>
			<div class="d-flex gap-2 align-items-center flex-wrap justify-content-end">
			<template v-if="isLoggedIn">
				<span class="text-white-50 small">Connecté en tant que <strong class="text-white">{{ currentUser.username }}</strong></span>
				<button class="btn btn-outline-light btn-sm" @click="goToGeneral">Général</button>
				<button class="btn btn-outline-light btn-sm" @click="goToRooms">Salles</button>
				<button class="btn btn-outline-light btn-sm" @click="goToSettings">Paramètres</button>
				<button class="btn btn-outline-danger btn-sm" @click="$emit('logout')">Déconnexion</button>
			</template>
			<template v-else>
				<button class="btn btn-light btn-sm" @click="$emit('signin')">Connexion</button>
				<button class="btn btn-outline-light btn-sm" @click="$emit('signup')">Inscription</button>
			</template>
			</div>
		</div>
	</nav>
</template>
