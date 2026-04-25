import { PartialType } from '@nestjs/mapped-types';
import { CreateSessoeDto } from './create-sessoe.dto';
import { IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { StatusSessao } from './create-sessoe.dto';

export class UpdateSessoeDto extends PartialType(CreateSessoeDto) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  tempo_percorrido?: number;

  @IsEnum(StatusSessao)
  @IsOptional()
  status?: StatusSessao;
}
