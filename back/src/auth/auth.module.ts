import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DbService } from '../database/db.service';

@Module({
    imports: [],
    providers: [AuthService, DbService],
    controllers: [AuthController],
})
export class AuthModule {}
