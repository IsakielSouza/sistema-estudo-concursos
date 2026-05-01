import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

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

  @Public()
  @Get('templates/:concurso')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obter matérias padrão para um concurso/edital' })
  @ApiResponse({ status: 200, description: 'Matérias do concurso' })
  @ApiResponse({ status: 404, description: 'Concurso não encontrado' })
  getTemplates(@Param('concurso') concurso: string) {
    return this.ciclosService.getMateriasTemplate(concurso);
  }

  @Post(':id/disciplinas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova disciplina customizada em um ciclo' })
  @ApiResponse({ status: 201, description: 'Disciplina criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo não encontrado' })
  createDisciplina(
    @Param('id') cicloId: string,
    @Body() dto: CreateDisciplinaDto,
    @Request() req,
  ) {
    return this.ciclosService.createDisciplina(cicloId, req.user.id, dto);
  }

  @Put(':id/disciplinas/:disciplinaId')
  @ApiOperation({ summary: 'Atualizar disciplina de um ciclo' })
  @ApiResponse({ status: 200, description: 'Disciplina atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo ou disciplina não encontrado' })
  updateDisciplina(
    @Param('id') cicloId: string,
    @Param('disciplinaId') disciplinaId: string,
    @Body() dto: UpdateDisciplinaDto,
    @Request() req,
  ) {
    return this.ciclosService.updateDisciplina(cicloId, req.user.id, disciplinaId, dto);
  }

  @Delete(':id/disciplinas/:disciplinaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar disciplina de um ciclo' })
  @ApiResponse({ status: 204, description: 'Disciplina deletada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo ou disciplina não encontrado' })
  deleteDisciplina(
    @Param('id') cicloId: string,
    @Param('disciplinaId') disciplinaId: string,
    @Request() req,
  ) {
    return this.ciclosService.deleteDisciplina(cicloId, req.user.id, disciplinaId);
  }

  @Patch(':id/disciplinas/:disciplinaId/complete')
  @ApiOperation({ summary: 'Marcar disciplina como completa' })
  @ApiResponse({ status: 200, description: 'Disciplina marcada como completa' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Ciclo ou disciplina não encontrado' })
  completeDisciplina(
    @Param('id') cicloId: string,
    @Param('disciplinaId') disciplinaId: string,
    @Request() req,
  ) {
    return this.ciclosService.completeDisciplina(cicloId, req.user.id, disciplinaId);
  }
}
