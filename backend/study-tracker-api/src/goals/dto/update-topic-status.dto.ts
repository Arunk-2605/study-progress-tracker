import { IsBoolean } from 'class-validator';

export class UpdateTopicStatusDto {
  @IsBoolean()
  completed: boolean;
}