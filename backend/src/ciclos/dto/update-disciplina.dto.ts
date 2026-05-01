import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateDisciplinaDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  peso?: number;

  @IsString()
  @IsOptional()
  nivel_usuario?: 'baixo' | 'medio' | 'alto';

  @IsOptional()
  concluiu_edital?: boolean;

  @IsOptional()
  concluida?: boolean;
}
