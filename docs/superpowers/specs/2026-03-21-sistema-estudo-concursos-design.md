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

### Projetos de referência
- `react-native-memory-game`: padrão MVVM, módulo de animações, Zustand stores
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
│   │   └── sheets.client.ts      # Axios client Google Sheets + Drive API
│   │
│   ├── queries/                  # TanStack Query por domínio
│   │   ├── sheets/
│   │   │   ├── use-sync-sheets.mutation.ts
│   │   │   └── use-get-spreadsheet.query.ts
│   │   ├── subjects/
│   │   │   ├── use-get-subjects.query.ts
│   │   │   └── use-update-topic-status.mutation.ts
│   │   └── sessions/
│   │       └── use-save-session.mutation.ts
│   │
│   ├── services/
│   │   ├── sync.service.ts           # Sheets ↔ SQLite diff/merge
│   │   ├── recommendation.service.ts # Algoritmo de recomendação
│   │   ├── cycle.service.ts          # Cálculo de horas por ciclo
│   │   ├── timer.service.ts          # Background timer
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
│   │   ├── auth.store.ts
│   │   ├── cycle.store.ts
│   │   └── session.store.ts
│   │
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── sheets-response.ts
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
│       └── cycle.schema.ts
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

### subjects
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| concurso_id | TEXT FK | |
| name | TEXT | Ex: "Legislação de Trânsito" |
| points | INTEGER | Peso na prova (ex: 30) |
| experience | INTEGER | Nível do usuário 1–5 |
| cycle_status | TEXT | `active` / `revision` |
| is_slow_build | BOOLEAN | Matéria de construção lenta (ex: Português, RLM) |
| is_free_study | BOOLEAN | Estudo Livre — sem peso, ~3h/semana fixas |
| created_at | TEXT | |

**Regras:**
- `cycle_status = 'revision'` → matéria concluiu o edital, permanece no ciclo com 50% das horas alocadas. Nunca é removida.
- `cycle_status = 'active'` → horas cheias no ciclo.
- `is_slow_build = true` → Português e RLM por padrão. Ganham +30% de prioridade nas semanas 1–2 de cada ciclo. Usuário pode editar o campo.
- `is_free_study = true` → disciplina "Estudo Livre", sempre presente em todo ciclo, ~3h/semana fixas, sem cálculo proporcional.

### topics
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| subject_id | TEXT FK | |
| code | TEXT | Ex: "1.2.3" |
| title | TEXT | Ex: "Concordância verbal e nominal" |
| level | INTEGER | 0 = matéria, 1 = tópico, 2 = subtópico |
| status | TEXT | `pending` / `done` |

### cycles
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| concurso_id | TEXT FK | |
| name | TEXT | Nome do ciclo |
| week_number | INTEGER | Número sequencial do ciclo |
| planned_hours | REAL | Horas que o usuário comprometeu |
| completed_hours | REAL | Horas efetivamente estudadas |
| started_at | TEXT | |
| ended_at | TEXT | NULL se ainda ativo |
| status | TEXT | `active` / `completed` / `late` |

**Regras:**
- `status = 'late'` → passaram 7 dias sem encerramento.
- O campo `planned_hours` vem do usuário na tela de novo ciclo, com sugestão preenchida (futuramente pelo MCP Google Calendar).

### cycle_subjects
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| cycle_id | TEXT FK | |
| subject_id | TEXT FK | |
| allocated_hours | REAL | Calculado pelo cycle.service |
| completed_hours | REAL | Acumulado das sessões |

### study_sessions
| Campo | Tipo | Descrição |
|---|---|---|
| id | TEXT PK | UUID |
| cycle_subject_id | TEXT FK | |
| started_at | TEXT | |
| ended_at | TEXT | |
| study_seconds | INTEGER | Tempo de estudo puro |
| review_seconds | INTEGER | Tempo de revisão (padrão 1/3 da sessão) |
| paused_seconds | INTEGER | Tempo em pausa |

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
  └── /login → Google OAuth → setup planilha → home

