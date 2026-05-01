-- Schema do banco de dados para Sistema de Estudo para Concursos Públicos
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (perfil estendido)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de materiais
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT,
    author VARCHAR(255),
    exam_type VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de videoaulas
CREATE TABLE IF NOT EXISTS video_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    youtube_url TEXT NOT NULL,
    duration INTEGER, -- duração em segundos
    category VARCHAR(100) NOT NULL,
    tags TEXT,
    exam_type VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de simulados
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- duração em minutos
    total_questions INTEGER NOT NULL,
    passing_score INTEGER NOT NULL, -- pontuação mínima para aprovação
    category VARCHAR(100) NOT NULL,
    exam_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de questões
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points INTEGER DEFAULT 1,
    correct_answer TEXT,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alternativas (para questões de múltipla escolha)
CREATE TABLE IF NOT EXISTS alternatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    alternative_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tentativas de simulados
CREATE TABLE IF NOT EXISTS user_exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    score INTEGER,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    wrong_answers INTEGER NOT NULL,
    time_taken INTEGER, -- tempo em segundos
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas dos usuários
CREATE TABLE IF NOT EXISTS user_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exam_attempt_id UUID REFERENCES user_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer TEXT,
    is_correct BOOLEAN,
    time_taken INTEGER, -- tempo em segundos para responder
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de progresso dos usuários
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    last_studied TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Tabela de favoritos
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    video_lesson_id UUID REFERENCES video_lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, material_id),
    UNIQUE(user_id, video_lesson_id),
    CHECK (
        (material_id IS NOT NULL AND video_lesson_id IS NULL) OR
        (material_id IS NULL AND video_lesson_id IS NOT NULL)
    )
);

-- Tabela de tags
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- cor em hex
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento materiais-tags
CREATE TABLE IF NOT EXISTS material_tags (
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, tag_id)
);

-- =============================================
-- MÓDULO: CICLOS DE ESTUDO
-- =============================================

-- Tabela de ciclos de estudo
CREATE TABLE IF NOT EXISTS ciclos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(70) NOT NULL,
    concurso VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    regiao VARCHAR(100) DEFAULT 'Nacional',
    horas_semanais INTEGER NOT NULL DEFAULT 30 CHECK (horas_semanais BETWEEN 1 AND 168),
    revisao_percentual INTEGER DEFAULT 50 CHECK (revisao_percentual BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de disciplinas de um ciclo
CREATE TABLE IF NOT EXISTS disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciclo_id UUID REFERENCES ciclos(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    peso INTEGER DEFAULT 1 CHECK (peso BETWEEN 1 AND 10),
    nivel_usuario VARCHAR(20) DEFAULT 'medio' CHECK (nivel_usuario IN ('baixo', 'medio', 'alto')),
    horas_alocadas DECIMAL(6,2) DEFAULT 0,
    concluiu_edital BOOLEAN DEFAULT false,
    concluida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de estudo
CREATE TABLE IF NOT EXISTS sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciclo_id UUID REFERENCES ciclos(id) ON DELETE CASCADE NOT NULL,
    disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
    tempo_iniciado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tempo_percorrido INTEGER DEFAULT 0 CHECK (tempo_percorrido >= 0),
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
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

-- Índices para ciclos
CREATE INDEX IF NOT EXISTS idx_ciclos_user_id ON ciclos(user_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_created_at ON ciclos(created_at);

-- Índices para disciplinas
CREATE INDEX IF NOT EXISTS idx_disciplinas_ciclo_id ON disciplinas(ciclo_id);

-- Índices para sessoes
CREATE INDEX IF NOT EXISTS idx_sessoes_ciclo_id ON sessoes(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_disciplina_id ON sessoes(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_created_at ON sessoes(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_lessons_updated_at BEFORE UPDATE ON video_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ciclos_updated_at BEFORE UPDATE ON ciclos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessoes_updated_at BEFORE UPDATE ON sessoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Políticas para materiais (públicos para leitura, apenas criador pode editar)
CREATE POLICY "Materials are viewable by everyone" ON materials FOR SELECT USING (true);
CREATE POLICY "Only creators can insert materials" ON materials FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Only creators can update materials" ON materials FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Only creators can delete materials" ON materials FOR DELETE USING (auth.uid() = created_by);

-- Políticas para videoaulas (públicas para leitura, apenas criador pode editar)
CREATE POLICY "Video lessons are viewable by everyone" ON video_lessons FOR SELECT USING (true);
CREATE POLICY "Only creators can insert video lessons" ON video_lessons FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Only creators can update video lessons" ON video_lessons FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Only creators can delete video lessons" ON video_lessons FOR DELETE USING (auth.uid() = created_by);

-- Políticas para simulados (públicos para leitura, apenas criador pode editar)
CREATE POLICY "Exams are viewable by everyone" ON exams FOR SELECT USING (true);
CREATE POLICY "Only creators can insert exams" ON exams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Only creators can update exams" ON exams FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Only creators can delete exams" ON exams FOR DELETE USING (auth.uid() = created_by);

-- Políticas para questões (públicas para leitura, apenas criador pode editar)
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);
CREATE POLICY "Only exam creators can insert questions" ON questions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND created_by = auth.uid())
);
CREATE POLICY "Only exam creators can update questions" ON questions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND created_by = auth.uid())
);
CREATE POLICY "Only exam creators can delete questions" ON questions FOR DELETE USING (
    EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND created_by = auth.uid())
);

