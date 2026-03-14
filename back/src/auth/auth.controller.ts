import { Controller, Post, Put, Body, HttpException, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService, private jwtService: JwtService) { }

    @Post('signup')
    async signup(@Body() dto: SignupDto) {
        try {
            return await this.auth.signup(dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur d\'inscription', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('signin')
    async signin(@Body() dto: SigninDto) {
        try {
            return await this.auth.signin(dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur de connexion', HttpStatus.UNAUTHORIZED);
        }
    }

    @Put('profile')
    async updateProfile(@Body() dto: UpdateProfileDto, @Req() request: Request) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token manquant');
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;
            return await this.auth.updateProfile(userId, dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur de mise à jour du profil', HttpStatus.BAD_REQUEST);
        }
    }
}
