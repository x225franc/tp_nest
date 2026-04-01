<script setup>
	import { ref, inject } from "vue";
	import { useAuth } from "../composables/useAuth";
	import { useRouter } from "vue-router";

	const isModalOpen = ref(false);
	const { isLoggedIn } = useAuth();
	const router = useRouter();
	const openSigninModal = inject("openSigninModal");

	const openModal = () => {
		isModalOpen.value = true;
	};
	const closeModal = () => {
		isModalOpen.value = false;
	};
</script>

<template>
	<div class="mc-page d-flex align-items-center">
		<section class="container text-center text-white py-5">
			<h1 class="display-4 fw-bold mb-3">Un endroit…</h1>
			<p class="lead mx-auto" style="max-width: 540px;">…où tu peux discuter avec tes amis et créer tes propres salons.</p>
			<div class="d-flex justify-content-center gap-2 mt-4 flex-wrap">
				<button class="btn btn-light px-4"
					@click="() => {
						if (isLoggedIn) {
							router.push('/general');
						} else {
							openSigninModal();
						}
					}">
					Ouvrir MonChat
				</button>
				<button class="btn btn-dark px-4" @click="openModal">En savoir plus</button>
			</div>
		</section>

		<div v-if="isModalOpen" class="modal-overlay-custom" @click.self="closeModal">
			<div class="card mc-card w-100" style="max-width: 720px;">
				<div class="card-header d-flex justify-content-between align-items-center border-0">
					<h2 class="h5 mb-0">&nbsp;</h2>
					<button type="button" class="btn-close btn-close-white" aria-label="Close" @click="closeModal"></button>
				</div>
				<div class="card-body">
					<p>MonChat est composé des fonctionnalités suivantes :</p>
					<ul class="mb-0 ps-3">
						<u>v1</u>
						<li>Inscription et connexion.</li>
						<li>
							Accès à un chat général pour discuter avec les utilisateurs
							connectés.
						</li>
						<li>
							Gestion du profil : couleur personnalisée visible par les autres
							et modification du username.
						</li>
						<li>
							Indicateur “est en train d’écrire”, y compris pour plusieurs
							personnes.
						</li>
						<li>
							Création de salons avec ajout/suppression d’utilisateurs et gestion de
							l’accès à l’historique.
						</li>
						<li>
							Chargement de l’historique des discussions au démarrage du chat.
						</li>
						<br>
						<u>v2</u>
						<li>
							Inscription avec validation par email.
						</li>
						<li>
							Authentification 2 facteur.
						</li>
						<li>
							Réinitialisation du mot de passe.
						</li>
						<li>
							Gestion d'endpoint public et privé avec guards dans le frontend et token jwt dans le backend.
						</li>
						<li>
							Mise en place des Dto (incluse dans swagger).
						</li>
						<li>
							Swagger sur <a href="http://localhost:1000/api" target="_blank">/api</a>.
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>
