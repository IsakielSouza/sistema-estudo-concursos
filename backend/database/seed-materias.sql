-- Seed: Matérias PRF e PF
-- Execute uma única vez no Supabase

-- Matéria compartilhada
INSERT INTO materias (nome, descricao, horas_padrao, peso_padrao) VALUES
('Estudo Livre', 'Estudo de tópicos adicionais e revisão', 0, 1)
ON CONFLICT (nome) DO NOTHING;

-- Matérias PRF
INSERT INTO materias (nome, descricao, horas_padrao, peso_padrao) VALUES
('Legislação de Trânsito', 'Código de Trânsito Brasileiro (CTB)', 11.5, 5),
('Português', 'Interpretação, gramática, ortografia, concordância', 7, 4),
('Informática', 'Windows, Pacote Office, Internet, segurança', 2.5, 2),
('Raciocínio Lógico-Matemático', 'Porcentagem, proporção, probabilidade, estatística', 2.5, 2),
('Direito Constitucional', 'Direitos fundamentais, administração pública', 2.5, 2),
('Direito Administrativo', 'Atos administrativos, poderes, licitações', 2.5, 2),
('Direito Penal', 'Parte geral, crimes contra administração, crimes de trânsito', 2.5, 2),
('Legislação da PRF', 'Leis e regulamentos específicos da PRF', 3, 2),
('Direitos Humanos', 'Direitos fundamentais, tratados internacionais', 1, 1),
('Física', 'Movimento, velocidade, aceleração, energia', 1, 1),
('Geopolítica Brasileira', 'Segurança pública, fronteiras, atualidades', 1, 1)
ON CONFLICT (nome) DO NOTHING;

-- Matérias PF
INSERT INTO materias (nome, descricao, horas_padrao, peso_padrao) VALUES
('Direito Processual Penal', 'Inquérito policial, ação penal, prisões, provas', 2.5, 2),
('Legislação Especial', 'Lei de Drogas, Desarmamento, Lavagem de Dinheiro', 2.5, 2),
('Criminologia', 'Conceitos, teorias do crime, vitimologia', 1, 1),
('Medicina Legal', 'Perícias, lesões corporais, morte', 1, 1),
('Estatística', 'Média, moda, mediana, probabilidade, distribuições', 2, 2),
('Contabilidade Básica', 'Conceitos básicos, patrimônio, balanço', 1, 1)
ON CONFLICT (nome) DO NOTHING;

-- Relacionamentos PRF
INSERT INTO edital_materia (concurso, materia_id, ordem, horas_recomendadas, peso_sugerido, obrigatoria)
SELECT 'PRF', m.id,
    CASE m.nome
        WHEN 'Legislação de Trânsito' THEN 1
        WHEN 'Português' THEN 2
        WHEN 'Informática' THEN 3
        WHEN 'Raciocínio Lógico-Matemático' THEN 4
        WHEN 'Direito Constitucional' THEN 5
        WHEN 'Direito Administrativo' THEN 6
        WHEN 'Direito Penal' THEN 7
        WHEN 'Legislação da PRF' THEN 8
        WHEN 'Direitos Humanos' THEN 9
        WHEN 'Física' THEN 10
        WHEN 'Geopolítica Brasileira' THEN 11
        WHEN 'Estudo Livre' THEN 12
        ELSE 99
    END,
    m.horas_padrao,
    m.peso_padrao,
    true
FROM materias m
WHERE m.nome IN (
    'Legislação de Trânsito', 'Português', 'Informática', 'Raciocínio Lógico-Matemático',
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal', 'Legislação da PRF',
    'Direitos Humanos', 'Física', 'Geopolítica Brasileira', 'Estudo Livre'
)
ON CONFLICT (concurso, materia_id) DO NOTHING;

-- Relacionamentos PF
INSERT INTO edital_materia (concurso, materia_id, ordem, horas_recomendadas, peso_sugerido, obrigatoria)
SELECT 'PF', m.id,
    CASE m.nome
        WHEN 'Português' THEN 1
        WHEN 'Raciocínio Lógico-Matemático' THEN 2
        WHEN 'Informática' THEN 3
        WHEN 'Direito Constitucional' THEN 4
        WHEN 'Direito Administrativo' THEN 5
        WHEN 'Direito Penal' THEN 6
        WHEN 'Direito Processual Penal' THEN 7
        WHEN 'Legislação Especial' THEN 8
        WHEN 'Direitos Humanos' THEN 9
        WHEN 'Criminologia' THEN 10
        WHEN 'Medicina Legal' THEN 11
        WHEN 'Estatística' THEN 12
        WHEN 'Estudo Livre' THEN 13
        ELSE 99
    END,
    m.horas_padrao,
    m.peso_padrao,
    true
FROM materias m
WHERE m.nome IN (
    'Português', 'Raciocínio Lógico-Matemático', 'Informática', 'Direito Constitucional',
    'Direito Administrativo', 'Direito Penal', 'Direito Processual Penal', 'Legislação Especial',
    'Direitos Humanos', 'Criminologia', 'Medicina Legal', 'Estatística', 'Estudo Livre'
)
ON CONFLICT (concurso, materia_id) DO NOTHING;
