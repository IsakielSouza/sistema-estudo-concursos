-- PARTE 4: Índices e Triggers
-- Execute isto após a PARTE 3

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_exam_type ON materials(exam_type);
CREATE INDEX IF NOT EXISTS idx_video_lessons_category ON video_lessons(category);
CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_user_id ON user_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_exam_id ON user_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_user_id ON ciclos(user_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_created_at ON ciclos(created_at);
CREATE INDEX IF NOT EXISTS idx_disciplinas_ciclo_id ON disciplinas(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_ciclo_id ON sessoes(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_disciplina_id ON sessoes(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_created_at ON sessoes(created_at);
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_status ON routines(status);
CREATE INDEX IF NOT EXISTS idx_routines_created_at ON routines(created_at);
CREATE INDEX IF NOT EXISTS idx_routine_activities_routine_id ON routine_activities(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_activities_type ON routine_activities(type);
CREATE INDEX IF NOT EXISTS idx_routine_activity_days_activity_id ON routine_activity_days(activity_id);
CREATE INDEX IF NOT EXISTS idx_routine_activity_days_day_of_week ON routine_activity_days(day_of_week);

-- TRIGGERS
CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_video_lessons_updated_at BEFORE UPDATE ON video_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_ciclos_updated_at BEFORE UPDATE ON ciclos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_disciplinas_updated_at BEFORE UPDATE ON disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_sessoes_updated_at BEFORE UPDATE ON sessoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_routines_updated_at BEFORE UPDATE ON routines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_routine_activities_updated_at BEFORE UPDATE ON routine_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
