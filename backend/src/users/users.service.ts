import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  google_id?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const supabase = this.supabaseService.getClient();
    const supabaseAdmin = this.supabaseService.getAdminClient();
    
    let userId: string | undefined;

    // Se há senha, criar no Auth do Supabase primeiro
    if (createUserDto.password) {
      // Validar email antes de enviar para o Supabase
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createUserDto.email)) {
        throw new Error('Formato de email inválido');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createUserDto.email,
        password: createUserDto.password,
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      userId = authData.user?.id;
    } else {
      // Para usuários Google, criar no sistema de autenticação do Supabase
      // usando o service role para contornar verificações
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: createUserDto.email,
        email_confirm: true,
        user_metadata: {
          name: createUserDto.name,
          google_id: createUserDto.google_id,
          avatar_url: createUserDto.avatar_url,
        },
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário Google: ${authError.message}`);
      }

      userId = authData.user?.id;
    }

    // Criar perfil do usuário na tabela users usando cliente administrativo
    // para contornar as políticas RLS
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: createUserDto.email,
        name: createUserDto.name,
        avatar_url: createUserDto.avatar_url,
        google_id: createUserDto.google_id,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Erro ao criar perfil: ${profileError.message}`);
    }

    return profileData;
  }

  async createProfileOnly(profileData: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    google_id?: string;
  }): Promise<User> {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    
    // Usar upsert para criar ou atualizar o perfil na tabela users
    // Isso evita conflitos de ID duplicado
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        avatar_url: profileData.avatar_url,
        google_id: profileData.google_id,
      }, {
        onConflict: 'id', // Em caso de conflito, atualiza o registro existente
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar/atualizar perfil: ${error.message}`);
    }

    return data;
  }

  async findAll(): Promise<User[]> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<User> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return data;
  }

  async findByEmail(email: string): Promise<User | null> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateUserDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }
  }
} 