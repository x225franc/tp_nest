import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
	@ApiProperty({ example: 'mdp123' })
	oldPassword: string;

	@ApiProperty({ example: 'mdp123' })
	newPassword: string;
}
