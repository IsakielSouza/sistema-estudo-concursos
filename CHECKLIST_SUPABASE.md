# ✅ Checklist: Ativar Supabase - Passo a Passo

## 📋 Situação Atual (2026-05-01)

✅ **Backend (NestJS)**
- Servidor rodando em http://localhost:3001
- Supabase Service configurado e testado
- Swagger Docs disponível em http://localhost:3001/docs
- Todas as rotas de API documentadas

✅ **Frontend (Next.js)**
- Servidor rodando em http://localhost:3000
- Variáveis de ambiente configuradas (.env.local)
- API Client pronto (axios com interceptors)
- UI totalmente funcional

✅ **Supabase**
- Projeto criado: `roryqqqhqtgzszvqydjd`
- Credenciais no backend/.env
- PostgreSQL pronto para receber schema

❌ **Banco de Dados**
- **Tabelas não criadas ainda** ← PRÓXIMO PASSO

---

## 🎯 PASSO 1: Aplicar Schema SQL (5-10 minutos)

### 1.1 Acesse Supabase
```
1. Abra https://app.supabase.com
2. Faça login com seu email
3. Clique no projeto: "roryqqqhqtgzszvqydjd" (ou rory...)
```

### 1.2 Abra SQL Editor
```
1. No menu esquerdo, clique em "SQL Editor"
2. Clique em "+ New query" ou "New"
3. Uma aba branca aparecerá
```

### 1.3 Cole o SQL
```
1. Abra o arquivo: backend/database/schema.sql
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole na aba do SQL Editor (Ctrl+V)
```

### 1.4 Execute
```
1. Clique no botão ▶ (Play) ou pressione Cmd+Enter
2. Aguarde 5-10 segundos
3. Você deve ver: "Success" ou "Query executed successfully"
```

### ✅ Sucesso!
Se vir mensagens como:
```
CREATE EXTENSION
CREATE TABLE
CREATE INDEX
CREATE POLICY
```

Todas as 24 tabelas foram criadas com sucesso!

---

## 🧪 PASSO 2: Verificar Tabelas Criadas (1 minuto)

### No Supabase Console:
```
1. Vá em "Database" no menu esquerdo
2. Expandir "Schemas" > "public"
3. Você deve ver todas estas tabelas:
   - users
   - materials
   - video_lessons
   - exams
   - questions
   - alternatives
   - user_exam_attempts
   - user_answers
   - user_progress
   - favorites
   - tags
   - material_tags
   - ciclos ← Estudo por ciclos
   - disciplinas
   - sessoes ← Sessões de estudo
   - routines ← Rotinas de horários
   - routine_activities
   - routine_activity_days
```

---

## 🔐 PASSO 3: Verificar RLS (Row Level Security) (1 minuto)

### No Supabase Console:
```
1. Clique em qualquer tabela (ex: "routines")
2. Vá na aba "RLS" (Row Level Security)
3. Você deve ver várias POLICIES criadas
4. Exemplo: "Users can view their own routines"
```

**Isso garante segurança!** Usuários só veem seus próprios dados.

---

## 🧬 PASSO 4: Testar Autenticação (3-5 minutos)

### 4.1 Abra o Frontend
```
http://localhost:3000
```

### 4.2 Tente um fluxo de Login
```
1. Procure por página de login
2. Teste com Google OAuth OU
3. Registre um novo usuário com email/senha
```

### 4.3 Verifique no Console
```
1. Volte ao Supabase Console
2. Vá em "Authentication" > "Users"
3. Você deve ver o usuário criado lá!
```

---

## 🚀 PASSO 5: Testar API (2-3 minutos)

### 5.1 Abra Swagger Docs
```
http://localhost:3001/docs
```

### 5.2 Teste Criar uma Rotina
```
1. Procure por "routines" no Swagger
2. Expanda "POST /routines"
3. Clique em "Try it out"
4. Preencha com:
   {
     "name": "Rotina Matutina",
     "status": "inactive",
     "weekly_hour_limit": 40
   }
5. Clique "Execute"
6. Se receber 201 com dados retornados = Sucesso!
```

### 5.3 Verifique no Banco
```
1. No Supabase, vá em "Table Editor"
2. Selecione tabela "routines"
3. Você deve ver a rotina criada!
```

---

## 🎬 PASSO 6: Fluxo Completo (3-5 minutos)

### 6.1 No Frontend
```
1. Faça login / Registre
2. Navegue até criar uma Rotina
3. Preencha os dados
4. Clique em Salvar
5. A rotina deve aparecer na lista
```

### 6.2 No Browser DevTools
```
1. Abra F12 (Developer Tools)
2. Vá em "Network"
3. Crie uma nova rotina
4. Você deve ver:
   POST /api/v1/routines → 201
   GET /api/v1/routines → 200
```

### 6.3 No Supabase
```
1. Vá em "Table Editor" > "routines"
2. Sua rotina está lá!
3. Verifique o user_id (deve ser seu UUID)
```

---

## ✨ PASSO 7: Teste de Segurança RLS (2-3 minutos)

**Verifica que RLS está funcionando!**

### 7.1 No Supabase SQL Editor
```sql
-- Teste 1: Ver apenas suas próprias rotinas
SELECT * FROM routines LIMIT 1;
-- Deve retornar apenas suas rotinas

-- Teste 2: Dados de outro usuário são bloqueados
-- (RLS impede automaticamente)
```

### 7.2 No Frontend
```
Como usuário A:
- Você vê suas rotinas ✓
- Não consegue ver rotinas de usuário B ✓

Como usuário B:
- Você vê suas rotinas ✓
- Não consegue ver rotinas de usuário A ✓
```

---

## 🎉 Status Final

| Componente | Status | URL |
|-----------|--------|-----|
| Backend | ✅ Rodando | http://localhost:3001 |
| Frontend | ✅ Rodando | http://localhost:3000 |
| Swagger Docs | ✅ Pronto | http://localhost:3001/docs |
| Banco Dados | ⏳ Aguarda Schema | Supabase Console |
| Autenticação | ⏳ Após Schema | Google OAuth + Email/Senha |
| RLS Policies | ⏳ Após Schema | Automático (schema.sql) |

---

## 🚨 Se Algo Deu Errado

### Erro: "Table already exists"
- Schema já foi aplicado antes
- Use novo banco ou delete e recrie (Settings > Danger Zone)

### Erro: "Permission denied"
- Você tem permissão no Supabase?
- Verifique se está usando service_role key para criar tabelas

### Erro: "Syntax error"
- Alguma linha do SQL está quebrada
- Tente quebrar em partes menores
- Execute CREATE TABLE por CREATE TABLE

### Servidor Backend deu erro
- Reinicie: `npm run start:dev`
- Verifique se porta 3001 está livre: `lsof -i :3001`

### Servidor Frontend deu erro
- Reinicie: `npm run dev`
- Limpe cache: `rm -rf .next && npm run dev`

---

## 📝 Próximas Tarefas Após Sucesso

- [ ] Implementar notificações em tempo real
- [ ] Adicionar upload de arquivos (Storage)
- [ ] Configurar email de confirmação
- [ ] Implementar dark mode toggle
- [ ] Adicionar testes e2e

---

## ✅ RESUMO

**O que você precisa fazer:**

1. ✂️ Copiar `/backend/database/schema.sql`
2. 📝 Colar no SQL Editor do Supabase
3. ▶️ Clicar em "Run"
4. 🎉 Pronto! Sistema totalmente funcional

**Tempo estimado: 15 minutos**

---

*Documentação criada: 2026-05-01*
*Status: Aguardando aplicação do schema SQL*
