import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Req, Headers } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Controller('messages')
export class MessagesController {
    constructor(private messagesService: MessagesService, private jwtService: JwtService) {}

    @Get('general')
    async getGeneralRoom() {
        try {
            const messages = await this.messagesService.getGeneralMessages();
            return { messages };
        } catch (e) {
            throw new HttpException(e.message || 'Erreur de récupération du chat', HttpStatus.BAD_REQUEST);
        }
    }

    @Get('room/:roomId')
    async getRoomMessages(
        @Param('roomId') roomId: number,
        @Headers('authorization') authHeader: string,
    ) {
        try {
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token manquant');
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;

            const messages = await this.messagesService.getMessages(roomId, userId);
            return { messages };
        } catch (e) {
            throw new HttpException(e.message || 'Erreur de récupération des messages', HttpStatus.BAD_REQUEST);
        }
    }

    @Get('users')
    async getUsers() {
        try {
            return await this.messagesService.getUsers();
        } catch (e) {
            throw new HttpException(e.message || 'Erreur de récupération des utilisateurs', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('send')
    async sendMessage(@Body() body: { content: string }, @Req() request: Request) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token manquant');
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;

            const message = await this.messagesService.createGeneralMessage(userId, body.content);
            return message;
        } catch (e) {
            throw new HttpException(e.message || 'Erreur d\'envoi du message', HttpStatus.BAD_REQUEST);
        }
    }
}
