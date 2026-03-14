import { Injectable } from '@nestjs/common';
import { DbService } from '../database/db.service';

@Injectable()
export class MessagesService {
    constructor(private db: DbService) {}

    async getGeneralMessages() {
        return await this.db.query(
                `SELECT m.id, m.content, m.createdAt, m.senderId, u.username, u.customColor 
                FROM messages m 
                JOIN users u ON m.senderId = u.id 
                WHERE m.roomId IS NULL 
                ORDER BY m.createdAt ASC`,
        );
    }

    async getMessages(roomId: number, userId?: number) {
        if (userId) {
            const permission = await this.db.query(
                'SELECT canSeeOldMessages, joinedAt FROM room_members WHERE userId = ? AND roomId = ?',
                [userId, roomId],
            );

            if (!Array.isArray(permission) || permission.length === 0) {
                throw new Error('Vous n\'êtes pas membre de cette room');
            }

            const canSeeOldMessages = (permission[0] as any).canSeeOldMessages === 1;
            const joinedAt = (permission[0] as any).joinedAt;

            if (canSeeOldMessages) {
                return await this.db.query(
                    `SELECT m.id, m.content, m.createdAt, m.senderId, u.username, u.customColor 
                    FROM messages m 
                    JOIN users u ON m.senderId = u.id 
                    WHERE m.roomId = ? 
                    ORDER BY m.createdAt ASC`,
                    [roomId],
                );
            } else {
                return await this.db.query(
                    `SELECT m.id, m.content, m.createdAt, m.senderId, u.username, u.customColor 
                    FROM messages m 
                    JOIN users u ON m.senderId = u.id 
                    WHERE m.roomId = ? AND m.createdAt > ? 
                    ORDER BY m.createdAt ASC`,
                    [roomId, joinedAt],
                );
            }
        }

        return await this.db.query(
                `SELECT m.id, m.content, m.createdAt, m.senderId, u.username, u.customColor 
                FROM messages m 
                JOIN users u ON m.senderId = u.id 
                WHERE m.roomId = ? 
                ORDER BY m.createdAt ASC`,
                [roomId],
        );
    }

    async createGeneralMessage(senderId: number, content: string) {
        const result = await this.db.query(
            'INSERT INTO messages (content, senderId, roomId) VALUES (?, ?, NULL)',
            [content, senderId],
        );
        const messageId = (result as any).insertId;
        const message = await this.db.query(
                `SELECT m.id, m.content, m.createdAt, m.senderId, u.username, u.customColor 
                FROM messages m 
                JOIN users u ON m.senderId = u.id 
                WHERE m.id = ?`,
                [messageId],
        );
        return (message as any)[0];
    }

    async createMessage(roomId: number, senderId: number, content: string) {
        const result = await this.db.query(
                'INSERT INTO messages (content, senderId, roomId) VALUES (?, ?, ?)',
                [content, senderId, roomId],
        );
        const messageId = (result as any).insertId;
        const message = await this.db.query(
                `SELECT m.id, m.content, m.createdAt, m.senderId, u.username, u.customColor 
                FROM messages m 
                JOIN users u ON m.senderId = u.id 
                WHERE m.id = ?`,
                [messageId],
        );
        return (message as any)[0];
    }

    async getUsers() {
        return await this.db.query(
                `SELECT id, username, customColor FROM users ORDER BY username ASC`,
        );
    }

    async getUserById(userId: number) {
        const result = await this.db.query(
                'SELECT id, username, email, customColor FROM users WHERE id = ?',
                [userId],
        );
        if (!Array.isArray(result) || result.length === 0) {
            throw new Error('Utilisateur non trouvé');
        }
        return (result as any)[0];
    }
}
