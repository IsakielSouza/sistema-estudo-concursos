# Sistema de Controle de Estudos para Concursos — Design Spec

**Data:** 2026-03-21
**Projeto:** sistema-estudo-concursos
**Plataforma:** React Native + Expo (bare workflow)
**Status:** Aprovado pelo usuário

---

## 1. Visão Geral

Aplicativo mobile para controle e planejamento de estudos para concursos públicos (foco inicial: PRF). O app sincroniza com uma planilha Google Sheets (modelo existente do usuário) que serve como banco de dados vivo. O usuário organiza matérias em ciclos semanais, acompanha o progresso por tópico, recebe recomendações diárias e registra sessões de estudo com cronômetro.

---

## 2. Arquitetura Geral

### Stack
- **Expo SDK 54**, bare workflow (`expo run:android` / `expo run:ios`)
- **Expo Router v6** com rotas `(public)` / `(private)`
- **Padrão MVVM** — `Screen.view.tsx` + `useScreen.viewModel.ts`
- **Zustand v5** + AsyncStorage para estado global persistido
- **expo-sqlite** para banco de dados local
- **TanStack Query v5** para cache e queries assíncronas
- **Biome** para lint/format, **PNPM**, **TypeScript strict**
- **React Native Reanimated ~3** (mesma versão do projeto de referência memory-game)

### Projetos de referência
- `react-native-memory-game`: padrão MVVM, módulo de animações, Zustand stores, Reanimated 3
- `react-native-marketplace-app`: camada `queries/`, `shared/hooks/`, `shared/interfaces/http/`, `react-hook-form + yup`, `@gorhom/bottom-sheet`

### Fluxo de dados
```
Google Sheets API
      ↕  (sync no login + ao finalizar sessão)
   SQLite local
      ↕
  Zustand stores + TanStack Query
      ↕
  Views / ViewModels
```

---

## 3. Estrutura de Pastas

```
src/
├── app/                          # Expo Router
│   ├── (public)/
│   │   └── login.tsx
│   └── (private)/
│       ├── (tabs)/
│       │   ├── home.tsx
│       │   ├── cycle.tsx
│       │   └── _layout.tsx
│       ├── subject/[id].tsx
│       ├── session.tsx
│       ├── history.tsx
│       ├── backup.tsx
│       ├── settings.tsx
│       └── _layout.tsx           # Drawer layout
│
├── screens/                      # MVVM (padrão memory-game)
│   ├── Home/
│   │   ├── Home.view.tsx
│   │   ├── useHome.viewModel.ts
│   │   └── components/
│   ├── Cycle/
│   ├── Subject/
│   ├── Session/
│   ├── History/
│   ├── Backup/
│   ├── Settings/
│   └── Login/
│
├── shared/
│   ├── api/
│   │   ├── sheets.client.ts      # Axios client Google Sheets API
│   │   └── drive.client.ts       # Axios client Google Drive API (backup)
│   │
│   ├── queries/                  # TanStack Query por domínio
│   │   ├── sheets/
│   │   │   ├── use-sync-sheets.mutation.ts
│   │   │   └── use-get-spreadsheet.query.ts
│   │   ├── subjects/
│   │   │   ├── use-get-subjects.query.ts
│   │   │   ├── use-get-cycle-subjects.query.ts   # subjects do ciclo ativo
│   │   │   └── use-update-topic-status.mutation.ts
│   │   ├── cycles/
│   │   │   └── use-create-cycle.mutation.ts      # cria ciclo + aloca horas
│   │   └── sessions/
│   │       └── use-save-session.mutation.ts
│   │
│   ├── services/
│   │   ├── sync.service.ts           # Sheets ↔ SQLite diff/merge
│   │   ├── recommendation.service.ts # Algoritmo de recomendação
│   │   ├── cycle.service.ts          # Cálculo de horas por ciclo
│   │   ├── timer.service.ts          # Cronômetro baseado em wall-clock
│   │   ├── sheets.service.ts         # Leitura/escrita na planilha
│   │   └── backup.service.ts         # SQLite → Google Drive
│   │
│   ├── database/
│   │   ├── database.ts
│   │   ├── migrations/
│   │   └── repositories/
│   │       ├── subject.repository.ts
│   │       ├── topic.repository.ts
│   │       ├── session.repository.ts
│   │       └── cycle.repository.ts
│   │
│   ├── hooks/
│   │   ├── useTimer.ts
│   │   ├── useBackgroundTask.ts
│   │   └── useGoogleAuth.ts
│   │
│   ├── stores/
│   │   ├── auth.store.ts          # { user, spreadsheet_id, google_access_token, google_refresh_token }
│   │   ├── cycle.store.ts         # { active_cycle_id, active_concurso_id }
│   │   ├── session.store.ts       # { session_start_timestamp, paused_at, paused_total_ms, active_cycle_subject_id, is_running }
│   │   └── settings.store.ts      # { auto_backup_enabled }
│   │
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── sheets-response.ts
│   │   │   ├── drive-response.ts
│   │   │   └── sync-payload.ts
│   │   ├── subject.ts
│   │   ├── topic.ts
│   │   ├── session.ts
│   │   └── cycle.ts
│   │
│   ├── components/
│   │   ├── AppText/
│   │   ├── AppButton/
│   │   ├── ProgressBar/
│   │   └── TimerDisplay/
│   │
│   ├── helpers/
│   │   ├── recommendation.helper.ts
│   │   └── time.helper.ts
│   │
│   └── schemas/
│       ├── cycle.schema.ts        # react-hook-form schema para novo ciclo
│       └── session.schema.ts      # react-hook-form schema para sessão
│
├── animations/
│   ├── hooks/
│   └── config/
│
└── constants/
    └── colors.ts
```

