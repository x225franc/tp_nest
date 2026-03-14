import { ref } from "vue";

export function useMessages() {
	const messages = ref([]);
	const users = ref([]);
	const isLoading = ref(false);

	const loadGeneralChat = async () => {
		try {
			isLoading.value = true;
			const response = await fetch(
				`${window.config.BACKEND_URL}/messages/general`,
			);
			if (!response.ok) throw new Error("Erreur chargement chat");
			const data = await response.json();
			messages.value = data.messages || [];
		} catch (err) {
			console.error("Erreur:", err);
			messages.value = [];
		} finally {
			isLoading.value = false;
		}
	};

	const loadUsers = async () => {
		try {
			const response = await fetch(
				`${window.config.BACKEND_URL}/messages/users`,
			);
			if (!response.ok)
				throw new Error("Erreur chargement utilisateurs");
			users.value = await response.json();
		} catch (err) {
			console.error("Erreur:", err);
			users.value = [];
		}
	};

	const sendMessage = async (content, token) => {
		try {
			if (!content.trim()) return { success: false, error: "Message vide" };

			const response = await fetch(
				`${window.config.BACKEND_URL}/messages/send`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ content: content.trim() }),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Erreur d'envoi");
			}

			const message = await response.json();
			messages.value.push(message);
			return { success: true };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	return {
		messages,
		users,
		isLoading,
		loadGeneralChat,
		loadUsers,
		sendMessage,
	};
}
