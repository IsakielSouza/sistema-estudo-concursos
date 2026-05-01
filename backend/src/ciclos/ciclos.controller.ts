import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CiclosService } from './ciclos.service';
import { CreateCicloDto } from './dto/create-ciclo.dto';
import { UpdateCicloDto } from './dto/update-ciclo.dto';
import { TimeDivisionDto } from './dto/time-division.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Ciclos')
@Controller('ciclos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CiclosController {
  constructor(private readonly ciclosService: CiclosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo ciclo de estudo' })
  @ApiResponse({ status: 201, description: 'Ciclo criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() dto: CreateCicloDto, @Request() req) {
    return this.ciclosService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os ciclos do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de ciclos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Request() req) {
    return this.ciclosService.findAllByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes completo do ciclo com disciplinas e progresso' })
  @ApiResponse({ status: 200, description: 'Detalhes do ciclo' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.ciclosService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar ciclo de estudo' })
  @ApiResponse({ status: 200, description: 'Ciclo atualizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCicloDto,
    @Request() req,
  ) {
    return this.ciclosService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar ciclo de estudo' })
  @ApiResponse({ status: 204, description: 'Ciclo deletado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
  remove(@Param('id') id: string, @Request() req) {
    return this.ciclosService.remove(id, req.user.id);
  }

  @Post(':id/time-division')
  @ApiOperation({ summary: 'Definir divisão percentual entre revisão e conteúdo novo' })
  @ApiResponse({ status: 200, description: 'Divisão de tempo atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
  setTimeDivision(
    @Param('id') id: string,
    @Body() dto: TimeDivisionDto,
    @Request() req,
  ) {
    return this.ciclosService.updateTimeDivision(
      id,
      req.user.id,
      dto.revisao_percentual,
    );
  }
}
