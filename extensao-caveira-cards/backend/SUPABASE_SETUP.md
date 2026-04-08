# 🔧 Configuração do Supabase - Guia Completo

## 📋 Passo a Passo para Configurar o Supabase

### 1. 🚀 Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project" ou "Sign Up"
3. Faça login com GitHub, Google ou email
4. Clique em "New Project"
5. Preencha as informações:
   - **Organization**: Selecione sua organização
   - **Name**: `sistema-estudo-concursos`
   - **Database Password**: Crie uma senha forte (guarde-a!)@Isakiel2025
   - **Region**: Escolha a região mais próxima (ex: São Paulo)
6. Clique em "Create new project"
7. Aguarde a criação (pode levar alguns minutos)

### 2. 📊 Configurar Banco de Dados

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **"New query"**
3. Copie e cole todo o conteúdo do arquivo `database/schema.sql`
4. Clique em **"Run"** para executar o script
5. Aguarde a execução (pode levar alguns segundos)

### 3. 🔑 Obter Credenciais da API

1. No painel do Supabase, vá para **Settings** (ícone de engrenagem)
2. Clique em **"API"** no menu lateral
3. Você verá duas seções importantes:

#### 🔐 Project API keys
- **anon public**: Esta é sua `SUPABASE_ANON_KEY`
- **service_role secret**: Esta é sua `SUPABASE_SERVICE_ROLE_KEY`

#### 🌐 Project URL
- **Project URL**: Esta é sua `SUPABASE_URL`

### 4. ⚙️ Configurar Autenticação

1. No painel do Supabase, vá para **Authentication**
2. Clique em **"Settings"**
3. Configure as opções:

#### 📧 Email Auth
- ✅ **Enable email confirmations**: Desmarque (para desenvolvimento)
- ✅ **Enable email change confirmations**: Desmarque (para desenvolvimento)
- ✅ **Enable secure email change**: Desmarque (para desenvolvimento)

#### 🔐 JWT Settings
- **JWT Expiry**: `604800` (7 dias em segundos)
- **Refresh Token Rotation**: Ative se quiser

### 5. 🛡️ Configurar Políticas de Segurança (RLS)

As políticas já estão configuradas no schema.sql, mas você pode verificar:

1. Vá para **Authentication** > **Policies**
2. Verifique se as políticas foram criadas para cada tabela
3. Se não foram criadas, execute novamente o schema.sql

### 6. 📝 Configurar Variáveis de Ambiente

1. No seu projeto, copie o arquivo `env.example`:
```bash
cp env.example .env
```

2. Edite o arquivo `.env` com suas credenciais:
```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# JWT Configuration
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# App Configuration
PORT=3000
NODE_ENV=development
APP_VERSION=1.0.0

# Mobile App Configuration (V2)
MOBILE_API_KEY=seu_mobile_api_key_aqui
MOBILE_RATE_LIMIT=100
```

### 7. 🔍 Verificar Configuração

1. Execute o script SQL novamente para garantir que tudo foi criado
2. Verifique se as tabelas foram criadas em **Table Editor**
3. Teste a conexão executando o projeto

## 📊 Estrutura das Tabelas Criadas

Após executar o schema.sql, você terá as seguintes tabelas:

### 👥 Tabelas Principais
- `users` - Usuários do sistema
- `materials` - Materiais de estudo
- `video_lessons` - Videoaulas
- `exams` - Simulados
- `questions` - Questões
- `alternatives` - Alternativas das questões

### 📈 Tabelas de Dados
- `user_exam_attempts` - Tentativas de simulados
- `user_answers` - Respostas dos usuários
- `user_progress` - Progresso dos usuários
- `favorites` - Favoritos
- `tags` - Tags para categorização
- `material_tags` - Relacionamento materiais-tags

## 🔐 Políticas de Segurança (RLS)

O sistema implementa Row Level Security com as seguintes políticas:

### 👤 Usuários
- Usuários podem ver e editar apenas seu próprio perfil

### 📚 Materiais
- Todos podem visualizar materiais
- Apenas criadores podem editar/deletar

### 🎥 Videoaulas
- Todos podem visualizar videoaulas
- Apenas criadores podem editar/deletar

### 📝 Simulados
- Todos podem visualizar simulados
- Apenas criadores podem editar/deletar

### 📊 Dados Pessoais
- Usuários podem ver apenas seus próprios dados
- Tentativas de simulados, respostas, progresso, etc.

## 🚨 Problemas Comuns e Soluções

### ❌ Erro: "Invalid API key"
- Verifique se copiou a chave correta
- Certifique-se de que não há espaços extras

### ❌ Erro: "Connection failed"
- Verifique se a URL está correta
- Certifique-se de que o projeto está ativo

### ❌ Erro: "Table not found"
- Execute novamente o schema.sql
- Verifique se não há erros no script

### ❌ Erro: "RLS policy violation"
- Verifique se as políticas foram criadas
- Execute novamente o schema.sql

## 🔧 Configurações Adicionais

### 📧 Configurar Email (Opcional)
1. Vá para **Authentication** > **Settings**
2. Configure SMTP para envio de emails
3. Ative confirmação de email se necessário

### 🔔 Configurar Webhooks (V2)
1. Vá para **Database** > **Webhooks**
2. Configure webhooks para eventos específicos

### 📊 Configurar Analytics (V2)
1. Vá para **Analytics**
2. Configure métricas de uso

## ✅ Checklist de Verificação

- [ ] Projeto criado no Supabase
- [ ] Schema SQL executado com sucesso
- [ ] Credenciais copiadas corretamente
- [ ] Arquivo .env configurado
- [ ] Autenticação configurada
- [ ] Políticas RLS ativas
- [ ] Tabelas criadas corretamente
- [ ] Tags padrão inseridas
- [ ] Projeto testado localmente

## 📞 Suporte

Se encontrar problemas:

1. **Documentação oficial**: [https://supabase.com/docs](https://supabase.com/docs)
2. **Discord**: [https://discord.supabase.com](https://discord.supabase.com)
3. **GitHub Issues**: [https://github.com/supabase/supabase](https://github.com/supabase/supabase)

---

**Status**: ✅ Configuração completa  
**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024 