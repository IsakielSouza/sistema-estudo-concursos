-- Script simples para corrigir a tabela users
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna google_id se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Remover constraint de foreign key problemática
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Recriar constraint mais flexível
ALTER TABLE users ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;

-- Atualizar políticas RLS
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id OR google_id IS NOT NULL); 