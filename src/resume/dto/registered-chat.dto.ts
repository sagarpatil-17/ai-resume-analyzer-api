
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisteredChatDto  {
    @IsMongoId()
    @ApiProperty()
    analysisId: string;

    @IsString()
    @MinLength(1)
    @MaxLength(4000)
    @ApiProperty()
    message: string;
}
