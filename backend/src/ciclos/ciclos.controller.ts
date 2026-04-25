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
import { CiclosService } from './ciclos.service';
import { CreateCicloDto } from './dto/create-ciclo.dto';
import { UpdateCicloDto } from './dto/update-ciclo.dto';
import { TimeDivisionDto } from './dto/time-division.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ciclos')
@UseGuards(JwtAuthGuard)
export class CiclosController {
  constructor(private readonly ciclosService: CiclosService) {}

  /** POST /ciclos - Cria novo ciclo via Wizard */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCicloDto, @Request() req) {
    return this.ciclosService.create(dto, req.user.id);
  }

  /** GET /ciclos - Lista todos os ciclos do usuário */
  @Get()
  findAll(@Request() req) {
    return this.ciclosService.findAllByUser(req.user.id);
  }

  /** GET /ciclos/:id - Detalhes completos: disciplinas + progresso */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ciclosService.findOne(id, req.user.id);
  }

  /** PUT /ciclos/:id - Atualiza ciclo */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCicloDto,
    @Request() req,
  ) {
    return this.ciclosService.update(id, req.user.id, dto);
  }

  /** DELETE /ciclos/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req) {
    return this.ciclosService.remove(id, req.user.id);
  }

  /** POST /ciclos/:id/time-division - Define divisão revisão / conteúdo novo */
  @Post(':id/time-division')
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
