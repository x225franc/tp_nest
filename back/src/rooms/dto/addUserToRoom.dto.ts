import { ApiProperty } from '@nestjs/swagger';

export class AddUserToRoomDto {
    @ApiProperty({ example: 42 })
    userId: number;

    @ApiProperty({ example: true, required: false })
    canSeeOldMessages?: boolean;
}
