import { io } from "socket.io-client";
import { ref } from "vue";

let roomSocket = null;
const roomMessages = ref([]);
const roomUsers = ref([]);
const roomTypingUsers = ref([]);
const isRoomConnected = ref(false);
let typingTimeout = null;

export function useRoomSocket() {
	const connectToRooms = (token) => {
		if (roomSocket) {
			roomSocket.disconnect();
		}

		roomSocket = io(`${window.config.BACKEND_URL}/rooms`, {
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: 5,
		});

		roomSocket.on("connect", () => {
			isRoomConnected.value = true;
			roomSocket.emit("joinRooms", { token });
		});

		roomSocket.on("disconnect", () => {
			isRoomConnected.value = false;
		});

		roomSocket.on("joinedRooms", (data) => {
			if (!data.success) {
				console.error("Erreur lors de la connexion aux rooms:", data.error);
			}
		});

		roomSocket.on("error", (error) => {
			console.error("Erreur WebSocket Room:", error);
		});

		roomSocket.on("newRoomMessage", (data) => {
			roomMessages.value.push(data.message);
		});

		roomSocket.on("roomTypingUsers", (data) => {
			roomTypingUsers.value = data.typers;
		});
	};

	const joinRoom = (roomId, token) => {
		if (roomSocket && isRoomConnected.value) {
			roomSocket.emit("joinRoom", { roomId, token });
		}
	};

	const leaveRoom = (roomId) => {
		if (roomSocket && isRoomConnected.value) {
			roomSocket.emit("leaveRoom", { roomId });
		}
	};

	const sendRoomMessage = (roomId, content, token) => {
		if (roomSocket && isRoomConnected.value) {
			roomSocket.emit("sendRoomMessage", { roomId, content, token });
		} else {
			console.error("Socket non connecté");
		}
	};

	const loadRoomMessages = async (roomId, token) => {
		try {
			const response = await fetch(
				`${window.config.BACKEND_URL}/messages/room/${roomId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			if (!response.ok)
				throw new Error("Erreur lors du chargement des messages");
			const data = await response.json();
			roomMessages.value = data.messages || [];
		} catch (err) {
			console.error("Erreur:", err);
			roomMessages.value = [];
		}
	};

	const emitRoomTyping = (roomId, token) => {
		if (roomSocket && isRoomConnected.value) {
			roomSocket.emit("typingRoom", { roomId, token });
		}
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			if (roomSocket && isRoomConnected.value) {
				roomSocket.emit("stopTypingRoom", { roomId, token });
			}
		}, 3000);
	};

	const disconnectRooms = () => {
		if (roomSocket) {
			roomSocket.disconnect();
			isRoomConnected.value = false;
		}
	};

	const clearRoomMessages = () => {
		roomMessages.value = [];
		roomUsers.value = [];
		roomTypingUsers.value = [];
	};

	return {
		roomMessages,
		roomUsers,
		roomTypingUsers,
		isRoomConnected,
		connectToRooms,
		joinRoom,
		leaveRoom,
		sendRoomMessage,
		loadRoomMessages,
		emitRoomTyping,
		disconnectRooms,
		clearRoomMessages,
	};
}
