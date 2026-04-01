import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
	@ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
	token: string;
}
