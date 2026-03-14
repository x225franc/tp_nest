import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RoomsService } from './rooms.service';
import { RoomMembersService } from './roomMembers.service';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { DbService } from '../database/db.service';
import { MessagesModule } from '../messages/messages.module';
import { getRequiredEnv } from '../config/env';

@Module({
    imports: [
        JwtModule.register({
            secret: getRequiredEnv('JWT_SECRET'),
            signOptions: { expiresIn: '24h' },
        }),
        MessagesModule,
    ],
    providers: [RoomsService, RoomMembersService, RoomsGateway, DbService],
    controllers: [RoomsController],
    exports: [RoomsService],
})
export class RoomsModule {}
