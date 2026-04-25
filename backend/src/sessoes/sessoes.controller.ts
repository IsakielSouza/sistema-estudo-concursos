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
import { SessoesService } from './sessoes.service';
import { CreateSessoeDto } from './dto/create-sessoe.dto';
import { UpdateSessoeDto } from './dto/update-sessoe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sessoes')
@UseGuards(JwtAuthGuard)
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  /** POST /sessoes - Inicia uma nova sessão */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSessoeDto, @Request() req) {
    return this.sessoesService.create(dto, req.user.id);
  }

  /** GET /sessoes?ciclo_id=... - Lista sessões do usuário */
  @Get()
  findAll(@Request() req, @Query('ciclo_id') cicloId?: string) {
    return this.sessoesService.findAll(req.user.id, cicloId);
  }

  /** GET /sessoes/:id */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.sessoesService.findOne(id, req.user.id);
  }

  /** PUT /sessoes/:id - Pausar / retomar / concluir sessão */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessoeDto,
    @Request() req,
  ) {
    return this.sessoesService.update(id, req.user.id, dto);
  }

  /** DELETE /sessoes/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req) {
    return this.sessoesService.remove(id, req.user.id);
  }
}
