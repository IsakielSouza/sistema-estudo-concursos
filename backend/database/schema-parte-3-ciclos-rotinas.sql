-- PARTE 3: Ciclos, Disciplinas, Sessões e Rotinas
-- Execute isto após a PARTE 2

-- CICLOS E DISCIPLINAS
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

-- ROTINAS
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

CREATE TABLE IF NOT EXISTS routine_activity_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES routine_activities(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, day_of_week)
);
