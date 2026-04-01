import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomDto {
    @ApiProperty({ example: 'Nom de salle mis à jour', required: false })
    name?: string;

    @ApiProperty({ example: true, required: false })
    isPrivate?: boolean;
}
