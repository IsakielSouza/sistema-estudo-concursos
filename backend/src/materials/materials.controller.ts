import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo material de estudo' })
  @ApiResponse({ status: 201, description: 'Material criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  // @UseGuards(JwtAuthGuard) // Temporariamente desabilitado para upload em lote
  create(@Body() createMaterialDto: CreateMaterialDto, @Request() req) {
    // Para upload em lote, usar um ID de usuário real que existe no sistema
    const userId = req.user?.id || '7cb46f18-7e3f-47a6-8a44-3c8f1a5722cc';
    return this.materialsService.create(createMaterialDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os materiais de estudo' })
  @ApiResponse({ status: 200, description: 'Lista de materiais' })
  findAll() {
    return this.materialsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar materiais por palavra-chave' })
  @ApiResponse({ status: 200, description: 'Resultados da busca' })
  search(@Query('q') query: string) {
    return this.materialsService.search(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Listar materiais por categoria' })
  @ApiResponse({ status: 200, description: 'Materiais da categoria' })
  findByCategory(@Param('category') category: string) {
    return this.materialsService.findByCategory(category);
  }

  @Get('exam-type/:examType')
  @ApiOperation({ summary: 'Listar materiais por tipo de prova' })
  @ApiResponse({ status: 200, description: 'Materiais do tipo de prova' })
  findByExamType(@Param('examType') examType: string) {
    return this.materialsService.findByExamType(examType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes do material' })
  @ApiResponse({ status: 200, description: 'Detalhes do material' })
  @ApiResponse({ status: 404, description: 'Material não encontrado' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar material' })
  @ApiResponse({ status: 200, description: 'Material atualizado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Material não encontrado' })
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar material' })
  @ApiResponse({ status: 200, description: 'Material deletado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Material não encontrado' })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
} 