import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

export interface RoutineActivity {
  id: string;
  routine_id: string;
  name: string;
  start_time: string;
  end_time: string;
  type: 'study' | 'other';
  recurrence_enabled: boolean;
  days?: number[];
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'inactive' | 'scheduled';
  weekly_hour_limit: number;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
  activities?: RoutineActivity[];
}

@Injectable()
export class RoutinesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createRoutineDto: CreateRoutineDto, userId: string): Promise<Routine> {
    const admin = this.supabaseService.getAdminClient();

    const { activities, ...routineData } = createRoutineDto;

    const { data: routine, error } = await admin
      .from('routines')
      .insert({
        ...routineData,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !routine) {
      throw new BadRequestException(`Erro ao criar rotina: ${error?.message}`);
    }

    if (activities && activities.length > 0) {
      for (const activity of activities) {
        await this.createActivity(routine.id, activity, userId);
      }
    }

    return this.findOne(routine.id, userId);
  }

  async findAllByUser(userId: string): Promise<Routine[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data: routines, error } = await admin
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Erro ao buscar rotinas: ${error.message}`);
    }

    const routinesWithActivities = await Promise.all(
      (routines || []).map(async (routine) => {
        const activities = await this.getActivitiesByRoutineId(routine.id);
        return { ...routine, activities };
      }),
    );

    return routinesWithActivities;
  }

  async findOne(id: string, userId: string): Promise<Routine> {
    const admin = this.supabaseService.getAdminClient();

    const { data: routine, error } = await admin
      .from('routines')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !routine) {
      throw new NotFoundException(`Rotina não encontrada: ${id}`);
    }

    const activities = await this.getActivitiesByRoutineId(routine.id);

    return {
      ...routine,
      activities,
    };
  }

  async update(id: string, updateRoutineDto: UpdateRoutineDto, userId: string): Promise<Routine> {
    const admin = this.supabaseService.getAdminClient();

    // Verificar se rotina pertence ao usuário
    await this.findOne(id, userId);

    const { activities, ...routineData } = updateRoutineDto;

    const { data: updated, error } = await admin
      .from('routines')
      .update(routineData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !updated) {
      throw new BadRequestException(`Erro ao atualizar rotina: ${error?.message}`);
    }

    // Se atividades foram fornecidas, deletar antigas e criar novas
    if (activities) {
      await admin.from('routine_activities').delete().eq('routine_id', id);

      for (const activity of activities) {
        await this.createActivity(id, activity, userId);
      }
    }

    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    // Verificar se rotina pertence ao usuário
    await this.findOne(id, userId);

    const { error } = await admin.from('routines').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      throw new BadRequestException(`Erro ao deletar rotina: ${error.message}`);
    }
  }

  async updateStatus(
    id: string,
    status: 'active' | 'inactive' | 'scheduled',
    userId: string,
  ): Promise<Routine> {
    const admin = this.supabaseService.getAdminClient();

    // Se ativando, desativar outras rotinas ativas
    if (status === 'active') {
      await admin
        .from('routines')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('status', 'active');
    }

    const { data: updated, error } = await admin
      .from('routines')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !updated) {
      throw new BadRequestException(`Erro ao atualizar status: ${error?.message}`);
    }

    return this.findOne(id, userId);
  }

  async getCurrentActiveRoutine(userId: string): Promise<Routine | null> {
    const admin = this.supabaseService.getAdminClient();

    const { data: routine } = await admin
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!routine) {
      return null;
    }

    const activities = await this.getActivitiesByRoutineId(routine.id);
    return { ...routine, activities };
  }

  // ===== Métodos privados =====

  private async createActivity(
    routineId: string,
    activity: CreateActivityDto,
    userId: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    this.validateActivityTimes(activity.start_time, activity.end_time);

    // Verificar overlapping
    await this.checkOverlap(routineId, activity.start_time, activity.end_time, null);

    const { data: createdActivity, error } = await admin
      .from('routine_activities')
      .insert({
        routine_id: routineId,
        name: activity.name,
        start_time: activity.start_time,
        end_time: activity.end_time,
        type: activity.type || 'study',
        recurrence_enabled: activity.recurrence_enabled || false,
      })
      .select()
      .single();

    if (error || !createdActivity) {
      throw new BadRequestException(`Erro ao criar atividade: ${error?.message}`);
    }

    // Adicionar dias da semana se fornecidos
    if (activity.days && activity.days.length > 0) {
      const daysData = activity.days.map((day) => ({
        activity_id: createdActivity.id,
        day_of_week: day,
      }));

      const { error: daysError } = await admin
        .from('routine_activity_days')
        .insert(daysData);

      if (daysError) {
        throw new BadRequestException(`Erro ao adicionar dias: ${daysError.message}`);
      }
    }
  }

  private async getActivitiesByRoutineId(routineId: string): Promise<RoutineActivity[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data: activities, error } = await admin
      .from('routine_activities')
      .select('*')
      .eq('routine_id', routineId)
      .order('start_time', { ascending: true });

    if (error) {
      throw new BadRequestException(`Erro ao buscar atividades: ${error.message}`);
    }

    const activitiesWithDays = await Promise.all(
      (activities || []).map(async (activity) => {
        const { data: days } = await admin
          .from('routine_activity_days')
          .select('day_of_week')
          .eq('activity_id', activity.id);

        return {
          ...activity,
          days: days?.map((d) => d.day_of_week) || [],
        };
      }),
    );

    return activitiesWithDays;
  }

  private validateActivityTimes(startTime: string, endTime: string): void {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (end <= start) {
      throw new BadRequestException('Horário de fim deve ser depois do início');
    }
  }

  private async checkOverlap(
    routineId: string,
    startTime: string,
    endTime: string,
    excludeActivityId?: string,
  ): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    const { data: activities, error } = await admin
      .from('routine_activities')
      .select('*')
      .eq('routine_id', routineId);

    if (error) {
      throw new BadRequestException(`Erro ao verificar overlapping: ${error.message}`);
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    for (const activity of activities || []) {
      if (excludeActivityId && activity.id === excludeActivityId) {
        continue;
      }

      const existingStart = new Date(`2000-01-01T${activity.start_time}`);
      const existingEnd = new Date(`2000-01-01T${activity.end_time}`);

      // Verificar se há sobreposição
      if (start < existingEnd && end > existingStart) {
        throw new BadRequestException(
          `Atividade sobrepõe com "${activity.name}" (${activity.start_time} - ${activity.end_time})`,
        );
      }
    }
  }
}
