-- Script para criar usuário padrão do sistema
-- Este usuário será usado para materiais criados via upload em lote

-- Inserir usuário padrão na tabela auth.users (via Supabase Admin)
-- Nota: Este comando deve ser executado via Supabase Dashboard ou CLI

-- Alternativa: Inserir diretamente na tabela users (se RLS permitir)
INSERT INTO users (
    id,
    email,
    name,
    avatar_url,
    google_id,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system@estudo-concursos.com',
    'Sistema de Materiais',
    NULL,
    NULL,
    NOW(),
    NOW()
);

-- Verificar se foi criado
SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000000'; 