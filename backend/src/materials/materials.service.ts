import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

export interface Material {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  category: string;
  tags?: string;
  author?: string;
  exam_type?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

@Injectable()
export class MaterialsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createMaterialDto: CreateMaterialDto, userId: string): Promise<Material> {
    // Usar cliente admin para contornar RLS durante upload em lote
    const supabaseAdmin = this.supabaseService.getAdminClient();
    
    const { data, error } = await supabaseAdmin
      .from('materials')
      .insert({
        ...createMaterialDto,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar material: ${error.message}`);
    }

    return data;
  }

  async findAll(): Promise<Material[]> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar materiais: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<Material> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Material com ID ${id} não encontrado`);
    }

    return data;
  }

  async findByCategory(category: string): Promise<Material[]> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar materiais por categoria: ${error.message}`);
    }

    return data || [];
  }

  async findByExamType(examType: string): Promise<Material[]> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('exam_type', examType)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar materiais por tipo de concurso: ${error.message}`);
    }

    return data || [];
  }

  async search(query: string): Promise<Material[]> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar materiais: ${error.message}`);
    }

    return data || [];
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<Material> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('materials')
      .update({
        ...updateMaterialDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Material com ID ${id} não encontrado`);
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar material: ${error.message}`);
    }
  }
} 