(private)
  ├── Drawer (lateral)
  │     ├── Perfil (nome + foto Google)
  │     ├── Histórico → /history
  │     ├── Backup → /backup
  │     └── Sair (logout)
  │
  └── Tab Bar: Home | Ciclo
        ├── (tabs)/home     → Dashboard + recomendação do dia
        └── (tabs)/cycle    → Ciclo ativo + gerenciar matérias

  Modais/Stacks:
  ├── /subject/[id]   → Tópicos, progresso, toggle revisão
  ├── /session        → Cronômetro de sessão
  ├── /history        → Histórico de sessões
  ├── /backup         → Gerenciar backups Google Drive
  └── /settings       → Config planilha, sync manual
```

### Primeiro acesso
Se o usuário não tem planilha configurada após o login → modal bloqueante solicitando o link da planilha ou navegação no Google Drive para seleção.

---

## 6. Fluxo de Telas

### /login
- Botão "Entrar com Google"
- OAuth via `expo-auth-session`
- Após auth: verifica se há planilha configurada no store
- Dispara sync automático

### (tabs)/home — Dashboard
- Saudação + data
- **Recomendação de hoje**: lista de matérias com tempo sugerido
  - Badge `construção lenta` para is_slow_build nas semanas 1–2
  - Badge `revisão` para matérias em modo revision
- **Progresso do ciclo ativo**: `completed_hours / planned_hours` com barra visual
- **Status do ciclo**: `Em dia` / `Atrasado` / `Concluído`
- Botão "Iniciar Sessão" → /session

### (tabs)/cycle — Ciclo
- Ciclo ativo: nome, semana #N, progresso geral
- Cards de matérias com horas alocadas vs. concluídas
- FAB "Novo Ciclo" → bottom sheet de criação
  - Campo: nome, horas disponíveis/semana (editável, sugestão futura via Calendar)
  - Seleção de matérias (slow_build destacadas com aviso)
  - "Estudo Livre" sempre presente, não removível
- Toque em matéria → /subject/[id]

### /subject/[id]
- Nome, pontos (peso), experiência (1–5), cycle_status
- Toggle "Concluiu o edital?" → muda para `revision`
  - Modal de confirmação: "Matéria entrará em modo revisão com 50% das horas. Não será removida do ciclo."
- Barra de progresso dos tópicos (% done)
- Lista hierárquica de tópicos/subtópicos com checkbox FEITO/PENDENTE
- Alterações sincronizadas na planilha ao sair da tela

### /session
- Seleção de matéria para a sessão
- Toggle: "Incluir revisão?" (padrão: ativado — 1/3 do tempo como revisão)
- Cronômetro: play / pause / encerrar
- Display: tempo de estudo | tempo de revisão | total
- Funciona em **background** + **tela de bloqueio** com notificação persistente play/pause
- Ao finalizar: salva `study_session` no SQLite + dispara sync para planilha

### /history
- Lista de sessões por data
- Totais: horas por matéria, por semana, por ciclo
- Taxa de cumprimento por ciclo (planejado vs. executado)

### /backup
- Status do último backup (data/hora)
- Botão "Fazer backup agora" → exporta SQLite para Google Drive
  - Pasta: `AppData/sistema-estudo-concursos/backups/`
  - Nome: `backup-YYYY-MM-DD-HH:mm.db`
- Botão "Restaurar backup" → lista backups no Drive → seleciona → restaura
- Toggle "Backup automático" → ativa backup após cada sessão finalizada

### /settings
- Conta Google conectada
- Link da planilha (editar/trocar)
- Botão "Sincronizar agora"

---

## 7. Algoritmo de Recomendação e Cálculo de Ciclo

### 7.1 Alocação de horas por matéria

```
Entrada: weekly_hours, subjects[], free_study_hours = 3h

1. study_pool = weekly_hours - free_study_hours

2. effective_points[i]:
   - cycle_status = 'revision' → points[i] × 0.5
   - cycle_status = 'active'   → points[i]

