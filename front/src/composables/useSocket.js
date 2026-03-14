import { io } from "socket.io-client";
import { ref } from "vue";

let socket = null;
const messages = ref([]);
const users = ref([]);
const typingUsers = ref([]);
const isConnected = ref(false);
let typingTimeout = null;

export function useSocket() {
	const connect = (token) => {
		if (socket) {
			socket.disconnect();
		}

		socket = io(`${window.config.BACKEND_URL}/`, {
			auth: { token },
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: 5,
		});

		socket.on("connect", () => {
			isConnected.value = true;
			socket.emit("join", { token });
		});

		socket.on("disconnect", () => {
			isConnected.value = false;
		});

		socket.on("joined", (data) => {
			if (!data.success) {
				console.error("Erreur connexion:", data.error);
			}
		});

		socket.on("newMessage", (message) => {
			messages.value.push(message);
		});

		socket.on("usersList", (usersList) => {
			users.value = usersList;
		});

		socket.on("typingUsers", (typing) => {
			typingUsers.value = typing;
		});

		socket.on("error", (error) => {
			console.error("Erreur WebSocket:", error);
		});
	};

	const sendMessage = (content) => {
		if (socket && isConnected.value) {
			socket.emit("sendMessage", { content });
		} else {
			console.error("Socket non connecté");
		}
	};

	const loadInitialMessages = async () => {
		try {
			const response = await fetch(
				`${window.config.BACKEND_URL}/messages/general`,
			);
			if (!response.ok) throw new Error("Erreur de chargement");
			const data = await response.json();
			messages.value = data.messages || [];
		} catch (err) {
			console.error("Erreur:", err);
			messages.value = [];
		}
	};

	const emitTyping = () => {
		if (socket && isConnected.value) {
			socket.emit("typing");
		}
		clearTimeout(typingTimeout);
		typingTimeout = setTimeout(() => {
			if (socket && isConnected.value) {
				socket.emit("stopTyping");
			}
		}, 10000);
	};

	const disconnect = () => {
		if (socket) {
			socket.disconnect();
			isConnected.value = false;
		}
	};

	return {
		messages,
		users,
		typingUsers,
		isConnected,
		connect,
		sendMessage,
		emitTyping,
		loadInitialMessages,
		disconnect,
	};
}
