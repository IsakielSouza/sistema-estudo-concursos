import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateDisciplinaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  peso?: number = 5;

  @IsString()
  @IsOptional()
  nivel_usuario?: 'baixo' | 'medio' | 'alto' = 'medio';

  @IsOptional()
  concluiu_edital?: boolean = false;
}
