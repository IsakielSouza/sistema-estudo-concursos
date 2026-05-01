import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessoesService } from './sessoes.service';
import { CreateSessoeDto } from './dto/create-sessoe.dto';
import { UpdateSessoeDto } from './dto/update-sessoe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Sessoes')
@Controller('sessoes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar nova sessão de estudo' })
  @ApiResponse({ status: 201, description: 'Sessão iniciada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() dto: CreateSessoeDto, @Request() req) {
    return this.sessoesService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar sessões do usuário, opcionalmente filtradas por ciclo' })
  @ApiResponse({ status: 200, description: 'Lista de sessões' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Request() req, @Query('ciclo_id') cicloId?: string) {
    return this.sessoesService.findAll(req.user.id, cicloId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes da sessão' })
  @ApiResponse({ status: 200, description: 'Detalhes da sessão' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.sessoesService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar sessão (pausar, retomar ou concluir)' })
  @ApiResponse({ status: 200, description: 'Sessão atualizada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessoeDto,
    @Request() req,
  ) {
    return this.sessoesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar sessão' })
  @ApiResponse({ status: 204, description: 'Sessão deletada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  remove(@Param('id') id: string, @Request() req) {
    return this.sessoesService.remove(id, req.user.id);
  }
}