3. total_points = Σ effective_points

4. allocated_hours[i] = (effective_points[i] / total_points) × study_pool
```

As horas liberadas pelas matérias em revisão são automaticamente redistribuídas proporcionalmente entre matérias ativas (pois `total_points` é menor).

### 7.2 Recomendação diária

```
Entrada: cycle_subjects[], sessions_this_week[], day_available_hours

1. deficit[i] = allocated_hours[i] - completed_hours_this_week[i]

2. Se is_slow_build E semana_do_ciclo ≤ 2:
      deficit[i] × 1.3

3. Ordenar por deficit decrescente

4. Distribuir day_available_hours entre top N matérias com maior déficit
   sem ultrapassar o restante semanal de cada uma

Saída: [{ subject, suggested_minutes, priority_badge }]
  priority_badge: 'slow_build' | 'revision' | null
```

### 7.3 Estimativa de ciclos para fechar o edital

```
Por matéria:
  done_ratio = done_topics / total_topics
  taxa_semanal = média histórica de tópicos concluídos/semana
  estimated_weeks = (total_topics - done_topics) / taxa_semanal

Exibido no dashboard: "~N semanas para fechar [Matéria]"
```

### 7.4 Controle de ciclo semanal

- Cada ciclo tem `week_number` sequencial
- Ciclos são idealmente semanais, mas não há encerramento automático obrigatório
- Após 7 dias sem encerramento: `status = 'late'`
- Dashboard exibe taxa de cumprimento: `completed_hours / planned_hours`
- Histórico permite o usuário analisar se as horas planejadas são realistas

---

## 8. Google Sheets — Estrutura Esperada da Planilha

A planilha segue o modelo "Edital Interativo - PRF.xlsx" existente:

- **Aba por matéria** (ou coluna STATUS por linha de tópico)
- **Colunas**: Código | Título | STATUS (FEITO/PENDENTE)
- **Células de resumo**: TOTAL | FEITO | PENDENTE | %FEITO | BARRA DE PROGRESSO

### Sincronização (sync.service.ts)
1. **Login** → lê toda a planilha, compara com SQLite local, aplica diff
2. **Ao finalizar sessão** → escreve status dos tópicos alterados de volta na planilha
3. Conflito: planilha sempre ganha (fonte da verdade)
4. `sync_log` registra cada operação

---

## 9. Timer e Background

- **Foreground**: cronômetro nativo via `useTimer` hook + Reanimated para display
- **Background**: `expo-task-manager` + `expo-background-fetch` mantém o contador ativo
- **Tela de bloqueio**: `expo-notifications` exibe notificação persistente com tempo decorrido e botões play/pause
- Permissão solicitada na primeira sessão de estudos

---

## 10. Backup — Google Drive

- Usa a mesma conta Google autenticada (sem segundo login)
- `expo-file-system` lê o arquivo `.db` do SQLite
- Google Drive API faz upload para `AppData/sistema-estudo-concursos/backups/`
- Nome do arquivo: `backup-YYYY-MM-DD-HH:mm.db`
- Restauração: download → substitui arquivo local → reinicia stores Zustand

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
react-native-reanimated ~4
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
expo-background-fetch
expo-notifications
```

### Formulários
```
react-hook-form ^7
yup ^1
@hookform/resolvers
```

### UI e utilitários
```
expo-linear-gradient
expo-haptics
@expo/vector-icons
expo-file-system
date-fns ^4
clsx
@expo-google-fonts/baloo-2
```

---

## 12. Fora do Escopo (v1) — Planejado para o Futuro

- **MCP Google Calendar**: lê eventos com tag `ESTUDO` na agenda e sugere automaticamente a quantidade de horas ao criar um novo ciclo
- **Múltiplos concursos simultâneos com troca rápida**
- **Gamificação / streaks**

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

**Matérias de construção lenta** (is_slow_build = true por padrão):
- Português
- Raciocínio Lógico-Matemático
