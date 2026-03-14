import { Injectable } from "@nestjs/common";
import { DbService } from "../database/db.service";
import { RoomMembersService } from "./roomMembers.service";

@Injectable()
export class RoomsService {
	constructor(
		private db: DbService,
		private roomMembersService: RoomMembersService,
	) {}

	async createRoom(ownerId: number, name: string, isPrivate: boolean = false) {
		const result = await this.db.query(
			"INSERT INTO rooms (ownerId, name, isPrivate) VALUES (?, ?, ?)",
			[ownerId, name, isPrivate ? 1 : 0],
		);
		const roomId = (result as any).insertId;

		await this.db.query(
			"INSERT INTO room_members (userId, roomId) VALUES (?, ?)",
			[ownerId, roomId],
		);

		return await this.getRoomById(roomId);
	}

	async getRoomById(roomId: number) {
		const result = await this.db.query(
			`SELECT r.id, r.name, r.isPrivate, r.ownerId, r.createdAt, u.username as ownerName
            FROM rooms r
            LEFT JOIN users u ON r.ownerId = u.id
            WHERE r.id = ?`,
			[roomId],
		);
		return (result as any)[0] || null;
	}

	async getPublicRooms() {
		return await this.db.query(
			`SELECT r.id, r.name, r.isPrivate, r.ownerId, r.createdAt, u.username as ownerName, COUNT(DISTINCT rm.userId) as memberCount
            FROM rooms r
            LEFT JOIN users u ON r.ownerId = u.id
            LEFT JOIN room_members rm ON r.id = rm.roomId
            WHERE r.isPrivate = 0
            GROUP BY r.id
            ORDER BY r.createdAt DESC`,
		);
	}

	async getUserRooms(userId: number) {
		return await this.db.query(
			`SELECT r.id, r.name, r.isPrivate, r.ownerId, r.createdAt, u.username as ownerName, COUNT(DISTINCT rm2.userId) as memberCount
            FROM rooms r
            LEFT JOIN users u ON r.ownerId = u.id
            JOIN room_members rm ON r.id = rm.roomId AND rm.userId = ?
            LEFT JOIN room_members rm2 ON r.id = rm2.roomId
            GROUP BY r.id
            ORDER BY r.createdAt DESC`,
			[userId],
		);
	}

	async updateRoom(
		roomId: number,
		userId: number,
		updates: { name?: string; isPrivate?: boolean },
	) {
		const room = await this.getRoomById(roomId);
		if (!room) {
			throw new Error("Room non trouvée");
		}
		if (room.ownerId !== userId) {
			throw new Error("Pas le droit de modifier la room");
		}

		const updateFields: string[] = [];
		const values: any[] = [];

		if (updates.name !== undefined) {
			updateFields.push("name = ?");
			values.push(updates.name);
		}
		if (updates.isPrivate !== undefined) {
			updateFields.push("isPrivate = ?");
			values.push(updates.isPrivate ? 1 : 0);
		}

		if (updateFields.length === 0) {
			return room;
		}

		values.push(roomId);
		await this.db.query(
			`UPDATE rooms SET ${updateFields.join(", ")} WHERE id = ?`,
			values,
		);

		return await this.getRoomById(roomId);
	}

	async deleteRoom(roomId: number, userId: number) {
		const room = await this.getRoomById(roomId);
		if (!room) {
			throw new Error("Room non trouvée");
		}
		if (room.ownerId !== userId) {
			throw new Error("Pas le droit de supprimer la room");
		}

		await this.roomMembersService.removeAllMembersFromRoom(roomId);
		await this.db.query("DELETE FROM messages WHERE roomId = ?", [roomId]);
		await this.db.query("DELETE FROM rooms WHERE id = ?", [roomId]);

		return { success: true };
	}

	async getRoomMembers(roomId: number) {
		return this.roomMembersService.getRoomMembers(roomId);
	}

	async isUserInRoom(userId: number, roomId: number): Promise<boolean> {
		return this.roomMembersService.isUserInRoom(userId, roomId);
	}

	async addUserToRoom(
		userId: number,
		roomId: number,
		canSeeOldMessages: boolean = false,
	) {
		return this.roomMembersService.addUserToRoom(
			userId,
			roomId,
			canSeeOldMessages,
		);
	}

	async removeUserFromRoom(userId: number, roomId: number) {
		return this.roomMembersService.removeUserFromRoom(userId, roomId);
	}

	async canUserSeeOldMessages(
		userId: number,
		roomId: number,
	): Promise<boolean> {
		return this.roomMembersService.canUserSeeOldMessages(userId, roomId);
	}

	async updateCanSeeOldMessages(
		userId: number,
		roomId: number,
		canSee: boolean,
	) {
		return this.roomMembersService.updateCanSeeOldMessages(
			userId,
			roomId,
			canSee,
		);
	}

	async getNonMembersOfRoom(roomId: number) {
		return this.roomMembersService.getNonMembersOfRoom(roomId);
	}
}
