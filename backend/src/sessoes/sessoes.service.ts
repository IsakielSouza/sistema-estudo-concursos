import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateSessoeDto, StatusSessao } from './dto/create-sessoe.dto';
import { UpdateSessoeDto } from './dto/update-sessoe.dto';

export interface Sessao {
  id: string;
  user_id: string;
  ciclo_id: string;
  disciplina_id?: string;
  tempo_percorrido: number; // em segundos
  status: StatusSessao;
  iniciada_em: string;
  pausada_em?: string;
  concluida_em?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class SessoesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /** POST /sessoes - Inicia uma nova sessão de estudo */
  async create(dto: CreateSessoeDto, userId: string): Promise<Sessao> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('sessoes')
      .insert({
        user_id: userId,
        ciclo_id: dto.ciclo_id,
        disciplina_id: dto.disciplina_id ?? null,
        tempo_percorrido: dto.tempo_percorrido ?? 0,
        status: dto.status ?? StatusSessao.EM_ANDAMENTO,
        iniciada_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Erro ao criar sessão: ${error?.message}`);
    }

    return data;
  }

  /** GET /sessoes?ciclo_id=... - Lista sessões do usuário */
  async findAll(userId: string, cicloId?: string): Promise<Sessao[]> {
    const admin = this.supabaseService.getAdminClient();

    let query = admin
      .from('sessoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cicloId) {
      query = query.eq('ciclo_id', cicloId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar sessões: ${error.message}`);
    }

    return data || [];
  }

  /** GET /sessoes/:id */
  async findOne(id: string, userId: string): Promise<Sessao> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('sessoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Sessão ${id} não encontrada`);
    }

    if (data.user_id !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    return data;
  }

  /**
   * PUT /sessoes/:id - Pausa, retoma ou conclui uma sessão.
   * O campo `tempo_percorrido` deve ser enviado acumulado pelo frontend.
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateSessoeDto,
  ): Promise<Sessao> {
    const admin = this.supabaseService.getAdminClient();

    // Garante que a sessão pertence ao usuário
    await this.findOne(id, userId);

    const extraFields: Record<string, string | null> = {};
    if (dto.status === StatusSessao.PAUSADA) {
      extraFields['pausada_em'] = new Date().toISOString();
    } else if (dto.status === StatusSessao.CONCLUIDA) {
      extraFields['concluida_em'] = new Date().toISOString();
    }

    const { data, error } = await admin
      .from('sessoes')
      .update({
        ...dto,
        ...extraFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Erro ao atualizar sessão: ${error?.message}`);
    }

    return data;
  }

  /** DELETE /sessoes/:id */
  async remove(id: string, userId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    await this.findOne(id, userId); // valida ownership

    const { error } = await admin.from('sessoes').delete().eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar sessão: ${error.message}`);
    }
  }
}
