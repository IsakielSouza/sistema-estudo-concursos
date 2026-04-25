import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateCicloDto } from './dto/create-ciclo.dto';
import { UpdateCicloDto } from './dto/update-ciclo.dto';

export interface Ciclo {
  id: string;
  user_id: string;
  nome: string;
  concurso: string;
  cargo: string;
  regiao: string;
  horas_semanais: number;
  revisao_percentual: number;
  created_at: string;
  updated_at: string;
  disciplinas?: any[];
  progresso?: { tempo_total_segundos: number; sessoes_concluidas: number };
}

@Injectable()
export class CiclosService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createCicloDto: CreateCicloDto, userId: string): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();
    const { disciplinas, ...cicloData } = createCicloDto;

    const { data: ciclo, error } = await admin
      .from('ciclos')
      .insert({ ...cicloData, user_id: userId })
      .select()
      .single();

    if (error || !ciclo) {
      throw new Error(`Erro ao criar ciclo: ${error?.message}`);
    }

    if (disciplinas && disciplinas.length > 0) {
      const horasPorDisciplina = this.distribuirHoras(
        createCicloDto.horas_semanais,
        disciplinas,
      );
      const disciplinasComHoras = disciplinas.map((d, i) => ({
        ...d,
        ciclo_id: ciclo.id,
        horas_alocadas: horasPorDisciplina[i],
      }));

      const { error: discError } = await admin
        .from('disciplinas')
        .insert(disciplinasComHoras);

      if (discError) {
        throw new Error(`Erro ao criar disciplinas: ${discError.message}`);
      }
    }

    return this.findOne(ciclo.id, userId);
  }

  async findAllByUser(userId: string): Promise<Ciclo[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('ciclos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar ciclos: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string, userId: string): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();

    const { data: ciclo, error } = await admin
      .from('ciclos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !ciclo) {
      throw new NotFoundException(`Ciclo ${id} não encontrado`);
    }

    const { data: disciplinas } = await admin
      .from('disciplinas')
      .select('*')
      .eq('ciclo_id', id)
      .order('nome');

    const { data: sessoes } = await admin
      .from('sessoes')
      .select('tempo_percorrido, status')
      .eq('ciclo_id', id);

    const tempoTotal = (sessoes || []).reduce(
      (acc, s) => acc + (s.tempo_percorrido || 0),
      0,
    );
    const sessoesConcluidas = (sessoes || []).filter(
      (s) => s.status === 'concluida',
    ).length;

    return {
      ...ciclo,
      disciplinas: disciplinas || [],
      progresso: {
        tempo_total_segundos: tempoTotal,
        sessoes_concluidas: sessoesConcluidas,
      },
    };
  }

  async update(id: string, userId: string, updateCicloDto: UpdateCicloDto): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();
    const { disciplinas, ...cicloData } = updateCicloDto;

    const { data, error } = await admin
      .from('ciclos')
      .update({ ...cicloData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ciclo ${id} não encontrado`);
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin
      .from('ciclos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao deletar ciclo: ${error.message}`);
    }
  }

  async updateTimeDivision(
    id: string,
    userId: string,
    revisaoPercentual: number,
  ): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('ciclos')
      .update({
        revisao_percentual: revisaoPercentual,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ciclo ${id} não encontrado`);
    }

    return data;
  }

  private distribuirHoras(horasSemanais: number, disciplinas: any[]): number[] {
    const totalPeso = disciplinas.reduce((acc, d) => acc + (d.peso || 1), 0);
    return disciplinas.map((d) =>
      parseFloat(((horasSemanais * (d.peso || 1)) / totalPeso).toFixed(2)),
    );
  }
}
