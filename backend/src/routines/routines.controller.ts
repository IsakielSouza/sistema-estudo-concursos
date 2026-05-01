import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { RoutinesService, Routine } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@ApiTags('Routines')
@Controller('routines')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova rotina de estudo' })
  @ApiResponse({ status: 201, description: 'Rotina criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(
    @Body() createRoutineDto: CreateRoutineDto,
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.create(createRoutineDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as rotinas do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de rotinas' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@GetUser('sub') userId: string): Promise<Routine[]> {
    return this.routinesService.findAllByUser(userId);
  }

  @Get('current/active')
  @ApiOperation({ summary: 'Obter rotina ativa atualmente' })
  @ApiResponse({ status: 200, description: 'Rotina ativa' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getCurrentActive(@GetUser('sub') userId: string): Promise<Routine | null> {
    return this.routinesService.getCurrentActiveRoutine(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes da rotina com atividades' })
  @ApiResponse({ status: 200, description: 'Detalhes da rotina' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  findOne(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar rotina e suas atividades' })
  @ApiResponse({ status: 200, description: 'Rotina atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou conflito de horários' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.update(id, updateRoutineDto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status da rotina (ativa/inativa/agendada)' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 400, description: 'Status inválido' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive' | 'scheduled',
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar rotina' })
  @ApiResponse({ status: 204, description: 'Rotina deletada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Rotina não encontrada' })
  delete(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ): Promise<void> {
    return this.routinesService.delete(id, userId);
  }
}
