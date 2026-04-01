import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
	@ApiProperty({ example: 'user@exemple.com' })
	email: string;
}
