-- Script simples para corrigir RLS
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna google_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Remover todas as políticas de inserção existentes
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Google users can insert profile" ON users;

-- Criar política única que permite inserção de usuários Google
CREATE POLICY "Allow user insertion" ON users FOR INSERT WITH CHECK (true);

-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users'; 