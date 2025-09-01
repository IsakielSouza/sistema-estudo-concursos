import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsNotEmpty()
  file_url: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  exam_type?: string; // Tipo de concurso (ex: "policial", "fiscal", etc.)
} 