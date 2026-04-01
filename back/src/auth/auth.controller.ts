import { Controller, Post, Put, Body, HttpException, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { Enable2FADto } from './dto/enable2fa.dto';
import { Verify2FADto } from './dto/verify2fa.dto';
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

    @Post('verify-email')
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        try {
            return await this.auth.verifyEmail(dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur vérification d\'email', HttpStatus.BAD_REQUEST);
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

    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        try {
            return await this.auth.forgotPassword(dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur demande de réinitialisation', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('validate-reset-token')
    async validateResetToken(@Body() dto: { token: string }) {
        try {
            return await this.auth.validateResetToken(dto.token);
        } catch (e) {
            throw new HttpException(e.message || 'Token invalide', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        try {
            return await this.auth.resetPassword(dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur réinitialisation mdp', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('change-password')
    async changePassword(@Body() dto: ChangePasswordDto, @Req() request: Request) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token manquant');
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;
            return await this.auth.changePassword(userId, dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur changement mdp', HttpStatus.BAD_REQUEST);
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
            throw new HttpException(e.message || 'Erreur maj profil', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('enable-2fa')
    async enable2FA(@Body() dto: Enable2FADto, @Req() request: Request) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token manquant');
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;
            return await this.auth.enable2FA(userId, dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur activation 2FA', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('disable-2fa')
    async disable2FA(@Req() request: Request) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token manquant');
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;
            return await this.auth.disable2FA(userId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur désactivation 2FA', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('verify-2fa')
    async verify2FA(@Body() dto: Verify2FADto, @Req() request: Request) {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token manquant');
            }
            const token = authHeader.substring(7);
            const decoded = this.jwtService.verify(token);
            const userId = decoded.sub;
            return await this.auth.verify2FA(dto.code, userId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur vérification 2FA', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('verify-2fa-login')
    async verify2FALogin(@Body() dto: Verify2FADto & { userId: number }) {
        try {
            return await this.auth.verify2FA(dto.code, dto.userId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur vérification 2FA', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('signin-2fa-verified')
    async signin2FAVerified(@Body() dto: { userId: number }) {
        try {
            return await this.auth.signin2FAVerified(dto.userId);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur génération token', HttpStatus.BAD_REQUEST);
        }
    }
}

