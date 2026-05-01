# 🗄️ Aplicar Schema SQL - Versão em Partes

Como o arquivo original estava causando erro de sintaxe, dividi em **6 partes pequenas** que são muito mais fáceis de aplicar.

---

## ✅ Passo a Passo

### 1️⃣ PARTE 1: Setup Básico (30 segundos)

**Arquivo**: `backend/database/schema-parte-1-setup.sql`

1. Abra https://app.supabase.com
2. Vá em **SQL Editor** > **New Query**
3. Copie TODO o conteúdo de `schema-parte-1-setup.sql`
4. Cole na aba do Supabase
5. Clique em **"Run"** (ou Cmd+Enter)
6. Aguarde ✓ Success

---

### 2️⃣ PARTE 2: Tabelas Base (1 minuto)

**Arquivo**: `backend/database/schema-parte-2-tabelas-base.sql`

1. Crie uma nova query no SQL Editor
2. Copie TODO o conteúdo de `schema-parte-2-tabelas-base.sql`
3. Cole no Supabase
4. Clique em **"Run"**
5. Aguarde ✓ Success

**O que foi criado:**
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

---

### 3️⃣ PARTE 3: Ciclos, Disciplinas, Sessões e Rotinas (1 minuto)

**Arquivo**: `backend/database/schema-parte-3-ciclos-rotinas.sql`

1. Crie uma nova query
2. Copie TODO o conteúdo de `schema-parte-3-ciclos-rotinas.sql`
3. Cole e **Run**

**O que foi criado:**
- ciclos
- disciplinas
- sessoes
- routines
- routine_activities
- routine_activity_days

---

### 4️⃣ PARTE 4: Índices e Triggers (1-2 minutos)

**Arquivo**: `backend/database/schema-parte-4-indices-triggers.sql`

1. Crie uma nova query
2. Copie TODO o conteúdo de `schema-parte-4-indices-triggers.sql`
3. Cole e **Run**

**O que foi criado:**
- ✓ 24 índices para performance
- ✓ 11 triggers para atualizar `updated_at`

---

### 5️⃣ PARTE 5: Row Level Security (RLS) (2-3 minutos)

**Arquivo**: `backend/database/schema-parte-5-rls-policies.sql`

1. Crie uma nova query
2. Copie TODO o conteúdo de `schema-parte-5-rls-policies.sql`
3. Cole e **Run**

**O que foi criado:**
- ✓ RLS habilitado para todas as 18 tabelas
- ✓ 50+ políticas de segurança
  - Usuários só veem seus próprios dados
  - Apenas criador pode editar material
  - etc.

---

### 6️⃣ PARTE 6: Dados Iniciais (30 segundos)

**Arquivo**: `backend/database/schema-parte-6-dados-iniciais.sql`

1. Crie uma nova query
2. Copie TODO o conteúdo de `schema-parte-6-dados-iniciais.sql`
3. Cole e **Run**

**O que foi criado:**
- ✓ 9 tags padrão (Direito Constitucional, etc.)

---

## ✨ Pronto!

Ao final das 6 partes, seu banco estará 100% configurado com:
- ✓ 18 tabelas
- ✓ 24 índices
- ✓ 11 triggers
- ✓ 50+ políticas RLS
- ✓ 9 tags padrão

**Tempo total estimado:** 5-7 minutos

---

## 🧪 Teste Rápido

Após aplicar todas as partes, no Supabase SQL Editor execute:

```sql
-- Ver todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver algo como:
```
alternatives
ciclos
disciplinas
exams
favorites
material_tags
materials
questions
routines
routine_activities
routine_activity_days
sessoes
tags
user_answers
user_exam_attempts
user_progress
users
video_lessons
```

---

## 🚨 Se Algo Deu Errado

### Erro: "already exists"
- Significa que aquela parte já foi aplicada
- Pule para a próxima parte

### Erro: "relation does not exist"
- Significa que a parte anterior ainda não foi executada
- Volte e execute a parte anterior

### Erro de sintaxe
- Não copie e cole pela metade
- Copie TODO o arquivo inteiro
- Garanta que não há quebras de linha extras

---

## 📋 Checklist Final

- [ ] PARTE 1 aplicada ✓
- [ ] PARTE 2 aplicada ✓
- [ ] PARTE 3 aplicada ✓
- [ ] PARTE 4 aplicada ✓
- [ ] PARTE 5 aplicada ✓
- [ ] PARTE 6 aplicada ✓

Após todas, teste o login no frontend e tudo deve funcionar!

---

**Criado:** 2026-05-01  
**Razão:** Erro de sintaxe no schema.sql original foi corrigido dividindo em partes
