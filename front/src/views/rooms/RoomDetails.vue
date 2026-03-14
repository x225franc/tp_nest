<script setup>
	import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
	import { useRoomsApi } from "../../composables/useRoomsApi";
	import { useRoomMembers } from "../../composables/useRoomMembers";
	import { useRoomSocket } from "../../composables/useRoomSocket";
	import { currentRoom, loading, error, nonMembers, } from "../../composables/useRoomsState";
	import MembersList from "./MembersList.vue";
	import AddMembers from "./AddMembers.vue";

	const { updateRoom, deleteRoom, leaveRoom } = useRoomsApi();
	const { loadRoomMembers, silentPollRoomMembers, silentPollNonMembers, silentPollRoom, } = useRoomMembers();
	const { roomMessages, roomTypingUsers, connectToRooms, joinRoom, leaveRoom: leaveRoomSocket, sendRoomMessage, loadRoomMessages, emitRoomTyping, disconnectRooms, clearRoomMessages, } = useRoomSocket();

	const showSaveHint = ref(false);
	let membersPollingInterval = null;

	const emit = defineEmits(["room-deleted", "room-left", "back-to-list"]);

	const showEditForm = ref(false);
	const editName = ref("");
	const editIsPrivate = ref(false);
	const messageInput = ref("");
	const messagesContainer = ref(null);

	const currentUser = computed(() => {
		const user = localStorage.getItem("currentUser");
		return user ? JSON.parse(user) : null;
	});

	const isOwner = computed(() => {
		return (
			currentUser.value &&
			currentRoom.value &&
			currentRoom.value.ownerId === currentUser.value.id
		);
	});

	onMounted(() => {
		if (currentUser.value?.token) {
			connectToRooms(currentUser.value.token);
		}
	});

	onUnmounted(() => {
		if (currentRoom.value?.id) {
			leaveRoomSocket(currentRoom.value.id);
		}
		disconnectRooms();

		if (membersPollingInterval) {
			clearInterval(membersPollingInterval);
		}
	});

	watch(
		() => currentRoom.value?.id,
		async (newRoomId, oldRoomId) => {
			if (oldRoomId) {
				leaveRoomSocket(oldRoomId);
				if (membersPollingInterval) {
					clearInterval(membersPollingInterval);
					membersPollingInterval = null;
				}
			}
			if (newRoomId) {
				clearRoomMessages();
				nonMembers.value = [];
				loadRoomMembers(newRoomId);
				editName.value = currentRoom.value.name;
				editIsPrivate.value = currentRoom.value.isPrivate;
				showEditForm.value = false;

				if (currentUser.value?.token) {
					await loadRoomMessages(newRoomId, currentUser.value.token);
					joinRoom(newRoomId, currentUser.value.token);
					nextTick(() => scrollToBottom());
				}

				if (membersPollingInterval) {
					clearInterval(membersPollingInterval);
				}
				membersPollingInterval = setInterval(async () => {
					const memberResult = await silentPollRoomMembers(newRoomId);
					const roomResult = await silentPollRoom(newRoomId);

					if (
						memberResult.status === "user-removed" ||
						roomResult.status === "not-found"
					) {
						clearInterval(membersPollingInterval);
						clearRoomMessages();
						currentRoom.value = null;
						emit("room-left");
						return;
					}
					silentPollNonMembers(newRoomId);
				}, 1000);
			}
		},
		{ immediate: true },
	);

	watch(roomMessages, () => {
		nextTick(() => {
			scrollToBottom();
		});
	});

	const handleUpdateRoom = async () => {
		const result = await updateRoom(currentRoom.value.id, {
			name: editName.value,
			isPrivate: editIsPrivate.value,
		});
		if (result.success) {
			showEditForm.value = false;
			setTimeout(() => {
				showSaveHint.value = false;
			}, 100);
		}
	};

	const handleDeleteRoom = async () => {
		if (confirm("Supprimer cette salle ?")) {
			const result = await deleteRoom(currentRoom.value.id);
			if (result.success) {
				emit("room-deleted");
			}
		}
	};

	const handleLeaveRoom = async () => {
		if (confirm("Quitter cette salle ?")) {
			const result = await leaveRoom(currentRoom.value.id);
			if (result.success) {
				emit("room-left");
			}
		}
	};

	const handleSendMessage = () => {
		if (
			messageInput.value.trim() &&
			currentRoom.value?.id &&
			currentUser.value?.token
		) {
			sendRoomMessage(
				currentRoom.value.id,
				messageInput.value,
				currentUser.value.token,
			);
			messageInput.value = "";
		}
	};

	const handleInputTyping = () => {
		if (currentRoom.value?.id && currentUser.value?.token) {
			emitRoomTyping(currentRoom.value.id, currentUser.value.token);
		}
	};

	const getTypingText = () => {
		const othersTyping = roomTypingUsers.value.filter(
			(u) => u.username !== currentUser.value?.username,
		);

		if (othersTyping.length === 0) return "";

		const names = othersTyping.map((u) => u.username);
		if (names.length === 1) return `${names[0]} est en train d'écrire...`;
		if (names.length === 2)
			return `${names.join(", ")} sont en train d'écrire...`;
		return `plusieurs personnes sont en train d'écrire...`;
	};

	const scrollToBottom = () => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
		}
	};

	const formatTime = (date) => {
		const d = new Date(date);
		return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
	};

	const handleBackToList = () => {
		emit("back-to-list");
	};
