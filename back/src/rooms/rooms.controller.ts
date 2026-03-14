import { Controller, Get, Post, Put, Delete, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/createRoom.dto';
import { UpdateRoomDto } from './dto/updateRoom.dto';
import { AddUserToRoomDto } from './dto/addUserToRoom.dto';
import { JwtService } from '@nestjs/jwt';
import { RoomsGateway } from './rooms.gateway';

@Controller('rooms')
export class RoomsController {
    constructor(
        private roomsService: RoomsService,
        private jwtService: JwtService,
        private roomsGateway: RoomsGateway,
    ) {}

    private extractUserFromToken(authHeader: string): number | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        try {
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            return parseInt(String(decoded.sub), 10);
        } catch {
            return null;
        }
    }

    @Post()
    async createRoom(
        @Body() dto: CreateRoomDto,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = this.extractUserFromToken(authHeader);
        if (!userId) {
            throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.roomsService.createRoom(userId, dto.name, dto.isPrivate || false);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur création room', HttpStatus.BAD_REQUEST);
        }
    }

    @Get('public')
    async getPublicRooms() {
        try {
            return await this.roomsService.getPublicRooms();
        } catch (e) {
            throw new HttpException(e.message || 'Erreur récupération des rooms', HttpStatus.BAD_REQUEST);
        }
    }

    @Get('my-rooms')
    async getUserRooms(@Headers('authorization') authHeader: string) {
        const userId = this.extractUserFromToken(authHeader);
        if (!userId) {
            throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.roomsService.getUserRooms(userId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur récupération de vos rooms', HttpStatus.BAD_REQUEST);
        }
    }

    @Get(':roomId')
    async getRoom(@Param('roomId') roomId: number) {
        try {
            const room = await this.roomsService.getRoomById(roomId);
            if (!room) {
                throw new HttpException('Room non trouvée', HttpStatus.NOT_FOUND);
            }
            return room;
        } catch (e) {
            throw new HttpException(e.message || 'Erreur récupération room', HttpStatus.BAD_REQUEST);
        }
    }

    @Get(':roomId/members')
    async getRoomMembers(@Param('roomId') roomId: number) {
        try {
            return await this.roomsService.getRoomMembers(roomId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur récupération membres', HttpStatus.BAD_REQUEST);
        }
    }

    @Get(':roomId/non-members')
    async getNonMembers(@Param('roomId') roomId: number) {
        try {
            return await this.roomsService.getNonMembersOfRoom(roomId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur récupération utilisateurs', HttpStatus.BAD_REQUEST);
        }
    }

    @Get(':roomId/can-see-old/:userId')
    async canSeeOldMessages(
        @Param('roomId') roomId: number,
        @Param('userId') userId: number,
    ) {
        try {
            const canSee = await this.roomsService.canUserSeeOldMessages(userId, roomId);
            return { canSeeOldMessages: canSee };
        } catch (e) {
            throw new HttpException(e.message || 'Erreur', HttpStatus.BAD_REQUEST);
        }
    }

    @Put(':roomId')
    async updateRoom(
        @Param('roomId') roomId: number,
        @Body() dto: UpdateRoomDto,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = this.extractUserFromToken(authHeader);
        if (!userId) {
            throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.roomsService.updateRoom(roomId, userId, dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur de maj', HttpStatus.BAD_REQUEST);
        }
    }

    @Delete(':roomId')
    async deleteRoom(
        @Param('roomId') roomId: number,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = this.extractUserFromToken(authHeader);
        if (!userId) {
            throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.roomsService.deleteRoom(roomId, userId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur suppression', HttpStatus.BAD_REQUEST);
        }
    }

    @Post(':roomId/members')
    async addUserToRoom(
        @Param('roomId') roomId: number,
        @Body() dto: AddUserToRoomDto,
        @Headers('authorization') authHeader: string,
    ) {
        const userId = this.extractUserFromToken(authHeader);
        if (!userId) {
            throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
        }
        try {
            const room = await this.roomsService.getRoomById(roomId);
            if (!room) {
                throw new HttpException('Room non trouvée', HttpStatus.NOT_FOUND);
            }

            if (room.ownerId !== userId) {
                const isSelfJoin = dto.userId === userId;
                if (!(isSelfJoin && room.isPrivate === 0)) {
                    throw new HttpException('Pas le droit d\'ajouter des utilisateurs', HttpStatus.FORBIDDEN);
                }
            }

            const result = await this.roomsService.addUserToRoom(
                dto.userId,
                roomId,
                dto.canSeeOldMessages || false,
            );

            await this.roomsGateway.notifyRoomMembersChanged(roomId);
            return result;
        } catch (e) {
            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException(e.message || 'Erreur ajout utilisateur', HttpStatus.BAD_REQUEST);
        }
    }

    @Delete(':roomId/members/:userId')
    async removeUserFromRoom(
        @Param('roomId') roomId: number,
        @Param('userId') userId: number,
        @Headers('authorization') authHeader: string,
    ) {
        const currentUserId = this.extractUserFromToken(authHeader);
        if (!currentUserId) {
            throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
        }
        try {
            const room = await this.roomsService.getRoomById(roomId);
            if (!room) {
                throw new HttpException('Room non trouvée', HttpStatus.NOT_FOUND);
            }
            const userIdNum = parseInt(String(userId), 10);
            const currentUserIdNum = parseInt(String(currentUserId), 10);
            const ownerIdNum = parseInt(String(room.ownerId), 10);
            
            const isOwner = ownerIdNum === currentUserIdNum;
            const isSelfRemoval = userIdNum === currentUserIdNum;
            
            if (!isOwner && !isSelfRemoval) {
                throw new HttpException(' Pas le droit de retirer cet utilisateur', HttpStatus.FORBIDDEN);
            }

            const result = await this.roomsService.removeUserFromRoom(userId, roomId);
            await this.roomsGateway.notifyRoomMembersChanged(roomId);
            return result;
        } catch (e) {
            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException(e.message || 'Erreur suppression utilisateur', HttpStatus.BAD_REQUEST);
        }
    }

    @Put(':roomId/members/:userId/can-see-old')
    async updateCanSeeOldMessages(
        @Param('roomId') roomId: number,
        @Param('userId') userId: number,
        @Body() body: { canSeeOldMessages: boolean },
        @Headers('authorization') authHeader: string,
    ) {
        const currentUserId = this.extractUserFromToken(authHeader);
        if (!currentUserId) {
            throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
        }
        try {
            const room = await this.roomsService.getRoomById(roomId);
            if (!room) {
                throw new HttpException('Room non trouvée', HttpStatus.NOT_FOUND);
            }
            if (room.ownerId !== currentUserId) {
                throw new HttpException('Pas le droit de modifier les permissions', HttpStatus.FORBIDDEN);
            }

            return await this.roomsService.updateCanSeeOldMessages(
                userId,
                roomId,
                body.canSeeOldMessages,
            );
        } catch (e) {
            if (e instanceof HttpException) {
                throw e;
            }
            throw new HttpException(e.message || 'Erreur de maj', HttpStatus.BAD_REQUEST);
        }
    }
}
