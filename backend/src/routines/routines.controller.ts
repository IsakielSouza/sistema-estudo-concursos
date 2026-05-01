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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { RoutinesService, Routine } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRoutineDto: CreateRoutineDto,
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.create(createRoutineDto, userId);
  }

  @Get()
  findAll(@GetUser('sub') userId: string): Promise<Routine[]> {
    return this.routinesService.findAllByUser(userId);
  }

  @Get('current/active')
  getCurrentActive(@GetUser('sub') userId: string): Promise<Routine | null> {
    return this.routinesService.getCurrentActiveRoutine(userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.update(id, updateRoutineDto, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive' | 'scheduled',
    @GetUser('sub') userId: string,
  ): Promise<Routine> {
    return this.routinesService.updateStatus(id, status, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ): Promise<void> {
    return this.routinesService.delete(id, userId);
  }
}