</script>

<template>
	<div v-if="currentRoom">
		<div class="card mc-card mb-3">
			<div class="card-body">
				<div
					class="d-flex justify-content-between align-items-center flex-wrap gap-2"
				>
					<div class="d-flex align-items-center gap-2 flex-wrap">
						<button
							@click="handleBackToList"
							class="btn btn-outline-light btn-sm"
						>
							Retour
						</button>
						<h2 class="h4 mb-0">{{ currentRoom.name }}</h2>
					</div>
					<div class="d-flex gap-2 align-items-center flex-wrap">
						<span v-if="currentRoom.isPrivate" class="badge badge-mc"
							>Privée</span
						>
						<span v-else class="badge text-bg-secondary">Publique</span>
						<button
							v-if="isOwner"
							@click="showEditForm = !showEditForm"
							class="btn btn-secondary btn-sm"
						>
							{{ showEditForm ? "Annuler" : "Modifier" }}
						</button>
						<button
							v-if="isOwner"
							@click="handleDeleteRoom"
							class="btn btn-danger btn-sm"
							:disabled="loading"
						>
							Supprimer
						</button>
						<button
							v-if="!isOwner"
							@click="handleLeaveRoom"
							class="btn btn-danger btn-sm"
							:disabled="loading"
						>
							Quitter
						</button>
					</div>
				</div>

				<div
					v-if="showEditForm && isOwner"
					class="mt-3 pt-3 border-top border-secondary-subtle"
				>
					<h3 class="h6 mb-3">Modifier la Salle</h3>
					<input
						v-model="editName"
						type="text"
						class="form-control mc-input mb-2"
						placeholder="Nom"
					/>
					<div class="mb-3">
						<button
							v-if="currentRoom.isPrivate"
							@click="
								editIsPrivate = false;
								showSaveHint = true;
							"
							class="btn btn-light"
							id="edit-private"
						>
							Rendre la salle publique ?
						</button>
						<button
							v-else
							@click="
								editIsPrivate = true;
								showSaveHint = true;
							"
							class="btn btn-info"
							id="edit-private"
						>
							Rendre la salle privée ?
						</button>
						<span v-if="showSaveHint" class="text-warning d-block mt-2"
							>N'oubliez pas de sauvegarder</span
						>
					</div>
					<button
						@click="handleUpdateRoom"
						class="btn btn-mc-primary"
						:disabled="loading"
					>
						{{ loading ? "Mise à jour..." : "Sauvegarder" }}
					</button>
					<div v-if="error" class="alert alert-danger py-2 mt-2 mb-0">
						{{ error }}
					</div>
				</div>
			</div>
		</div>

		<div class="row g-3">
			<div class="col-12 col-lg-4">
				<div class="card mc-card h-100">
					<div class="card-body">
						<MembersList :room="currentRoom" :isOwner="isOwner" />
						<AddMembers v-if="isOwner" :roomId="currentRoom.id" />
					</div>
				</div>
			</div>

			<div class="col-12 col-lg-8">
				<div
					class="card mc-card"
					style="height: calc(100vh - 300px); min-height: 500px"
				>
					<div
						class="card-header fw-bold border-bottom border-secondary-subtle"
						style="background: #410867"
					>
						Chat
					</div>
					<div
						ref="messagesContainer"
						class="card-body overflow-auto flex-grow-1"
					>
						<div
							v-if="roomMessages.length === 0"
							class="text-center mc-text-muted py-5"
						>
							Aucun message pour l'instant
						</div>
						<div v-else>
							<div v-for="msg in roomMessages" :key="msg.id" class="mb-3">
								<div class="d-flex gap-2 small mb-1">
									<strong :style="{ color: msg.customColor }">{{
										msg.username
									}}</strong>
									<span class="mc-text-muted">{{
										formatTime(msg.createdAt)
									}}</span>
								</div>
								<div class="text-light">{{ msg.content }}</div>
							</div>
						</div>
					</div>

					<div class="card-footer border-top border-secondary-subtle">
						<div
							class="small fst-italic mc-text-muted mb-2"
							style="min-height: 1rem"
						>
							{{ getTypingText() }}
						</div>
						<div class="input-group">
							<input
								v-model="messageInput"
								@keyup.enter="handleSendMessage"
								@input="handleInputTyping"
								type="text"
								placeholder="Envoie un message..."
								class="form-control mc-input"
							/>
							<button @click="handleSendMessage" class="btn btn-mc-primary">
								Envoyer
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div v-if="error" class="alert alert-danger py-2 mt-3 mb-0">
			{{ error }}
		</div>
	</div>
</template>
