import { IsEnum, IsNumber, IsString, MinLength } from "class-validator";
import { TimeEntryType } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTimeEntryDto {
  @ApiProperty({ enum: ["IN","BREAK_START","BREAK_END","OUT"] })
  @IsEnum(TimeEntryType)
  type: TimeEntryType;

  @ApiProperty({ example: -9.6498 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -35.7089 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  accuracyM:number;

  @ApiProperty({ description: "Base64 sem prefixo data:", minLength: 20 })
  @IsString()
  @MinLength(20)
  photoBase64: string;

  @ApiProperty({ example: "image/jpeg" })
  @IsString()
  @MinLength(5)
  photoMime: string;
}
