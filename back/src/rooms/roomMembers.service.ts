import { Injectable } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class RoomMembersService {
    constructor(private db: DbService) {}

    async getRoomMembers(roomId: number) {
        return await this.db.query(
            `SELECT u.id, u.username, u.customColor, rm.joinedAt, rm.canSeeOldMessages
            FROM room_members rm
            JOIN users u ON rm.userId = u.id
            WHERE rm.roomId = ?
            ORDER BY rm.joinedAt ASC`,
            [roomId],
        );
    }

    async isUserInRoom(userId: number, roomId: number): Promise<boolean> {
        const result = await this.db.query(
            'SELECT id FROM room_members WHERE userId = ? AND roomId = ?',
            [userId, roomId],
        );
        return Array.isArray(result) && result.length > 0;
    }

    async addUserToRoom(userId: number, roomId: number, canSeeOldMessages: boolean = false) {
        const alreadyMember = await this.isUserInRoom(userId, roomId);
        if (alreadyMember) {
            throw new Error('Utilisateur déjà membre');
        }

        await this.db.query(
            'INSERT INTO room_members (userId, roomId, canSeeOldMessages) VALUES (?, ?, ?)',
            [userId, roomId, canSeeOldMessages ? 1 : 0],
        );

        return { success: true };
    }

    async removeUserFromRoom(userId: number, roomId: number) {
        await this.db.query(
            'DELETE FROM room_members WHERE userId = ? AND roomId = ?',
            [userId, roomId],
        );

        return { success: true };
    }

    async canUserSeeOldMessages(userId: number, roomId: number): Promise<boolean> {
        const result = await this.db.query(
            'SELECT canSeeOldMessages FROM room_members WHERE userId = ? AND roomId = ?',
            [userId, roomId],
        );
        if (!Array.isArray(result) || result.length === 0) {
            return false;
        }
        return (result[0] as any).canSeeOldMessages === 1;
    }

    async updateCanSeeOldMessages(userId: number, roomId: number, canSee: boolean) {
        await this.db.query(
            'UPDATE room_members SET canSeeOldMessages = ? WHERE userId = ? AND roomId = ?',
            [canSee ? 1 : 0, userId, roomId],
        );
        return { success: true };
    }

    async getNonMembersOfRoom(roomId: number) {
        return await this.db.query(
            `SELECT u.id, u.username, u.customColor
            FROM users u
            WHERE u.id NOT IN (SELECT userId FROM room_members WHERE roomId = ?)
            ORDER BY u.username ASC`,
            [roomId],
        );
    }

    async removeAllMembersFromRoom(roomId: number) {
        await this.db.query('DELETE FROM room_members WHERE roomId = ?', [roomId]);
    }
}
