import { IsInt, Max, Min } from 'class-validator';

export class TimeDivisionDto {
  @IsInt()
  @Min(0)
  @Max(100)
  revisao_percentual: number;
}
