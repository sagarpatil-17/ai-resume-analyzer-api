
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class GuestChatDto {
  @IsUUID()
  analysisId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;
}
