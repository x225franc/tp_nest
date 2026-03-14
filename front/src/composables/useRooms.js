import { ref } from "vue";

const publicRooms = ref([]);
const userRooms = ref([]);
const currentRoom = ref(null);
const roomMembers = ref([]);
const nonMembers = ref([]);
const loading = ref(false);
const error = ref(null);

export function useRooms() {
	const getToken = () => {
		const user = localStorage.getItem("currentUser");
		if (!user) return null;
		return JSON.parse(user).token;
	};

	const getAuthHeaders = () => {
		const token = getToken();
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		};
	};

	const createRoom = async (name, isPrivate = false) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(`${window.config.BACKEND_URL}/rooms`, {
				method: "POST",
				headers: getAuthHeaders(),
				body: JSON.stringify({ name, isPrivate }),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					err.message || "Erreur lors de la création de la salle",
				);
			}

			const room = await response.json();
			userRooms.value.push(room);
			return { success: true, room };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	const loadPublicRooms = async () => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(`${window.config.BACKEND_URL}/rooms/public`);

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération des salles publiques");
			}

			publicRooms.value = await response.json();
			return publicRooms.value;
		} catch (err) {
			error.value = err.message;
			return [];
		} finally {
			loading.value = false;
		}
	};

	const loadUserRooms = async () => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/my-rooms`,
				{
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération de vos salles");
			}

			userRooms.value = await response.json();
			return userRooms.value;
		} catch (err) {
			error.value = err.message;
			return [];
		} finally {
			loading.value = false;
		}
	};

	const loadRoom = async (roomId) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}`,
			);

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération de la salle");
			}

			currentRoom.value = await response.json();
			return currentRoom.value;
		} catch (err) {
			error.value = err.message;
			return null;
		} finally {
			loading.value = false;
		}
	};

	const loadRoomMembers = async (roomId) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members`,
			);

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération des membres");
			}

			roomMembers.value = await response.json();
			return roomMembers.value;
		} catch (err) {
			error.value = err.message;
			return [];
		} finally {
			loading.value = false;
		}
	};

	const loadNonMembers = async (roomId) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/non-members`,
			);

			if (!response.ok) {
				throw new Error("Erreur lors de la récupération des utilisateurs");
			}

			nonMembers.value = await response.json();
			return nonMembers.value;
		} catch (err) {
			error.value = err.message;
			return [];
		} finally {
			loading.value = false;
		}
	};

	const addUserToRoom = async (roomId, userId, canSeeOldMessages = false) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members`,
				{
					method: "POST",
					headers: getAuthHeaders(),
					body: JSON.stringify({ userId, canSeeOldMessages }),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					err.message || "Erreur lors de l'ajout de l'utilisateur",
				);
			}

			await Promise.all([loadRoomMembers(roomId), loadNonMembers(roomId)]);

			return { success: true };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	const removeUserFromRoom = async (roomId, userId) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members/${userId}`,
				{
					method: "DELETE",
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					err.message || "Erreur lors de la suppression de l'utilisateur",
				);
			}

			await Promise.all([loadRoomMembers(roomId), loadNonMembers(roomId)]);

			return { success: true };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	const updateCanSeeOldMessages = async (roomId, userId, canSee) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members/${userId}/can-see-old`,
				{
					method: "PUT",
					headers: getAuthHeaders(),
					body: JSON.stringify({ canSeeOldMessages: canSee }),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur lors de la mise à jour");
			}

			await loadRoomMembers(roomId);

			return { success: true };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	const updateRoom = async (roomId, updates) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}`,
				{
					method: "PUT",
					headers: getAuthHeaders(),
					body: JSON.stringify(updates),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur lors de la mise à jour");
			}

			const room = await response.json();
			currentRoom.value = room;

			const index = userRooms.value.findIndex((r) => r.id === roomId);
			if (index !== -1) {
				userRooms.value[index] = room;
			}

			return { success: true, room };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	const deleteRoom = async (roomId) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}`,
				{
					method: "DELETE",
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur lors de la suppression");
			}

			userRooms.value = userRooms.value.filter((r) => r.id !== roomId);
			if (currentRoom.value?.id === roomId) {
				currentRoom.value = null;
			}

			return { success: true };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	const joinPublicRoom = async (roomId) => {
		try {
			loading.value = true;
			error.value = null;

			const user = JSON.parse(localStorage.getItem("currentUser"));
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members`,
				{
					method: "POST",
					headers: getAuthHeaders(),
					body: JSON.stringify({ userId: user.id, canSeeOldMessages: false }),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur lors de l'adhésion à la salle");
			}

			await loadUserRooms();

			return { success: true };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	const leaveRoom = async (roomId) => {
		try {
			loading.value = true;
			error.value = null;

			const user = JSON.parse(localStorage.getItem("currentUser"));
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members/${user.id}`,
				{
					method: "DELETE",
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur lors de la sortie de la salle");
			}

			await loadUserRooms();
			if (currentRoom.value?.id === roomId) {
				currentRoom.value = null;
			}

			return { success: true };
		} catch (err) {
			error.value = err.message;
			return { success: false, error: err.message };
		} finally {
			loading.value = false;
		}
	};

	return {
		publicRooms,
		userRooms,
		currentRoom,
		roomMembers,
		nonMembers,
		loading,
		error,
		createRoom,
		loadPublicRooms,
		loadUserRooms,
		loadRoom,
		loadRoomMembers,
		loadNonMembers,
		addUserToRoom,
		removeUserFromRoom,
		updateCanSeeOldMessages,
		updateRoom,
		deleteRoom,
		joinPublicRoom,
		leaveRoom,
	};
}
