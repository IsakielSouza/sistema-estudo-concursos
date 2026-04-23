# Backend — Ciclos de Estudo (Design Spec)

**Data:** 2026-04-22  
**Status:** Aprovado pelo usuário  
**Stack:** NestJS + JWT + Supabase (Opção A)

---

## Escopo

Implementar as 15 tarefas BACKEND do TODO.md cobrindo autenticação, usuário, ciclos de estudo, disciplinas e sessões.

## Decisões de arquitetura

- **Auth:** NestJS com JWT próprio + Supabase Auth. NextAuth descartado (duplicaria responsabilidades).
- **Banco:** Supabase (PostgreSQL). Tabelas gerenciadas via SQL no Supabase dashboard.
- **Padrão:** Módulos NestJS independentes (ciclos, disciplinas, sessoes) seguindo o padrão existente de users/materials.
- **Guard:** `JwtAuthGuard` existente aplicado a todos os endpoints protegidos.

## O que já existe (ajustes menores)

| Componente | Arquivo | Ajuste |
|---|---|---|
| Google login | `auth.service.ts` | Já implementado — sem mudança |
| Logout | `auth.controller.ts` | Implementar invalidação real (stateless — retornar 200 com instrução de remover token no client) |
| JwtAuthGuard | `auth/guards/jwt-auth.guard.ts` | Já existe — só aplicar onde falta |
| GET /users/profile/me | `users.controller.ts` | Adicionar `@UseGuards(JwtAuthGuard)` |

## Novos endpoints

### Usuário
```
GET  /api/user/me           → retorna usuário do JWT
GET  /api/user/profile      → perfil completo
PUT  /api/user/profile      → atualizar nome/foto
```

### Ciclos
```
POST /api/ciclos                        → criar ciclo (wizard)
GET  /api/ciclos                        → listar ciclos do usuário autenticado
GET  /api/ciclos/:id                    → detalhes + disciplinas + progresso
PUT  /api/ciclos/:id                    → atualizar ciclo
DELETE /api/ciclos/:id                  → remover ciclo
POST /api/ciclos/:id/time-division      → salvar configuração revisão/novo conteúdo
```

### Sessões
```
POST /api/sessoes           → iniciar sessão de estudo
GET  /api/sessoes           → listar sessões (filtro por ciclo_id)
PUT  /api/sessoes/:id       → pausar/retomar/concluir sessão
```

## Schema SQL (novas tabelas)

```sql
-- Ciclos de estudo
CREATE TABLE ciclos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(70) NOT NULL,
  concurso VARCHAR(100) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  regiao VARCHAR(100) DEFAULT 'Nacional',
  horas_semanais INTEGER NOT NULL DEFAULT 30,
  revisao_percentual INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disciplinas de um ciclo
CREATE TABLE disciplinas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ciclo_id UUID REFERENCES ciclos(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  peso INTEGER DEFAULT 1,
  nivel_usuario VARCHAR(20) DEFAULT 'medio' CHECK (nivel_usuario IN ('baixo', 'medio', 'alto')),
  horas_alocadas DECIMAL(5,2) DEFAULT 0,
  concluiu_edital BOOLEAN DEFAULT false,
  concluida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessões de estudo
CREATE TABLE sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ciclo_id UUID REFERENCES ciclos(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
  tempo_iniciado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tempo_percorrido INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Módulos NestJS a criar

```
src/
  ciclos/
    ciclos.module.ts
    ciclos.controller.ts
    ciclos.service.ts
    dto/create-ciclo.dto.ts
    dto/update-ciclo.dto.ts
    dto/time-division.dto.ts
  disciplinas/
    disciplinas.module.ts
    disciplinas.controller.ts
    disciplinas.service.ts
    dto/create-disciplina.dto.ts
    dto/update-disciplina.dto.ts
  sessoes/
    sessoes.module.ts
    sessoes.controller.ts
    sessoes.service.ts
    dto/create-sessao.dto.ts
    dto/update-sessao.dto.ts
```

## Mapeamento TODO → Implementação

| Task | O que fazer |
|---|---|
| BACKEND-1 | Flag `isGoogleInitialized` — não se aplica ao backend NestJS (frontend) |
| BACKEND-2 | Auth NestJS JWT já funciona — skip NextAuth |
| BACKEND-3 | Documentar vars no env.example (GOOGLE_CLIENT_ID etc.) |
| BACKEND-4 | `loginWithGoogle` já implementado ✅ |
| BACKEND-5 | Logout: resposta 200 + instrução client remover token |
| BACKEND-6 | Adicionar `google_id` ao schema.sql users |
| BACKEND-7 | JwtAuthGuard já existe ✅ — aplicar onde falta |
| BACKEND-8 | GET /user/me → retornar req.user do JWT |
| BACKEND-9 | GET + PUT /user/profile |
| BACKEND-10 | Módulo ciclos + tabela ciclos |
| BACKEND-11 | Módulo disciplinas + tabela disciplinas |
| BACKEND-12 | POST /api/ciclos com disciplinas no body |
| BACKEND-13 | GET /api/ciclos/:id com JOIN disciplinas + progresso calculado |
| BACKEND-14 | POST /api/ciclos/:id/time-division |
| BACKEND-15 | POST + PUT /api/sessoes |
