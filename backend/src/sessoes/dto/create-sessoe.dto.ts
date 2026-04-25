import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';

export enum StatusSessao {
  EM_ANDAMENTO = 'em_andamento',
  PAUSADA = 'pausada',
  CONCLUIDA = 'concluida',
}

export class CreateSessoeDto {
  @IsString()
  @IsNotEmpty()
  ciclo_id: string;

  @IsString()
  @IsOptional()
  disciplina_id?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tempo_percorrido?: number; // em segundos

  @IsEnum(StatusSessao)
  @IsOptional()
  status?: StatusSessao;
}
