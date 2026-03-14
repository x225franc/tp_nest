<script setup>
	import { onMounted, onUnmounted } from 'vue';
	import { useRoomsApi } from '../composables/useRoomsApi';
	import { currentRoom } from '../composables/useRoomsState';
	import RoomForm from './rooms/RoomForm.vue';
	import RoomsList from './rooms/RoomsList.vue';
	import RoomDetails from './rooms/RoomDetails.vue';

	const { loadUserRooms, loadPublicRooms, loadRoom, silentPollPublicRooms, silentPollUserRooms } = useRoomsApi();

	let roomsPollingInterval = null;

	const selectRoom = async (room) => {
		if (currentRoom.value?.id !== room.id) {
			await loadRoom(room.id);
		}
	};

	const backToRoomsList = async () => {
		currentRoom.value = null;
		const user = localStorage.getItem('currentUser');
		if (user) {
			await loadUserRooms();
		}
		await loadPublicRooms();
	};

	onMounted(() => {
		const user = localStorage.getItem('currentUser');
		if (user) {
			loadUserRooms();
		}
		loadPublicRooms();

		if (roomsPollingInterval) {
			clearInterval(roomsPollingInterval);
		}
		roomsPollingInterval = setInterval(async () => {
			const user = localStorage.getItem('currentUser');
			if (user) {
				await silentPollUserRooms();
			}
			await silentPollPublicRooms();
		}, 1000);
	});

	onUnmounted(() => {
		if (roomsPollingInterval) {
			clearInterval(roomsPollingInterval);
		}
	});
</script>

<template>
	<div class="mc-page">
		<div class="container d-grid gap-3">
			<template v-if="!currentRoom">
				<RoomForm />
				<RoomsList @select-room="selectRoom" />
			</template>
			<RoomDetails
				@back-to-list="backToRoomsList"
				@room-deleted="backToRoomsList"
				@room-left="backToRoomsList"
			/>
		</div>
	</div>
</template>
