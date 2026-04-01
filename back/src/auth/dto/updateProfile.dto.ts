import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
	@ApiProperty({ example: 'Bob225', required: false })
	username?: string;

	@ApiProperty({ example: '#FF5733', required: false })
	customColor?: string;
}
