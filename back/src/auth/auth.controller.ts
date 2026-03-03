import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('signup')
    async signup(@Body() dto: SignupDto) {
        try {
            return await this.auth.signup(dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erreur', HttpStatus.BAD_REQUEST);
        }
    }

    @Post('signin')
    async signin(@Body() dto: SigninDto) {
        try {
            return await this.auth.signin(dto);
        } catch (e) {
            throw new HttpException(e.message || 'Erroeur', HttpStatus.UNAUTHORIZED);
        }
    }
}
