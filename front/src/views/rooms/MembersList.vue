<script setup>
	import { useRoomMembers } from "../../composables/useRoomMembers";
	import { roomMembers, loading } from "../../composables/useRoomsState";

	const props = defineProps({
		room: Object,
		isOwner: Boolean,
	});

	const { updateCanSeeOldMessages, removeUserFromRoom } = useRoomMembers();
	const handleUpdatePermission = async (userId, canSee) => { await updateCanSeeOldMessages(props.room.id, userId, canSee); };

	const handleRemoveUser = async (userId) => {
		if (confirm("Retirer cet utilisateur ?")) {
			await removeUserFromRoom(props.room.id, userId);
		}
	};
</script>

<template>
	<div class="mb-3">
		<h3 class="h5 mb-3">Membres ({{ roomMembers.length }})</h3>
		<div v-if="roomMembers.length === 0" class="text-center mc-text-muted py-3">
			Aucun membre
		</div>
		<div v-else class="d-grid gap-2">
			<div v-for="member in roomMembers" :key="member.id" class="card mc-card">
				<div
					class="card-body py-2 px-3 d-flex flex-column align-items-start gap-2 flex-wrap"
				>
					<div class="d-flex align-items-center gap-2">
						<span class="fw-semibold" :style="{ color: member.customColor }">{{
							member.username
						}}</span>
						<span v-if="member.id === room.ownerId" class="badge badge-mc"
							>Propriétaire</span
						>
					</div>
					<div v-if="isOwner && member.id !== room.ownerId" class="d-flex flex-column align-items-start" >
						<div class="form-check">
							<input
								:checked="member.canSeeOldMessages"
								type="checkbox"
								:disabled="loading"
								class="form-check-input mt-2"
								:id="`member-old-${member.id}`"
								@change="
									handleUpdatePermission(member.id, $event.target.checked)
								"
							/>
							<label class="form-check-label" :for="`member-old-${member.id}`">
								Voir anciens messages ? &nbsp;
							</label>
							<button
								v-if="member.id !== room.ownerId"
								@click="handleRemoveUser(member.id)"
								class="btn btn-danger btn-sm"
								:disabled="loading"
							>
								Retirer
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
