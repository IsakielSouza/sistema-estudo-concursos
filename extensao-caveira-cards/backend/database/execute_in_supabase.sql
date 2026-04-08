-- Execute este script no SQL Editor do Supabase
-- Este script corrige a estrutura da tabela users para funcionar com Google OAuth

-- 1. Adicionar coluna google_id se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- 2. Remover constraint de foreign key problemática
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. Recriar constraint mais flexível
ALTER TABLE users ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;

-- 4. Remover políticas existentes
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Google users can insert profile" ON users;

-- 5. Criar nova política que permite inserção de usuários Google
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id OR google_id IS NOT NULL);

-- 6. Verificar se a estrutura está correta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 