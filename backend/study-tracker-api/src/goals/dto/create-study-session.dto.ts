
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateStudySessionDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  minutes: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsInt()
  @Min(1)
  topicId: number;
}
