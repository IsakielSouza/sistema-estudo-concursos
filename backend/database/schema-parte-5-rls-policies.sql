-- PARTE 5: Row Level Security (RLS)
-- Execute isto após a PARTE 4

-- HABILITAR RLS
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
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_activity_days ENABLE ROW LEVEL SECURITY;

-- POLICIES - USERS
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- POLICIES - MATERIALS
CREATE POLICY "Materials are viewable by everyone" ON materials FOR SELECT USING (true);
CREATE POLICY "Only creators can insert materials" ON materials FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Only creators can update materials" ON materials FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Only creators can delete materials" ON materials FOR DELETE USING (auth.uid() = created_by);

-- POLICIES - VIDEO_LESSONS
CREATE POLICY "Video lessons are viewable by everyone" ON video_lessons FOR SELECT USING (true);
CREATE POLICY "Only creators can insert video lessons" ON video_lessons FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Only creators can update video lessons" ON video_lessons FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Only creators can delete video lessons" ON video_lessons FOR DELETE USING (auth.uid() = created_by);

-- POLICIES - EXAMS
CREATE POLICY "Exams are viewable by everyone" ON exams FOR SELECT USING (true);
CREATE POLICY "Only creators can insert exams" ON exams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Only creators can update exams" ON exams FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Only creators can delete exams" ON exams FOR DELETE USING (auth.uid() = created_by);

-- POLICIES - QUESTIONS
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

-- POLICIES - ALTERNATIVES
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

-- POLICIES - USER_EXAM_ATTEMPTS
CREATE POLICY "Users can view their own exam attempts" ON user_exam_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exam attempts" ON user_exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exam attempts" ON user_exam_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exam attempts" ON user_exam_attempts FOR DELETE USING (auth.uid() = user_id);

-- POLICIES - USER_ANSWERS
CREATE POLICY "Users can view their own answers" ON user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own answers" ON user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own answers" ON user_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own answers" ON user_answers FOR DELETE USING (auth.uid() = user_id);

-- POLICIES - USER_PROGRESS
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON user_progress FOR DELETE USING (auth.uid() = user_id);

-- POLICIES - FAVORITES
CREATE POLICY "Users can view their own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- POLICIES - TAGS
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Tags are insertable by everyone" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Tags are updatable by everyone" ON tags FOR UPDATE USING (true);
CREATE POLICY "Tags are deletable by everyone" ON tags FOR DELETE USING (true);

-- POLICIES - MATERIAL_TAGS
CREATE POLICY "Material tags are viewable by everyone" ON material_tags FOR SELECT USING (true);
CREATE POLICY "Material tags are insertable by everyone" ON material_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Material tags are deletable by everyone" ON material_tags FOR DELETE USING (true);

-- POLICIES - CICLOS
CREATE POLICY "Users can view their own ciclos" ON ciclos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ciclos" ON ciclos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ciclos" ON ciclos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ciclos" ON ciclos FOR DELETE USING (auth.uid() = user_id);

-- POLICIES - DISCIPLINAS
CREATE POLICY "Users can view disciplinas of their ciclos" ON disciplinas FOR SELECT USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can insert disciplinas in their ciclos" ON disciplinas FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can update disciplinas in their ciclos" ON disciplinas FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can delete disciplinas in their ciclos" ON disciplinas FOR DELETE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);

-- POLICIES - SESSOES
CREATE POLICY "Users can view sessoes of their ciclos" ON sessoes FOR SELECT USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can insert sessoes in their ciclos" ON sessoes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can update sessoes in their ciclos" ON sessoes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can delete sessoes in their ciclos" ON sessoes FOR DELETE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);

-- POLICIES - ROUTINES
CREATE POLICY "Users can view their own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines" ON routines FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines" ON routines FOR DELETE USING (auth.uid() = user_id);

-- POLICIES - ROUTINE_ACTIVITIES
CREATE POLICY "Users can view activities of their routines" ON routine_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can insert activities in their routines" ON routine_activities FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can update activities in their routines" ON routine_activities FOR UPDATE USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can delete activities in their routines" ON routine_activities FOR DELETE USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_activities.routine_id AND routines.user_id = auth.uid())
);

-- POLICIES - ROUTINE_ACTIVITY_DAYS
CREATE POLICY "Users can view activity days of their routines" ON routine_activity_days FOR SELECT USING (
    EXISTS (SELECT 1 FROM routine_activities ra JOIN routines r ON ra.routine_id = r.id WHERE ra.id = routine_activity_days.activity_id AND r.user_id = auth.uid())
);
CREATE POLICY "Users can insert activity days in their routines" ON routine_activity_days FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM routine_activities ra JOIN routines r ON ra.routine_id = r.id WHERE ra.id = routine_activity_days.activity_id AND r.user_id = auth.uid())
);
CREATE POLICY "Users can delete activity days in their routines" ON routine_activity_days FOR DELETE USING (
    EXISTS (SELECT 1 FROM routine_activities ra JOIN routines r ON ra.routine_id = r.id WHERE ra.id = routine_activity_days.activity_id AND r.user_id = auth.uid())
);
