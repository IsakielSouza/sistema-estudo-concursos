-- Script para adicionar o campo google_id à tabela users
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna google_id à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Atualizar políticas RLS para permitir inserção de usuários Google
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Comentário sobre a mudança
COMMENT ON COLUMN users.google_id IS 'ID único do Google OAuth para autenticação'; 