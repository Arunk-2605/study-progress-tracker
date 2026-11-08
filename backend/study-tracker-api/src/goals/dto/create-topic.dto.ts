import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;
}