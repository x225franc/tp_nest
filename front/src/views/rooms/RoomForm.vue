<script setup>
	import { ref } from 'vue';
	import { useRoomsApi } from '../../composables/useRoomsApi';
	import { loading, error } from '../../composables/useRoomsState';

	const { createRoom } = useRoomsApi();

	const isCreateModalOpen = ref(false);
	const newRoomName = ref('');
	const newRoomIsPrivate = ref(false);

	const openCreateModal = () => { isCreateModalOpen.value = true; };
	const closeCreateModal = () => { isCreateModalOpen.value = false; newRoomName.value = ''; newRoomIsPrivate.value = false; };

	const handleCreate = async () => {
		if (!newRoomName.value.trim()) return;
		const result = await createRoom(newRoomName.value, newRoomIsPrivate.value);
		if (result.success) {
			closeCreateModal();
		}
	};
</script>

<template>
	<div class="d-flex justify-content-end">
		<button type="button" class="btn btn-mc-primary" @click="openCreateModal">
			Créer une nouvelle salle
		</button>
	</div>

	<div v-if="isCreateModalOpen" class="modal-overlay-custom" @click.self="closeCreateModal">
		<div class="card mc-card w-100" style="max-width: 420px;">
			<div class="card-header d-flex justify-content-between align-items-center border-0">
				<h3 class="h5 mb-0">Créer une Nouvelle Salle</h3>
				<button type="button" class="btn-close btn-close-white" aria-label="Close" @click="closeCreateModal"></button>
			</div>
			<div class="card-body">
				<form @submit.prevent="handleCreate" class="d-grid gap-3">
					<input v-model="newRoomName" type="text" placeholder="Nom de la salle" class="form-control mc-input" required />
					<div class="form-check">
						<input v-model="newRoomIsPrivate" type="checkbox" class="form-check-input" id="new-room-private" />
						<label class="form-check-label" for="new-room-private">Salle privée</label>
					</div>
					<button type="submit" class="btn btn-mc-primary" :disabled="loading">
						{{ loading ? 'Création...' : 'Créer' }}
					</button>
					<div v-if="error" class="alert alert-danger py-2 mb-0">{{ error }}</div>
				</form>
			</div>
		</div>
	</div>
</template>
