import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDisciplinaInCicloDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

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
}

export class CreateCicloDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  concurso: string;

  @IsString()
  @IsNotEmpty()
  cargo: string;

  @IsString()
  @IsOptional()
  regiao?: string;

  @IsInt()
  @Min(1)
  @Max(168)
  horas_semanais: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDisciplinaInCicloDto)
  @IsOptional()
  disciplinas?: CreateDisciplinaInCicloDto[];
}
