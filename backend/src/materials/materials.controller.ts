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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createMaterialDto: CreateMaterialDto, @Request() req) {
    return this.materialsService.create(createMaterialDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.materialsService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.materialsService.search(query);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string) {
    return this.materialsService.findByCategory(category);
  }

  @Get('exam-type/:examType')
  findByExamType(@Param('examType') examType: string) {
    return this.materialsService.findByExamType(examType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
} 