-- Políticas para alternativas (públicas para leitura, apenas criador pode editar)
CREATE POLICY "Alternatives are viewable by everyone" ON alternatives FOR SELECT USING (true);
CREATE POLICY "Only question creators can insert alternatives" ON alternatives FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM questions q JOIN exams e ON q.exam_id = e.id WHERE q.id = question_id AND e.created_by = auth.uid())
);
CREATE POLICY "Only question creators can update alternatives" ON alternatives FOR UPDATE USING (
    EXISTS (SELECT 1 FROM questions q JOIN exams e ON q.exam_id = e.id WHERE q.id = question_id AND e.created_by = auth.uid())
);
CREATE POLICY "Only question creators can delete alternatives" ON alternatives FOR DELETE USING (
    EXISTS (SELECT 1 FROM questions q JOIN exams e ON q.exam_id = e.id WHERE q.id = question_id AND e.created_by = auth.uid())
);

-- Políticas para tentativas de simulados (apenas o próprio usuário)
CREATE POLICY "Users can view their own exam attempts" ON user_exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exam attempts" ON user_exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exam attempts" ON user_exam_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exam attempts" ON user_exam_attempts FOR DELETE USING (auth.uid() = user_id);

-- Políticas para respostas dos usuários (apenas o próprio usuário)
CREATE POLICY "Users can view their own answers" ON user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own answers" ON user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own answers" ON user_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON user_answers FOR DELETE USING (auth.uid() = user_id);

-- Políticas para progresso dos usuários (apenas o próprio usuário)
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON user_progress FOR DELETE USING (auth.uid() = user_id);

-- Políticas para favoritos (apenas o próprio usuário)
CREATE POLICY "Users can view their own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tags (públicas)
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Tags are insertable by everyone" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Tags are updatable by everyone" ON tags FOR UPDATE USING (true);
CREATE POLICY "Tags are deletable by everyone" ON tags FOR DELETE USING (true);

-- Políticas para material_tags (públicas)
CREATE POLICY "Material tags are viewable by everyone" ON material_tags FOR SELECT USING (true);
CREATE POLICY "Material tags are insertable by everyone" ON material_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Material tags are deletable by everyone" ON material_tags FOR DELETE USING (true);

-- RLS para ciclos
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own ciclos" ON ciclos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ciclos" ON ciclos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ciclos" ON ciclos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ciclos" ON ciclos FOR DELETE USING (auth.uid() = user_id);

