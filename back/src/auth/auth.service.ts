import { Injectable } from '@nestjs/common';
import { DbService } from '../database/db.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(private db: DbService) {}

    async signup(dto: SignupDto) {
        const existing = await this.db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [dto.email, dto.username],
        );
        if (Array.isArray(existing) && existing.length > 0) {
            throw new Error('L\'utilisateur existe déjà');
        }
        const hash = await bcrypt.hash(dto.password, 10);
        const result = await this.db.query(
            'INSERT INTO users (username, email, passwordHash) VALUES (?, ?, ?)',
            [dto.username, dto.email, hash],
        );
        return { id: (result as any).insertId, username: dto.username, email: dto.email, customColor: '#000000', createdAt: new Date() };
    }

    async signin(dto: SigninDto) {
        const results = await this.db.query(
            'SELECT id, username, email, passwordHash, customColor, createdAt FROM users WHERE email = ?',
            [dto.email],
        );
        if (!Array.isArray(results) || results.length === 0) {
            throw new Error('Identifiants invalides');
        }
        const user = results[0] as any;
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok) throw new Error('Identifiants invalides');
        const { passwordHash, ...rest } = user;
        return rest;
    }
}

