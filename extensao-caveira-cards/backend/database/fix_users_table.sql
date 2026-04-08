-- Script para corrigir a estrutura da tabela users
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna google_id se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Adicionar coluna role se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Criar índice para google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Remover constraint de foreign key se existir
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Recriar constraint de foreign key
ALTER TABLE users ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;

-- Atualizar políticas RLS
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Permitir inserção de usuários Google
CREATE POLICY IF NOT EXISTS "Google users can insert profile" ON users FOR INSERT WITH CHECK (google_id IS NOT NULL); 