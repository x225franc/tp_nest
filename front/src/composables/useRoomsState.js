import { ref } from "vue";

export const publicRooms = ref([]);
export const userRooms = ref([]);
export const currentRoom = ref(null);
export const roomMembers = ref([]);
export const nonMembers = ref([]);
export const loading = ref(false);
export const error = ref(null);

export function useRoomsState() {
	const clearError = () => (error.value = null);
	const setLoading = (value) => (loading.value = value);
	const setCurrentRoom = (room) => (currentRoom.value = room);

	return {
		publicRooms,
		userRooms,
		currentRoom,
		roomMembers,
		nonMembers,
		loading,
		error,
		clearError,
		setLoading,
		setCurrentRoom,
	};
}
