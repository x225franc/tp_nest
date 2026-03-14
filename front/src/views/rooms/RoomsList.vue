<script setup>
	import { useRoomsApi } from '../../composables/useRoomsApi';
	import { userRooms, publicRooms, loading } from '../../composables/useRoomsState';

	const { loadPublicRooms, joinPublicRoom, loadUserRooms } = useRoomsApi();

	const emit = defineEmits(['select-room']);

	const handleSelectRoom = (room) => { emit('select-room', room); };

	const handleJoinRoom = async (roomId) => {
		const result = await joinPublicRoom(roomId);
		if (result.success) {
			await loadUserRooms();
		}
	};

	const isUserInRoom = (roomId) => {
		return userRooms.value.some((r) => r.id === roomId);
	};

	const handleLoadPublic = async () => {
		await loadPublicRooms();
	};
</script>

<template>

    <div class="col-12 col-xl-6">
			<div class="card mc-card h-100">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
						<h3 class="h5 mb-0">Salles Publiques ({{ publicRooms.length }})</h3>
						<button @click="handleLoadPublic" class="btn btn-secondary btn-sm" :disabled="loading">
							{{ loading ? 'Chargement...' : 'Charger les salles publiques' }}
						</button>
					</div>
					<div v-if="publicRooms.length === 0" class="text-center mc-text-muted py-4">Aucune salle publique disponible</div>
					<div v-else class="row g-2">
						<div v-for="room in publicRooms" :key="room.id" class="col-12 col-md-6">
							<div class="card mc-card-soft h-100">
								<div class="card-body py-2 px-3">
									<div class="d-flex align-items-center gap-2 mb-1">
										<h4 class="h6 mb-0 flex-grow-1">{{ room.name }}</h4>
										<span class="badge text-bg-secondary">Publique</span>
									</div>
									<p class="small mb-1">{{ room.memberCount }} membre(s)</p>
									<small class="mc-text-muted d-block mb-2">Propriétaire: {{ room.ownerName }}</small>
									<button v-if="!isUserInRoom(room.id)" @click.stop="handleJoinRoom(room.id)" class="btn btn-mc-primary btn-sm w-100" :disabled="loading">
										Rejoindre
									</button>
									<span v-else class="badge badge-mc">Membre</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
        
	<div class="row g-3">
		<div class="col-12 col-xl-6">
			<div class="card mc-card h-100">
				<div class="card-body">
					<h3 class="h5 mb-3">Mes Salles ({{ userRooms.length }})</h3>
					<div v-if="userRooms.length === 0" class="text-center mc-text-muted py-4">Vous n'êtes membre d'aucune salle</div>
					<div v-else class="row g-2">
						<div v-for="room in userRooms" :key="room.id" class="col-12 col-md-6">
							<div class="card mc-card-soft h-100 cursor-pointer" @click="handleSelectRoom(room)">
								<div class="card-body py-2 px-3">
									<div class="d-flex align-items-center gap-2 mb-1">
										<h4 class="h6 mb-0 flex-grow-1">{{ room.name }}</h4>
										<span v-if="room.isPrivate" class="badge badge-mc">Privée</span>
										<span v-else class="badge text-bg-secondary">Publique</span>
									</div>
									<p class="small mb-1">{{ room.memberCount }} membre(s)</p>
									<small class="mc-text-muted">Propriétaire: {{ room.ownerName }}</small>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		
	</div>
</template>