---

## 4. Modelo de Dados (SQLite)

### concursos
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| name | TEXT | Ex: "PRF 2025" |
| target_date | TEXT | Data prevista do concurso |
| is_active | INTEGER DEFAULT 0 | 1 = concurso ativo no momento. Apenas um ativo por vez. Também armazenado em `cycle.store.active_concurso_id` para acesso rápido. |

### subjects
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| concurso_id | TEXT FK | |
| name | TEXT | Ex: "Legislação de Trânsito" |
| points | INTEGER | Peso na prova (ex: 30) |
| experience | INTEGER | Nível do usuário 1–5 |
| cycle_status | TEXT | `active` / `revision` |
| is_slow_build | INTEGER DEFAULT 0 | 1 = matéria de construção lenta (ex: Português, RLM) |
| is_free_study | INTEGER DEFAULT 0 | 1 = Estudo Livre — sem peso proporcional, ~3h/semana fixas |
| created_at | TEXT | |

**Regras:**
- `cycle_status = 'revision'` → matéria concluiu o edital, permanece no ciclo com 50% das horas. **Nunca é removida do ciclo.**
- `cycle_status = 'active'` → horas cheias no ciclo.
- `is_slow_build = 1` → Português e RLM por padrão. Ganham prioridade adicional nas primeiras 2 semanas de cada ciclo (ver seção 7.2). Usuário pode editar.
- `is_free_study = 1` → disciplina "Estudo Livre". Sempre presente em todo ciclo. A hora semanal dela (~3h) é lida de `cycle_subjects.allocated_hours` onde `is_free_study = 1`, não como constante hardcoded. Não pode ser removida da seleção de matérias de um ciclo.

### topics
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| subject_id | TEXT FK | |
| code | TEXT | Ex: "1.2.3" |
| title | TEXT | Ex: "Concordância verbal e nominal" |
| level | INTEGER | 0 = matéria-raiz, 1 = tópico, 2 = subtópico |
| order | INTEGER | Posição de exibição (preserva a ordem da planilha) |
| status | TEXT | `pending` / `done` |
| is_dirty | INTEGER DEFAULT 0 | 1 = alterado localmente enquanto offline, aguardando sync |
| local_updated_at | TEXT | Timestamp da última alteração local |

**Nota sobre sync offline:** Se o usuário altera um tópico offline (`is_dirty = 1`), o `sync.service.ts` usa `local_updated_at` para comparar com o timestamp da planilha. Se o registro local for mais recente que o último sync, a alteração local prevalece. Caso contrário, a planilha prevalece. Após sync bem-sucedido, `is_dirty` é zerado.

### cycles
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| concurso_id | TEXT FK | |
| name | TEXT | Nome do ciclo |
| cycle_number | INTEGER | Número sequencial do ciclo (1, 2, 3...) — não representa semana calendário |
| planned_hours | REAL | Horas que o usuário comprometeu para este ciclo |
| completed_hours | REAL | Horas efetivamente estudadas (atualizado ao final de cada sessão) |
| started_at | TEXT | |
| ended_at | TEXT | NULL se ainda ativo |
| status | TEXT | `active` / `completed` / `late` |

