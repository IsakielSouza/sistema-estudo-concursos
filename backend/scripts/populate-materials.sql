-- Script para popular a tabela de materiais com exemplos
-- Execute este script no SQL Editor do Supabase

-- Inserir materiais de exemplo
INSERT INTO materials (id, title, description, file_url, category, tags, author, exam_type, created_by, created_at, updated_at) VALUES
(
    uuid_generate_v4(),
    'Apostila de Direito Constitucional - Volume 1',
    'Material completo sobre Direito Constitucional, incluindo princípios fundamentais, direitos e garantias individuais, organização do Estado e Poderes da República.',
    'https://github.com/exemplo/materiais-concursos/blob/main/direito-constitucional/apostila-volume-1.pdf',
    'Direito Constitucional',
    'constitucional, direitos fundamentais, organização do estado, poderes da república',
    'Instituto de Estudos Jurídicos',
    'Policial',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Resumo de Direito Administrativo para Concursos',
    'Resumo conciso e objetivo de Direito Administrativo, focado nos principais tópicos cobrados em concursos públicos.',
    'https://github.com/exemplo/materiais-concursos/blob/main/direito-administrativo/resumo-concursos.pdf',
    'Direito Administrativo',
    'administrativo, atos administrativos, licitações, contratos administrativos',
    'Prof. Silva',
    'Fiscal',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Matemática Básica para Concursos',
    'Material de matemática básica com foco em concursos, incluindo aritmética, álgebra, geometria e estatística.',
    'https://github.com/exemplo/materiais-concursos/blob/main/matematica/matematica-basica.pdf',
    'Matemática',
    'matematica, aritmetica, algebra, geometria, estatistica',
    'Academia de Matemática',
    'Banco Central',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Português - Gramática e Interpretação de Textos',
    'Material completo de português para concursos, incluindo gramática, interpretação de textos e redação oficial.',
    'https://github.com/exemplo/materiais-concursos/blob/main/portugues/gramatica-interpretacao.pdf',
    'Português',
    'portugues, gramatica, interpretacao, redacao oficial',
    'Prof. Santos',
    'Tribunais',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Informática para Concursos - Hardware e Software',
    'Material de informática básica e avançada, incluindo hardware, software, sistemas operacionais e internet.',
    'https://github.com/exemplo/materiais-concursos/blob/main/informatica/hardware-software.pdf',
    'Informática',
    'informatica, hardware, software, sistemas operacionais, internet',
    'Tech Academy',
    'Receita Federal',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Atualidades - Política, Economia e Sociedade',
    'Material de atualidades com foco em política, economia e sociedade, atualizado para concursos recentes.',
    'https://github.com/exemplo/materiais-concursos/blob/main/atualidades/politica-economia-sociedade.pdf',
    'Atualidades',
    'atualidades, politica, economia, sociedade, noticias',
    'Centro de Estudos Atualizados',
    'INSS',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Direito Penal - Parte Geral',
    'Material de Direito Penal - Parte Geral, incluindo teoria do crime, imputabilidade e causas de exclusão.',
    'https://github.com/exemplo/materiais-concursos/blob/main/direito-penal/parte-geral.pdf',
    'Direito Penal',
    'penal, teoria do crime, imputabilidade, causas de exclusao',
    'Instituto Penal',
    'Policial',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Raciocínio Lógico - Questões Comentadas',
    'Material de raciocínio lógico com questões comentadas de concursos anteriores, incluindo lógica proposicional e argumentativa.',
    'https://github.com/exemplo/materiais-concursos/blob/main/raciocinio-logico/questoes-comentadas.pdf',
    'Raciocínio Lógico',
    'raciocinio logico, logica proposicional, argumentativa, questoes',
    'Prof. Lógica',
    'Banco do Brasil',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'História do Brasil - República',
    'Material de história do Brasil com foco no período republicano, incluindo fatos importantes e personalidades.',
    'https://github.com/exemplo/materiais-concursos/blob/main/historia/republica.pdf',
    'História',
    'historia, brasil, republica, fatos importantes, personalidades',
    'Instituto Histórico',
    'Caixa Econômica',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Geografia do Brasil - Aspectos Físicos e Humanos',
    'Material de geografia do Brasil, incluindo aspectos físicos, humanos, econômicos e regionais.',
    'https://github.com/exemplo/materiais-concursos/blob/main/geografia/aspectos-fisicos-humanos.pdf',
    'Geografia',
    'geografia, brasil, aspectos fisicos, humanos, economicos, regionais',
    'Prof. Geografia',
    'Outros',
    (SELECT id FROM users LIMIT 1),
    NOW(),
    NOW()
);

-- Verificar se os materiais foram inseridos
SELECT 
    title, 
    category, 
    exam_type, 
    author,
    created_at
FROM materials 
ORDER BY created_at DESC; 