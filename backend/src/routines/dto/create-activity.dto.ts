import { IsString, IsOptional, IsBoolean, IsArray, Matches } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time deve estar no formato HH:MM',
  })
  start_time: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time deve estar no formato HH:MM',
  })
  end_time: string;

  @IsOptional()
  @IsString()
  type?: 'study' | 'other' = 'study';

  @IsOptional()
  @IsBoolean()
  recurrence_enabled?: boolean = false;

  @IsOptional()
  @IsArray()
  days?: number[];
}
