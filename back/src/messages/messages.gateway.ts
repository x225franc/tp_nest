import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
	cors: { origin: "*", methods: ["GET", "POST"] },
})
export class MessagesGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	private connectedUsers = new Map<
		string,
		{ userId: number; username: string; customColor: string }
	>();

	private typingUsers = new Map<string, number>();

	constructor(
		private messagesService: MessagesService,
		private jwtService: JwtService,
	) {}

	handleConnection(client: Socket) {
	}

	handleDisconnect(client: Socket) {
		this.connectedUsers.delete(client.id);
		this.typingUsers.delete(client.id);
		this.broadcastUsersList();
		this.broadcastTypingUsers();
	}

	@SubscribeMessage("join")
	async handleJoin(client: Socket, data: { token: string }) {
		try {
			const decoded = this.jwtService.verify(data.token);
			const userId = decoded.sub;
			const user = await this.messagesService.getUserById(userId);

			this.connectedUsers.set(client.id, {
				userId,
				username: user.username,
				customColor: user.customColor,
			});

			client.emit("joined", { success: true, user });
			this.broadcastUsersList();
		} catch (e) {
			client.emit("joined", { success: false, error: "Token invalide" });
		}
	}

	@SubscribeMessage("sendMessage")
	async handleSendMessage(client: Socket, data: { content: string }) {
		try {
			const userData = this.connectedUsers.get(client.id);
			if (!userData) {
				client.emit("error", "Non connecté");
				return;
			}

			const message = await this.messagesService.createGeneralMessage(
				userData.userId,
				data.content,
			);
			this.server.emit("newMessage", message);
			this.typingUsers.delete(client.id);
			this.broadcastTypingUsers();
		} catch (e) {
			client.emit("error", e.message);
		}
	}

	@SubscribeMessage("typing")
	handleTyping(client: Socket) {
		const userData = this.connectedUsers.get(client.id);
		if (userData) {
			this.typingUsers.set(client.id, userData.userId);
			this.broadcastTypingUsers();
		}
	}

	private broadcastTypingUsers() {
		const typing: { username: string; customColor: string }[] = [];
		const seenUserIds = new Set();

		this.typingUsers.forEach((userId) => {
			for (const user of this.connectedUsers.values()) {
				if (user.userId === userId && !seenUserIds.has(userId)) {
					typing.push({
						username: user.username,
						customColor: user.customColor,
					});
					seenUserIds.add(userId);
					break;
				}
			}
		});

		this.server.emit("typingUsers", typing);
	}

	@SubscribeMessage("stopTyping")
	handleStopTyping(client: Socket) {
		this.typingUsers.delete(client.id);
		this.broadcastTypingUsers();
	}

	private broadcastUsersList() {
		const users = Array.from(this.connectedUsers.values()).map((user) => ({
			id: user.userId,
			username: user.username,
			customColor: user.customColor,
		}));
		this.server.emit("usersList", users);
	}
}