**Regras:**
- `status = 'late'` → passaram 7 dias desde `started_at` sem encerramento.
- O campo `planned_hours` vem da entrada do usuário na tela de novo ciclo, com sugestão preenchida (futuramente pelo MCP Google Calendar).
- Apenas um ciclo com `status = 'active'` por concurso por vez.
- `cycle_number` é ordinal sequencial, sem relação com semanas calendário.

### cycle_subjects
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| cycle_id | TEXT FK | |
| subject_id | TEXT FK | |
| allocated_hours | REAL | Calculado pelo `cycle.service.ts` na criação do ciclo |
| completed_hours | REAL | Acumulado das sessões. Atualizado por `use-save-session.mutation.ts` ao finalizar cada sessão (segundos → horas: `study_seconds / 3600`). |

### study_sessions
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| cycle_subject_id | TEXT FK | |
| subject_id | TEXT FK | Desnormalizado para preservar contexto mesmo se o ciclo for arquivado |
| started_at | TEXT | |
| ended_at | TEXT | |
| study_seconds | INTEGER NOT NULL DEFAULT 0 | Tempo de estudo puro |
| review_seconds | INTEGER NOT NULL DEFAULT 0 | Tempo de revisão. 0 quando toggle de revisão está desativado. |
| paused_seconds | INTEGER NOT NULL DEFAULT 0 | Tempo em pausa |

**Conversão de unidades:** `study_sessions` armazena em segundos. `cycle_subjects.completed_hours` é atualizado em horas (`study_seconds / 3600`) pelo `use-save-session.mutation.ts` imediatamente após salvar a sessão. Este campo acumula o total do **ciclo inteiro** — não é resetado por semana.

### sync_log
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| synced_at | TEXT | |
| spreadsheet_id | TEXT | ID da planilha no Google |
| status | TEXT | `success` / `error` |
| changes_count | INTEGER | Nº de registros alterados |

---

## 5. Navegação

### Estrutura
```
(public)
  └── /login → Google OAuth → [setup planilha se 1º acesso] → sync → home

(private)
  ├── Drawer (lateral)
  │     ├── Perfil (nome + foto Google)
  │     ├── Histórico → /history
  │     ├── Backup → /backup
  │     ├── Configurações → /settings     ← entrada principal para /settings
  │     └── Sair (logout)
  │
  └── Tab Bar: Home | Ciclo
        ├── (tabs)/home     → Dashboard + recomendação do dia
        └── (tabs)/cycle    → Ciclo ativo + gerenciar matérias

  Stacks (navegação em pilha a partir das tabs):
  ├── /subject/[id]   → Tópicos, progresso, toggle revisão
  └── /session        → Cronômetro de sessão
```

### Primeiro acesso — ordem de operações
1. Login Google OAuth concluído
2. Verificar se `auth.store.spreadsheet_id` está preenchido
3. **Se não** → modal bloqueante: inserir link ou navegar Drive para selecionar planilha → definir `spreadsheet_id` → só então disparar sync
4. **Se sim** → disparar sync imediatamente → ir para home

**Primeiro sync (sync_log vazio):** quando não há registros em `sync_log`, todos os tópicos têm `is_dirty = 0` e `local_updated_at = NULL`. Neste caso, a planilha sempre prevalece — o app importa o estado completo do Sheets sem comparar datas.

---

## 6. Fluxo de Telas

### /login
- Botão "Entrar com Google"
- OAuth via `expo-auth-session`
- Tokens armazenados em `auth.store`
- Após auth: verificar `spreadsheet_id` (ver seção 5, primeiro acesso)

### (tabs)/home — Dashboard
- Saudação + data
- **Recomendação de hoje**: lista de matérias com tempo sugerido (ver seção 7.2)
  - Badge `construção lenta` para `is_slow_build` nas primeiras 2 semanas do ciclo
  - Badge `revisão` para matérias em `cycle_status = 'revision'`
  - Quando não há histórico suficiente, exibe déficit semanal em vez de estimativa de conclusão
- **Progresso do ciclo ativo**: `completed_hours / planned_hours` com barra visual
- **Status do ciclo**: `Em dia` / `Atrasado` / `Concluído`
- Botão "Iniciar Sessão" → /session

