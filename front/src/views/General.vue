<script setup>
	import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
	import { useSocket } from '../composables/useSocket';
	import { useAuth } from '../composables/useAuth';

	const { messages, users, typingUsers, connect, sendMessage, emitTyping, loadInitialMessages, disconnect, } = useSocket();
	const { currentUser } = useAuth();

	const messageInput = ref('');
	const error = ref('');
	const messagesContainer = ref(null);

	onMounted(async () => {
		if (currentUser.value?.token) {
			await loadInitialMessages();
			connect(currentUser.value.token);
			scrollToBottom();
		}
	});

	onUnmounted(() => {
		disconnect();
	});

	watch(messages, () => {
		nextTick(() => {
			scrollToBottom();
		});
	});

	const handleInputTyping = () => {
		emitTyping();
	};

	const handleSendMessage = () => {
		error.value = '';
		if (messageInput.value.trim()) {
			sendMessage(messageInput.value);
			messageInput.value = '';
		}
	};

	const getTypingText = () => {
		const othersTyping = typingUsers.value.filter(
			(u) => u.username !== currentUser.value?.username,
		);

		if (othersTyping.length === 0) return '';

		const names = othersTyping.map((u) => u.username);
		if (names.length === 1) return `${names[0]} est en train d'écrire...`;
		if (names.length === 2) return `${names.join(', ')} sont en train d'écrire...`;
		return `plusieurs personnes sont en train d'écrire...`;
	};

	const scrollToBottom = () => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
		}
	};

	const formatTime = (date) => {
		const d = new Date(date);
		return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
	};
</script>

<template>
	<div class="mc-page py-0">
		<div class="container-fluid h-100 py-3">
			<div class="row g-3" style="min-height: calc(100vh - 110px);">
				<div class="col-12 col-lg-3">
					<div class="card mc-card h-100">
						<div class="card-header border-bottom border-secondary-subtle">Utilisateurs en ligne</div>
						<div class="card-body p-2 overflow-auto">
							<div v-for="user in users" :key="user.id" class="d-flex align-items-center gap-2 p-2 rounded hover-bg">
								<span class="rounded-circle bg-success" style="width: 10px; height: 10px;"></span>
								<span :style="{ color: user.customColor }">{{ user.username }}</span>
							</div>
						</div>
					</div>
				</div>

				<div class="col-12 col-lg-9">
					<div class="card mc-card h-100">
						<div class="card-header fw-bold" style="background: #410867;">Général</div>
						<div ref="messagesContainer" class="card-body overflow-auto" style="max-height: calc(100vh - 280px);">
							<div v-if="messages.length === 0" class="text-center mc-text-muted py-5">
								Aucun message pour l'instant
							</div>
							<div v-else>
								<div v-for="msg in messages" :key="msg.id" class="mb-3">
									<div class="d-flex gap-2 small mb-1">
										<strong :style="{ color: msg.customColor }">{{ msg.username }}</strong>
										<span class="mc-text-muted">{{ formatTime(msg.createdAt) }}</span>
									</div>
									<div class="text-light">{{ msg.content }}</div>
								</div>
							</div>
						</div>

						<div class="card-footer border-top border-secondary-subtle">
							<div v-if="error" class="alert alert-danger py-2 mb-2">{{ error }}</div>
							<div class="small fst-italic mc-text-muted mb-2" style="min-height: 1rem;">
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
								<button @click="handleSendMessage" class="btn btn-mc-primary">Envoyer</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
