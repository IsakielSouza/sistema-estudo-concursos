import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateActivityDto } from './create-activity.dto';

export class CreateRoutineDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'scheduled' = 'inactive';

  @IsOptional()
  @IsNumber()
  weekly_hour_limit?: number = 40;

  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean = true;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActivityDto)
  activities?: CreateActivityDto[];
}
