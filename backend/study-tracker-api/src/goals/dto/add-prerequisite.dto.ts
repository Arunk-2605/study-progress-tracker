import { IsInt, IsPositive } from 'class-validator';

export class AddPrerequisiteDto {
  @IsInt()
  @IsPositive()
  prerequisiteId: number;
}