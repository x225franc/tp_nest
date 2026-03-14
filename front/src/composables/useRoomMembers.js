import { roomMembers, nonMembers, currentRoom, loading, error } from "./useRoomsState";

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

export function useRoomMembers() {
	const loadRoomMembers = async (roomId) => {
		try {
			loading.value = true;
			error.value = null;
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members`,
			);

			if (!response.ok) {
				throw new Error("Erreur récupération membres");
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
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/non-members`,
			);

			if (!response.ok) {
				throw new Error("Erreur récupération utilisateurs");
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
			const response = await delayedFetch(
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
					err.message || "Erreur d'ajout utilisateur",
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
			const userIdNum = parseInt(userId, 10);
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members/${userIdNum}`,
				{
					method: "DELETE",
					headers: getAuthHeaders(),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					err.message || "Erreur suppression utilisateur",
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
			const response = await delayedFetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members/${userId}/can-see-old`,
				{
					method: "PUT",
					headers: getAuthHeaders(),
					body: JSON.stringify({ canSeeOldMessages: canSee }),
				},
			);

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Erreur maj membres");
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

	const silentPollRoomMembers = async (roomId) => {
		try {
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/members`,
			);

			if (!response.ok) {
				return { status: 'error' };
			}

			const newData = await response.json();
			const currentUser = JSON.parse(localStorage.getItem('currentUser'));
			const isUserStillMember = newData.some(m => Number(m.id) === Number(currentUser.id));

			if (!isUserStillMember) {
				return { status: 'user-removed' };
			}

			if (JSON.stringify(roomMembers.value) !== JSON.stringify(newData)) {
				roomMembers.value = newData;
				return { status: 'updated' };
			}
			return { status: 'ok' };
		} catch (err) {
			return { status: 'error' };
		}
	};

	const silentPollNonMembers = async (roomId) => {
		try {
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}/non-members`,
			);

			if (!response.ok) {
				return false;
			}

			const newData = await response.json();
			if (JSON.stringify(nonMembers.value) !== JSON.stringify(newData)) {
				nonMembers.value = newData;
				return true;
			}
			return false;
		} catch (err) {
			return false;
		}
	};

	const silentPollRoom = async (roomId) => {
		try {
			const response = await fetch(
				`${window.config.BACKEND_URL}/rooms/${roomId}`,
			);

			if (!response.ok) {
				if (response.status === 404) {
					return { status: 'not-found' };
				}
				return { status: 'error' };
			}

			const newData = await response.json();
			if (JSON.stringify(currentRoom.value) !== JSON.stringify(newData)) {
				currentRoom.value = newData;
				return { status: 'updated' };
			}
			return { status: 'ok' };
		} catch (err) {
			return { status: 'error' };
		}
	};

	return {
		loadRoomMembers,
		loadNonMembers,
		addUserToRoom,
		removeUserFromRoom,
		updateCanSeeOldMessages,
		silentPollRoomMembers,
		silentPollNonMembers,
		silentPollRoom,
	};
}
