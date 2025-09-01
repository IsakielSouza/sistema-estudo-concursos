# 🔑 Credenciais do Supabase - Resumo Rápido

## 📍 Onde Encontrar as Credenciais

### 1. 🌐 Acesse o Supabase
- URL: [https://supabase.com](https://supabase.com)
- Faça login na sua conta

### 2. 🏗️ Crie um Projeto
- Clique em **"New Project"**
- Nome: `sistema-estudo-concursos`
- Escolha região próxima (São Paulo)
- Crie uma senha forte para o banco

### 3. 🔑 Obtenha as Credenciais
No painel do projeto, vá em **Settings** > **API**

Você verá:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Configure o .env

Copie estas credenciais para o arquivo `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Configuration
JWT_SECRET=sua_senha_super_secreta_aqui
JWT_EXPIRES_IN=7d

# App Configuration
PORT=3000
NODE_ENV=development
APP_VERSION=1.0.0
```

## 🗄️ Execute o Schema SQL

1. Vá em **SQL Editor**
2. Clique em **"New query"**
3. Cole o conteúdo do arquivo `database/schema.sql`
4. Clique em **"Run"**

## ✅ Teste a Conexão

Após configurar, execute:

```bash
cd backend
npm run start:dev
```

Se tudo estiver correto, o servidor iniciará sem erros!

---

**⚠️ Importante**: Nunca compartilhe suas chaves secretas! 