### (tabs)/cycle — Ciclo
- Ciclo ativo: nome, ciclo #N, progresso geral
- Cards de matérias com horas alocadas vs. concluídas
- FAB "Novo Ciclo" → `@gorhom/bottom-sheet` com `react-hook-form`:
  - Campo: nome do ciclo
  - Campo: horas disponíveis/semana (editável, sugestão futura via MCP Calendar)
  - Seleção de matérias (`is_slow_build` destacadas com aviso: *"Matéria de construção lenta — recomendamos priorizar nas primeiras semanas"*)
  - "Estudo Livre" sempre visível e não removível
  - Ao confirmar: `use-create-cycle.mutation.ts` → `cycle.service.ts` calcula `allocated_hours` → persiste `cycle` + `cycle_subjects`
- Toque em matéria → /subject/[id]

### /subject/[id]
- Nome, pontos (peso), experiência (1–5 estrelas), `cycle_status`
- Toggle "Concluiu o edital?" → modal de confirmação: *"Matéria entrará em modo revisão com 50% das horas. Permanecerá no ciclo."* → muda `cycle_status` para `revision`
- Barra de progresso dos tópicos (% done)
- Lista hierárquica de tópicos/subtópicos ordenada por `topics.order`, com checkbox FEITO/PENDENTE
- Alterações locais: `is_dirty = 1`, `local_updated_at = now()`
- Sync ao sair da tela: `use-update-topic-status.mutation.ts` escreve no Sheets os tópicos com `is_dirty = 1` e zerá a flag

### /session
- Seleção de matéria: usa `use-get-cycle-subjects.query.ts` — retorna `{ subject_id, name, allocated_hours, completed_hours, cycle_subject_id }` das matérias do ciclo ativo
- Toggle: "Incluir revisão?" (padrão: ativado — 1/3 do tempo programado como revisão)
  - Se desativado: `review_seconds = 0`
- Cronômetro: play / pause / encerrar
- Display: tempo de estudo | tempo de revisão | total
- **Mecanismo de timer:** ao pressionar play, salva `session_start_timestamp` no `session.store`. O timer é calculado como `Date.now() - session_start_timestamp`, ajustando por tempo de pausas acumuladas. Isso garante precisão mesmo com app em background ou tela de bloqueio — não depende de tick contínuo.
- **Background + tela de bloqueio:** `expo-task-manager` registra uma tarefa que, ao ser chamada, lê o `session_start_timestamp` do store e atualiza a notificação. `expo-notifications` exibe notificação persistente com tempo decorrido e botões play/pause. Permissão solicitada na primeira sessão.
- Ao finalizar: salva `study_session` no SQLite → atualiza `cycle_subjects.completed_hours` → sync planilha → backup automático se habilitado

### /history (via Drawer)
- Lista de sessões por data
- Totais: horas por matéria, por semana (ISO calendar week), por ciclo
- Taxa de cumprimento por ciclo: `completed_hours / planned_hours`

### /backup (via Drawer)
- Status do último backup (data/hora)
- Botão "Fazer backup agora" → `backup.service.ts`:
  - `expo-file-system` lê o arquivo `.db` do SQLite
  - `drive.client.ts` faz upload para `AppData/sistema-estudo-concursos/backups/`
  - Nome: `backup-YYYY-MM-DD-HHmm.db`
- Botão "Restaurar backup" → lista arquivos do Drive → seleciona → download → substitui `.db` local → reinicia stores Zustand
- Toggle "Backup automático" → persiste em `settings.store.auto_backup_enabled`

### /settings (via Drawer)
- Conta Google conectada
- Link da planilha: lê/escreve `auth.store.spreadsheet_id`
- Botão "Sincronizar agora" → `use-sync-sheets.mutation.ts`
- Preferências de notificação

---

## 7. Algoritmo de Recomendação e Cálculo de Ciclo

### 7.1 Alocação de horas por matéria (cycle.service.ts)

```
Entrada: planned_hours, cycle_subjects[]

1. free_study_hours = allocated_hours do subject onde is_free_study = 1
   (valor definido pelo usuário ao criar o ciclo, padrão = 3h)

2. study_pool = planned_hours - free_study_hours

3. effective_points[i] (excluindo o Estudo Livre):
   - cycle_status = 'revision' → points[i] × 0.5
   - cycle_status = 'active'   → points[i]

4. total_points = Σ effective_points

5. allocated_hours[i] = (effective_points[i] / total_points) × study_pool
```

