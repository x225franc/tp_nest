import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { DbService } from '../database/db.service';
import { getRequiredEnv } from '../config/env';

@Module({
    imports: [
        JwtModule.register({
            secret: getRequiredEnv('JWT_SECRET'),
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [MessagesService, MessagesGateway, DbService],
    controllers: [MessagesController],
    exports: [MessagesService],
})
export class MessagesModule {}
