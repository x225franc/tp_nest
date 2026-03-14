import {
	publicRooms,
	userRooms,
	currentRoom,
	loading,
	error,
} from "./useRoomsState";

const getAuthHeaders = () => {
	const user = localStorage.getItem("currentUser");
	if (!user) {
		throw new Error("Vous devez être connecté");
	}
	const token = JSON.parse(user).token;
	if (!token) {
		throw new Error("Token invalide");
	}
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};
};

const delayedFetch = async (...args) => {
	const responsePromise = fetch(...args);
	await new Promise((resolve) => setTimeout(resolve, 200));
	return responsePromise;
};

export function useRoomsApi() {
	const createRoom = async (name, isPrivate = false) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms`,
				{
					method: "POST",
					headers: getAuthHeaders(),
					body: JSON.stringify({ name, isPrivate }),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					err.message || "Erreur création salle",
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
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/public`,
			);

			if (!response.ok) {
				throw new Error("Erreur récupération salles publiques");
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
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/my-rooms`,
				{
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				throw new Error("Erreur récupération de vos salles");
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
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}`,
			);

			if (!response.ok) {
				throw new Error("Erreur récupération salle");
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

	const updateRoom = async (roomId, updates) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}`,
				{
					method: "PUT",
					headers: getAuthHeaders(),
					body: JSON.stringify(updates),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur maj salle");
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
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}`,
				{
					method: "DELETE",
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur suppression salle");
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
			const userId = parseInt(user.id, 10);
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members`,
				{
					method: "POST",
					headers: getAuthHeaders(),
					body: JSON.stringify({ userId, canSeeOldMessages: false }),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur d'adhésion salle");
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
			const userId = parseInt(user.id, 10);
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members/${userId}`,
				{
					method: "DELETE",
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur sortie salle");
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

	const silentPollPublicRooms = async () => {
		try {
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/public`,
			);

			if (!response.ok) {
				return null;
			}

			const rooms = await response.json();
			publicRooms.value = rooms;
			return rooms;
		} catch (err) {
			console.error(err);
			return null;
		}
	};

	const silentPollUserRooms = async () => {
		try {
			const user = localStorage.getItem("currentUser");
			if (!user) return null;

			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/my-rooms`,
				{
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				return null;
			}

			const rooms = await response.json();
			userRooms.value = rooms;
			return rooms;
		} catch (err) {
			console.error(err);
			return null;
		}
	};

	return {
		createRoom,
		loadPublicRooms,
		loadUserRooms,
		loadRoom,
		updateRoom,
		deleteRoom,
		joinPublicRoom,
		leaveRoom,
		silentPollPublicRooms,
		silentPollUserRooms,
	};
}