As horas liberadas pelas matérias em revisão são automaticamente redistribuídas proporcionalmente entre matérias ativas (denominador `total_points` menor).

O "Estudo Livre" é tratado separadamente: sua `allocated_hours` é o valor que o usuário definiu ao criar o ciclo (padrão 3h), e nunca entra no cálculo proporcional. É obrigatório em todo ciclo e não pode ser removido da seleção.

### 7.2 Recomendação diária (recommendation.service.ts)

```
Entrada:
  cycle_subjects[]: { subject, allocated_hours, completed_hours }
    ← `completed_hours` = total acumulado do ciclo (de `cycle_subjects.completed_hours`)
  days_elapsed_in_cycle: INTEGER
    ← calculado no ViewModel da Home como `differenceInDays(new Date(), cycle.started_at)`
    ← `cycle.started_at` obtido via `cycle.store.active_cycle_id` + repository call

Parâmetro de entrada do usuário (Home screen):
  day_available_hours: REAL
  ← em v1: campo editável na Home com valor padrão = planned_hours / 7
  ← em v2 (futuro): sugerido pelo MCP Google Calendar

Cálculo de `completed_hours_this_week` (feito dentro do `recommendation.service.ts`):
  Consulta `study_sessions` agrupando por ISO week (usando `date-fns/getISOWeek`),
  filtrando pela semana corrente. Retorna soma de `study_seconds / 3600` por `subject_id`.

1. deficit[i] = allocated_hours[i] - completed_hours_this_week[i]
   (completed_hours_this_week calculado conforme acima)

2. Multiplicador slow_build:
   Se is_slow_build = 1 E days_elapsed_in_cycle ≤ 14:
     deficit[i] × 1.3

3. Filtrar apenas subjects com deficit[i] > 0
   Ordenar por deficit decrescente

4. Distribuir day_available_hours entre TODAS as matérias com deficit > 0,
   proporcionalmente ao seu deficit, sem ultrapassar o deficit individual de cada uma.
   (N = todas com deficit positivo)

Saída: [{ subject, suggested_minutes, priority_badge }]
  priority_badge: 'slow_build' | 'revision' | null
  suggested_minutes: arredondado para múltiplos de 5
```

**Fallback sem histórico suficiente:** Se não houver sessões registradas (`completed_hours_this_week = 0` para todas), exibe o déficit semanal cheio por matéria sem estimativa de conclusão em semanas. A estimativa de conclusão em semanas só é exibida após pelo menos 1 ciclo completo registrado.

### 7.3 Estimativa de semanas para fechar o edital

```
Por matéria (exibido no dashboard):
  done_ratio = done_topics / total_topics
  taxa_semanal = média de tópicos concluídos por semana ISO nos últimos ciclos

  Se taxa_semanal = 0 (sem histórico) → não exibe estimativa
  Caso contrário:
    estimated_weeks = (total_topics - done_topics) / taxa_semanal
    Exibido: "~N semanas para fechar [Matéria]"
```

### 7.4 Controle de ciclo

- Cada ciclo tem `cycle_number` sequencial (ordinal, sem relação com semanas calendário)
- Ciclos são idealmente semanais, mas não há encerramento automático obrigatório
- Após 7 dias desde `started_at` sem encerramento: `status = 'late'`
- Dashboard exibe taxa de cumprimento: `completed_hours / planned_hours`
- "Semana do ciclo" em algoritmos = `days elapsed since started_at / 7` (não ISO week number)

---

## 8. Google Sheets — Estrutura Esperada da Planilha

A planilha segue o modelo "Edital Interativo - PRF.xlsx" existente:

- **Colunas por linha de tópico**: Código | Título | STATUS (FEITO/PENDENTE)
- **Células de resumo por matéria**: TOTAL | FEITO | PENDENTE | %FEITO | BARRA DE PROGRESSO

### Sincronização (sync.service.ts)

1. **Login (após spreadsheet_id confirmado)** → lê toda a planilha, compara com SQLite local:
   - Tópico sem `is_dirty`: planilha prevalece
   - Tópico com `is_dirty = 1`: compara `local_updated_at` com `sync_log.synced_at` → se local mais recente, local prevalece; senão planilha prevalece
   - Após merge: `is_dirty = 0` em todos os tópicos
2. **Ao finalizar sessão + ao sair de /subject/[id]** → escreve status dos tópicos com `is_dirty = 1` de volta na planilha
3. `sync_log` registra cada operação

