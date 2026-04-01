import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
	@ApiProperty({ example: 'mdp123' })
	token: string;

	@ApiProperty({ example: 'mdp123' })
	newPassword: string;
}
