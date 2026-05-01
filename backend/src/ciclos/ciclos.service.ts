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

  async getMateriasTemplate(concurso: string): Promise<any[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('edital_materia')
      .select(`
        id,
        materia_id,
        ordem,
        horas_recomendadas,
        peso_sugerido,
        obrigatoria,
        materias(
          id,
          nome,
          descricao,
          horas_padrao,
          peso_padrao
        )
      `)
      .eq('concurso', concurso)
      .order('ordem');

    if (error) {
      throw new Error(`Erro ao buscar matérias: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      id: item.materias.id,
      nome: item.materias.nome,
      descricao: item.materias.descricao,
      horas_recomendadas: item.horas_recomendadas || item.materias.horas_padrao,
      peso_sugerido: item.peso_sugerido || item.materias.peso_padrao,
      obrigatoria: item.obrigatoria,
    }));
  }

  async createDisciplina(cicloId: string, userId: string, createDisciplinaDto: any): Promise<any> {
    const admin = this.supabaseService.getAdminClient();

    // Verify user owns the cycle
    const { data: ciclo, error: cicloError } = await admin
      .from('ciclos')
      .select('id')
      .eq('id', cicloId)
      .eq('user_id', userId)
      .single();

    if (cicloError || !ciclo) {
      throw new NotFoundException(`Ciclo ${cicloId} não encontrado`);
    }

    // Check for duplicate discipline name in cycle
    const { data: existingDisciplina } = await admin
      .from('disciplinas')
      .select('id')
      .eq('ciclo_id', cicloId)
      .eq('nome', createDisciplinaDto.nome)
      .single();

    if (existingDisciplina) {
      throw new Error('Disciplina com este nome já existe neste ciclo');
    }

    const { data: disciplina, error } = await admin
      .from('disciplinas')
      .insert({
        ciclo_id: cicloId,
        nome: createDisciplinaDto.nome,
        peso: createDisciplinaDto.peso || 5,
        nivel_usuario: createDisciplinaDto.nivel_usuario || 'medio',
        concluiu_edital: createDisciplinaDto.concluiu_edital || false,
        horas_alocadas: 0,
        concluida: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar disciplina: ${error.message}`);
    }

    return disciplina;
  }

  async updateDisciplina(cicloId: string, userId: string, disciplinaId: string, updateDisciplinaDto: any): Promise<any> {
    const admin = this.supabaseService.getAdminClient();

    // Verify user owns the cycle
    const { data: ciclo, error: cicloError } = await admin
      .from('ciclos')
      .select('id')
      .eq('id', cicloId)
      .eq('user_id', userId)
      .single();

    if (cicloError || !ciclo) {
      throw new NotFoundException(`Ciclo ${cicloId} não encontrado`);
    }

    // Check if discipline exists in this cycle
    const { data: disciplina, error: discError } = await admin
      .from('disciplinas')
      .select('id')
      .eq('id', disciplinaId)
      .eq('ciclo_id', cicloId)
      .single();

    if (discError || !disciplina) {
      throw new NotFoundException(`Disciplina ${disciplinaId} não encontrada`);
    }

    const { data: updated, error } = await admin
      .from('disciplinas')
      .update({
        ...updateDisciplinaDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', disciplinaId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar disciplina: ${error.message}`);
    }

    return updated;
  }

  async deleteDisciplina(cicloId: string, userId: string, disciplinaId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    // Verify user owns the cycle
    const { data: ciclo, error: cicloError } = await admin
      .from('ciclos')
      .select('id')
      .eq('id', cicloId)
      .eq('user_id', userId)
      .single();

    if (cicloError || !ciclo) {
      throw new NotFoundException(`Ciclo ${cicloId} não encontrado`);
    }

    const { error } = await admin
      .from('disciplinas')
      .delete()
      .eq('id', disciplinaId)
      .eq('ciclo_id', cicloId);

    if (error) {
      throw new Error(`Erro ao deletar disciplina: ${error.message}`);
    }
  }

  async completeDisciplina(cicloId: string, userId: string, disciplinaId: string): Promise<any> {
    const admin = this.supabaseService.getAdminClient();

    // Verify user owns the cycle
    const { data: ciclo, error: cicloError } = await admin
      .from('ciclos')
      .select('id')
      .eq('id', cicloId)
      .eq('user_id', userId)
      .single();

    if (cicloError || !ciclo) {
      throw new NotFoundException(`Ciclo ${cicloId} não encontrado`);
    }

    const { data: updated, error } = await admin
      .from('disciplinas')
      .update({
        concluida: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', disciplinaId)
      .eq('ciclo_id', cicloId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao marcar disciplina como completa: ${error.message}`);
    }

    return updated;
  }

  private distribuirHoras(horasSemanais: number, disciplinas: any[]): number[] {
    const totalPeso = disciplinas.reduce((acc, d) => acc + (d.peso || 1), 0);
    return disciplinas.map((d) =>
      parseFloat(((horasSemanais * (d.peso || 1)) / totalPeso).toFixed(2)),
    );
  }
}