### OAuth scopes necessários
```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.appdata
```

- `spreadsheets` → leitura e escrita da planilha do usuário
- `drive.appdata` → upload/download de backups em pasta privada do app no Drive

---

## 9. Timer e Background

- **Foreground**: `useTimer` hook lê `session.store.session_start_timestamp` e calcula `elapsed = Date.now() - start - paused_ms`. Display animado via Reanimated 3.
- **Mecanismo de precisão:** o timer não usa tick contínuo. Usa wall-clock diff: `started_at` salvo no store, `paused_at` salvo ao pausar, `paused_total_ms` acumulado. Ao retornar do background, o elapsed é recalculado instantaneamente sem perda de tempo.
- **Background:** `expo-task-manager` registra task `STUDY_TIMER_TASK`. A task lê `session_start_timestamp` do AsyncStorage e atualiza a notificação com o elapsed calculado.
- **Tela de bloqueio:** `expo-notifications` exibe notificação persistente com tempo decorrido e ações "Pausar" / "Retomar". Permissão solicitada na primeira sessão de estudos.
- `expo-background-fetch` **não é utilizado** para o timer (inadequado para contagem contínua). Pode ser considerado futuramente para sync periódico em background.

---

## 10. Backup — Google Drive

- Usa a mesma conta Google autenticada (scope `drive.appdata` — sem segundo login)
- `expo-file-system` lê o arquivo `.db` do SQLite local
- `drive.client.ts` faz upload via `https://www.googleapis.com/upload/drive/v3/files` para pasta `AppData/sistema-estudo-concursos/backups/`
- Nome do arquivo: `backup-YYYY-MM-DD-HHmm.db`
- Restauração: download via Drive API → `expo-file-system` substitui arquivo local → reinicia stores Zustand (`auth`, `cycle`, `session`, `settings`)
- Preferência de backup automático persistida em `settings.store.auto_backup_enabled`

---

## 11. Dependências

### Core
```
expo ~54
expo-router ~6
react-native 0.81.5
react 19.1.0
typescript ~5.9
zustand ^5
@react-native-async-storage/async-storage
react-native-reanimated ~3          # mesma versão do projeto de referência
react-native-gesture-handler ~2
react-native-safe-area-context
react-native-screens
@biomejs/biome
pnpm
```

### Navegação
```
@react-navigation/drawer
@react-navigation/bottom-tabs
@react-navigation/native
@gorhom/bottom-sheet ^5
```

### Dados e sync
```
expo-sqlite ~15
@tanstack/react-query ^5
axios ^1
```

### Autenticação Google
```
expo-auth-session
expo-web-browser
```

### Timer e background
```
expo-task-manager
expo-notifications
expo-file-system               # leitura .db para backup
```

### Formulários
```
react-hook-form ^7             # usado em: novo ciclo, setup planilha, configurações de sessão
yup ^1
@hookform/resolvers
```

### UI e utilitários
```
expo-linear-gradient
expo-haptics
@expo/vector-icons
date-fns ^4                    # cálculo de semanas ISO, diff de datas
clsx
@expo-google-fonts/baloo-2
```

---

## 12. Fora do Escopo (v1) — Planejado para o Futuro

- **MCP Google Calendar**: lê eventos com tag `ESTUDO` na agenda do usuário e sugere automaticamente `planned_hours` ao criar novo ciclo. Campo `day_available_hours` na Home também passaria a ser sugerido pela agenda.
- **Múltiplos concursos simultâneos com troca rápida**
- **Gamificação / streaks**
- **`expo-background-fetch`** para sync periódico em background

---

## 13. Dados PRF — Referência

Matérias e pesos do concurso PRF (fonte: edital oficial):

| Matéria | Pontos |
|---|---|
| Legislação de Trânsito | 30 |
| Português | 18 |
| Inglês ou Espanhol | 8 |
| Informática | 7 |
| Direito Constitucional | 7 |
| Raciocínio Lógico-Matemático | 6 |
| Legislação Especial Extravagante | 6 |
| Ética e Cidadania | 6 |
| Direito Administrativo | 5 |
| Direito Penal | 5 |
| Direito Processual Penal | 5 |
| Direitos Humanos | 5 |
| Física | 5 |
| Geopolítica | 5 |
| Legislação da PRF | 2 |

**Matérias de construção lenta** (`is_slow_build = 1` por padrão):
- Português
- Raciocínio Lógico-Matemático
