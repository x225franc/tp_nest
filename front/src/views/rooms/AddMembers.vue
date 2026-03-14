<script setup>
	import { ref } from "vue";
	import { useRoomMembers } from "../../composables/useRoomMembers";
	import { nonMembers, loading } from "../../composables/useRoomsState";

	const props = defineProps({
		roomId: Number,
	});

	const { loadNonMembers, addUserToRoom } = useRoomMembers();
	const newMemberPermissions = ref({});
	const hasLoadedNonMembers = ref(false);

	const handleLoadNonMembers = async () => {
		await loadNonMembers(props.roomId);
		hasLoadedNonMembers.value = true;
	};

	const handleAddUser = async (userId) => {
		await addUserToRoom(
			props.roomId,
			userId,
			newMemberPermissions.value[userId] || false,
		);
		newMemberPermissions.value[userId] = false;
	};
</script>

<template>
	<div class="mb-3">
		<h3 class="h5 mb-3">Ajouter des Membres</h3>
		<button
			@click="handleLoadNonMembers"
			class="btn btn-secondary btn-sm"
			:disabled="loading"
		>
			{{ loading ? "Chargement..." : "Charger les utilisateurs disponibles" }}
		</button>

		<div v-if="!hasLoadedNonMembers" class="text-center mc-text-muted py-3">
			Aucun utilisateur chargé
		</div>

		<div
			v-else-if="nonMembers.length === 0"
			class="text-center mc-text-muted py-3"
		>
			Tous les utilisateurs sont déjà membres
		</div>

		<div v-else class="d-grid gap-2 mt-3">
			<div v-for="user in nonMembers" :key="user.id" class="card mc-card">
				<div
					class="card-body py-2 px-3 d-flex flex-column align-items-start gap-2 flex-wrap"
				>
					<span class="fw-semibold" :style="{ color: user.customColor }">{{
						user.username
					}}</span>
					<div class="d-flex flex-column align-items-start">
						<div class="form-check">
							<input
								:checked="newMemberPermissions[user.id]"
								type="checkbox"
								class="form-check-input mt-2"
								:id="`non-member-old-${user.id}`"
								@change="newMemberPermissions[user.id] = $event.target.checked"
							/>
							<label
								class="form-check-label"
								:for="`non-member-old-${user.id}`"
							>
								Voir anciens messages ? &nbsp;
							</label>
							<button
								@click="handleAddUser(user.id)"
								class="btn btn-mc-primary btn-sm"
								:disabled="loading"
							>
								Ajouter
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