-- RLS para disciplinas
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view disciplinas of their ciclos" ON disciplinas FOR SELECT USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can insert disciplinas in their ciclos" ON disciplinas FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can update disciplinas in their ciclos" ON disciplinas FOR UPDATE
    USING (EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid()));
CREATE POLICY "Users can delete disciplinas in their ciclos" ON disciplinas FOR DELETE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);

-- RLS para sessoes
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sessoes of their ciclos" ON sessoes FOR SELECT USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can insert sessoes in their ciclos" ON sessoes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can update sessoes in their ciclos" ON sessoes FOR UPDATE
    USING (EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid()));

CREATE POLICY "Users can delete sessoes in their ciclos" ON sessoes FOR DELETE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);

-- =============================================
-- MÓDULO: ROTINAS (Estudos Agendados)
-- =============================================

-- Tabela de rotinas
CREATE TABLE IF NOT EXISTS routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'scheduled')),
    weekly_hour_limit INTEGER DEFAULT 40 CHECK (weekly_hour_limit > 0),
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atividades de rotina
CREATE TABLE IF NOT EXISTS routine_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type VARCHAR(20) DEFAULT 'study' CHECK (type IN ('study', 'other')),
    recurrence_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dias de recorrência das atividades
CREATE TABLE IF NOT EXISTS routine_activity_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES routine_activities(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, day_of_week)
);

-- Índices para rotinas
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_status ON routines(status);
CREATE INDEX IF NOT EXISTS idx_routines_created_at ON routines(created_at);

-- Índices para atividades de rotina
CREATE INDEX IF NOT EXISTS idx_routine_activities_routine_id ON routine_activities(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_activities_type ON routine_activities(type);

-- Índices para dias de atividade
CREATE INDEX IF NOT EXISTS idx_routine_activity_days_activity_id ON routine_activity_days(activity_id);
CREATE INDEX IF NOT EXISTS idx_routine_activity_days_day_of_week ON routine_activity_days(day_of_week);

-- Triggers para atualizar updated_at em rotinas
CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON routines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routine_activities_updated_at BEFORE UPDATE ON routine_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para rotinas
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines" ON routines FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines" ON routines FOR DELETE USING (auth.uid() = user_id);

-- RLS para atividades de rotina
ALTER TABLE routine_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view activities of their routines" ON routine_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can insert activities in their routines" ON routine_activities FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can update activities in their routines" ON routine_activities FOR UPDATE
    USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid()));
CREATE POLICY "Users can delete activities in their routines" ON routine_activities FOR DELETE USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
);

-- RLS para dias de atividade
ALTER TABLE routine_activity_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view activity days of their routines" ON routine_activity_days FOR SELECT USING (
    EXISTS (SELECT 1 FROM routine_activities ra JOIN routines r ON ra.routine_id = r.id WHERE ra.id = routine_activity_days.activity_id AND r.user_id = auth.uid())
);
CREATE POLICY "Users can insert activity days in their routines" ON routine_activity_days FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM routine_activities ra JOIN routines r ON ra.routine_id = r.id WHERE ra.id = routine_activity_days.activity_id AND r.user_id = auth.uid())
);
CREATE POLICY "Users can delete activity days in their routines" ON routine_activity_days FOR DELETE USING (
    EXISTS (SELECT 1 FROM routine_activities ra JOIN routines r ON ra.routine_id = r.id WHERE ra.id = routine_activity_days.activity_id AND r.user_id = auth.uid())
);

-- Inserir algumas tags padrão
INSERT INTO tags (name, color) VALUES
    ('Direito Constitucional', '#EF4444'),
    ('Direito Administrativo', '#F59E0B'),
    ('Direito Penal', '#10B981'),
    ('Direito Civil', '#3B82F6'),
    ('Direito Processual', '#8B5CF6'),
    ('Matemática', '#EC4899'),
    ('Português', '#06B6D4'),
    ('Informática', '#84CC16'),
    ('Atualidades', '#F97316')
ON CONFLICT (name) DO NOTHING;