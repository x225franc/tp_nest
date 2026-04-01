import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
	@ApiProperty({ example: 'Bob225' })
	username: string;

	@ApiProperty({ example: 'user@exemple.com' })
	email: string;

	@ApiProperty({ example: 'mdp123' })
	password: string;
}
