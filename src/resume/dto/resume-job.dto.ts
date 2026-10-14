import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength } from "class-validator";

export class ResumeJobDto {
  @IsString()
  @MinLength(30)
  @MaxLength(20000)
  @ApiProperty()
  jobDescription: string;
}