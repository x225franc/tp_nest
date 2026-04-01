import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty({ example: 'Chat General ' })
    name: string;

    @ApiProperty({ example: false, required: false })
    isPrivate?: boolean;
}
