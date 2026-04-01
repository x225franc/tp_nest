import { ApiProperty } from '@nestjs/swagger';

export class Enable2FADto {
	@ApiProperty({ example: true })
	twoFactorEnabled: boolean;
}
