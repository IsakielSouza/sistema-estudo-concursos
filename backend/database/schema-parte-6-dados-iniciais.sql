-- PARTE 6: Dados Iniciais
-- Execute isto após a PARTE 5 (dados padrão)

-- Inserir tags padrão
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
