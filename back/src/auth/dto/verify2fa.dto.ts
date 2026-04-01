import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
	@ApiProperty({ example: 'ABC123', description: 'Code de 6 caractères envoyé par email' })
	code: string;
}
