import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { MessagesService } from '../messages/messages.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
	cors: { origin: '*', methods: ['GET', 'POST'] },
	namespace: '/rooms',
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	private userRooms = new Map<string, { userId: number; roomIds: Set<number> }>();
	private roomTypingUsers = new Map<number, Set<number>>();

	constructor(
		private roomsService: RoomsService,
		private messagesService: MessagesService,
		private jwtService: JwtService,
	) {}

	handleConnection(client: Socket) {
	}

	handleDisconnect(client: Socket) {
		const userRoomData = this.userRooms.get(client.id);
		if (userRoomData) {
			userRoomData.roomIds.forEach((roomId) => {
				this.broadcastRoomUsersList(roomId);
			});
		}
		this.userRooms.delete(client.id);
	}

	@SubscribeMessage('joinRooms')
	async handleJoinRooms(client: Socket, data: { token: string }) {
		try {
			const decoded = this.jwtService.verify(data.token);
			const userId = decoded.sub;

			const rooms = (await this.roomsService.getUserRooms(userId)) as any[];

			this.userRooms.set(client.id, {
				userId,
				roomIds: new Set(rooms.map((r: any) => r.id)),
			});

			rooms.forEach((room: any) => {
				client.join(`room-${room.id}`);
			});

			client.emit('joinedRooms', { success: true, rooms });

			rooms.forEach((room: any) => {
				this.notifyRoomMembersChanged(room.id);
			});
		} catch (e) {
			client.emit('joinedRooms', { success: false, error: 'Token invalide' });
		}
	}

	@SubscribeMessage('joinRoom')
	async handleJoinRoom(client: Socket, data: { roomId: number; token: string }) {
		try {
			const decoded = this.jwtService.verify(data.token);
			const userId = decoded.sub;

			const isInRoom = await this.roomsService.isUserInRoom(userId, data.roomId);
			if (!isInRoom) {
				client.emit('error', 'Vous n\'êtes pas membre de cette room');
				return;
			}

			const userRoomData = this.userRooms.get(client.id);
			if (userRoomData) {
				userRoomData.roomIds.add(data.roomId);
			}

			client.join(`room-${data.roomId}`);
			client.emit('roomJoined', { success: true, roomId: data.roomId });
			this.notifyRoomMembersChanged(data.roomId);
		} catch (e) {
			client.emit('error', e.message);
		}
	}

	@SubscribeMessage('leaveRoom')
	async handleLeaveRoom(client: Socket, data: { roomId: number }) {
		const userRoomData = this.userRooms.get(client.id);
		if (userRoomData) {
			userRoomData.roomIds.delete(data.roomId);
		}

		client.leave(`room-${data.roomId}`);
		this.notifyRoomMembersChanged(data.roomId);
	}

	@SubscribeMessage('sendRoomMessage')
	async handleSendRoomMessage(
		client: Socket,
		data: { roomId: number; content: string; token: string },
	) {
		try {
			const decoded = this.jwtService.verify(data.token);
			const userId = decoded.sub;

			const isInRoom = await this.roomsService.isUserInRoom(userId, data.roomId);
			if (!isInRoom) {
				client.emit('error', 'Vous n\'êtes pas membre de cette room');
				return;
			}

			const message = await this.messagesService.createMessage(
				data.roomId,
				userId,
				data.content,
			);

			this.server.to(`room-${data.roomId}`).emit('newRoomMessage', {
				roomId: data.roomId,
				message,
			});

			this.roomTypingUsers.delete(userId);
			this.broadcastRoomTypingUsers(data.roomId);
		} catch (e) {
			client.emit('error', e.message);
		}
	}

	@SubscribeMessage('typingRoom')
	async handleTypingRoom(
		client: Socket,
		data: { roomId: number; token: string },
	) {
		try {
			const decoded = this.jwtService.verify(data.token);
			const userId = decoded.sub;

			if (!this.roomTypingUsers.has(data.roomId)) {
				this.roomTypingUsers.set(data.roomId, new Set());
			}
			this.roomTypingUsers.get(data.roomId)?.add(userId);
			this.broadcastRoomTypingUsers(data.roomId);
		} catch (e) {
			client.emit('error', e.message);
		}
	}

	@SubscribeMessage('stopTypingRoom')
	async handleStopTypingRoom(
		client: Socket,
		data: { roomId: number; token: string },
	) {
		try {
			const decoded = this.jwtService.verify(data.token);
			const userId = decoded.sub;

			this.roomTypingUsers.get(data.roomId)?.delete(userId);
			this.broadcastRoomTypingUsers(data.roomId);
		} catch (e) {
			client.emit('error', e.message);
		}
	}

	@SubscribeMessage('roomMemberList')
	async handleGetRoomMembers(
		client: Socket,
		data: { roomId: number; token: string },
	) {
		try {
			const decoded = this.jwtService.verify(data.token);

			const members = await this.roomsService.getRoomMembers(data.roomId);
			client.emit('roomMembers', { roomId: data.roomId, members });
		} catch (e) {
			client.emit('error', e.message);
		}
	}

	private async broadcastRoomUsersList(roomId: number) {
		const members = (await this.roomsService.getRoomMembers(roomId)) as any[];
		const onlineMembers = members.filter((member: any) => {
			return true;
		});
		this.server.to(`room-${roomId}`).emit('roomUsersList', {
			roomId,
			users: onlineMembers,
		});
	}

	public async notifyRoomMembersChanged(roomId: number) {
		const members = (await this.roomsService.getRoomMembers(roomId)) as any[];

		this.server.to(`room-${roomId}`).emit('roomUsersList', {
			roomId,
			users: members,
		});

		this.server.emit('roomMemberCountUpdated', {
			roomId,
			memberCount: members.length,
		});

		this.server.to(`room-${roomId}`).emit('membersUpdated', {
			roomId,
			timestamp: Date.now(),
		});
	}

	private async broadcastRoomTypingUsers(roomId: number) {
		const typingUserIds = this.roomTypingUsers.get(roomId) || new Set();
		const allMembers = (await this.roomsService.getRoomMembers(roomId)) as any[];

		const typingUsers = allMembers.filter((member: any) =>
			typingUserIds.has(member.id),
		);

		this.server.to(`room-${roomId}`).emit('roomTypingUsers', {
			roomId,
			typers: typingUsers,
		});
	}
}
