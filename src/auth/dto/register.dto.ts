
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
} from 'class-validator';

export class RegisterDto {
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    @ApiProperty()
    name: string;

    @IsEmail()
    @ApiProperty()
    email: string;

    @IsString()
    @MinLength(4)
    @MaxLength(72)
    @ApiProperty()
    password: string;
}
