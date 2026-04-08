# Home Screen Redesign — Spec

**Data:** 2026-03-22
**Status:** Aprovado pelo usuário

---

## Objetivo

Redesenhar a tela Home de um dashboard de recomendações para um dashboard executivo focado na execução do ciclo de estudo, com visualização circular das sessões e registro manual.

---

## Estrutura de Navegação (escopo desta spec)

Duas tabs (renomeação futura da tab `cycle` → `dashboard` fica fora desta spec):

| Tab | Arquivo de rota |
|---|---|
| **Home** (esta spec) | `src/app/(private)/(tabs)/home.tsx` |
| **Dashboard** (próxima spec) | `src/app/(private)/(tabs)/cycle.tsx` → renomear |

---

## Tela Home — Layout

```
┌─────────────────────────────────┐
│ [☰]  Início            [avatar] │  ← Header com acesso ao Drawer
├─────────────────────────────────┤
│                                 │
│         ╭─────────────╮         │
│      ╭──┤  segmentos  ├──╮      │
│     │   │   por sessão  │   │     │  ← Círculo SVG ~80% largura
│     │   │  [Matéria]  │   │     │
│     │   │  00:00:00   │   │     │
│      ╰──┤  [INICIAR]  ├──╯      │
│         ╰─────────────╯         │
│                                 │
│ ─── Sessões ─────────────────── │
│ ┌───────────────────────────┐   │
│ │ Português  2:00  ⏱2:00 ▷ ⋮│  │  ← ScrollView com lista
│ │ Legislação 2:00  ⏱2:00 ▷ ⋮│  │
│ │ ...                       │   │
│ └───────────────────────────┘   │
│                                 │
│                         [  +  ] │  ← FAB redondo, canto inferior direito
└─────────────────────────────────┘
```

---

## Componentes

### 1. Header

- Botão hamburguer (☰) à esquerda → abre o Drawer de navegação
- Título "Início" centralizado
- Avatar do usuário à direita (foto do Google ou placeholder)

**API de navegação para o Drawer:**

O Home vive em `(tabs)` que está dentro do Drawer. O `useNavigation()` padrão retorna a navegação do Tab. Para abrir o Drawer use:

```typescript
import { useNavigation } from '@react-navigation/native'
import type { DrawerNavigationProp } from '@react-navigation/drawer'

const navigation = useNavigation<DrawerNavigationProp<any>>()
navigation.getParent<DrawerNavigationProp<any>>()?.openDrawer()
```

### 2. CycleCircle (círculo SVG)

**Tecnologia:** `react-native-svg` (já instalada no projeto — não requer `npm install`)

**Geometria:**
- Diâmetro: 80% da largura da tela (`Dimensions.get('window').width * 0.80`)
- Stroke width: ~18–22pt
- Fundo do track: cor `colors.background.elevated`
- Gap entre segmentos: 3° de arco

**Segmentos:**
- Cada segmento = uma `PlannedSession`
- Arco proporcional à duração (`allocatedSeconds / totalAllocatedSeconds * 360°`)
- Cor por matéria: atribuída por index do `cycleSubject` no array (ver Paleta de Cores)
- Sessão **feita** (`done`): cor verde `#4CAF50`, sobrescreve cor da matéria
- Sessão **pendente**: cor da matéria, opacidade 100%
- Sessão **em andamento** (`in_progress`): cor da matéria com animação de pulso (Animated.loop alternando opacity 1 ↔ 0.4)

**Centro — estados possíveis:**

| Estado | Conteúdo |
|---|---|
| Sem `activeCycleId` | Texto "Nenhum ciclo ativo" |
| Todas `done` | Texto "Ciclo concluído!" sem botão de ação |
| Sessão `in_progress` | Nome da matéria + tempo decorrido (wall-clock, `useEffect` com `setInterval` de 1 s) + botão "Continuar" |
| Próxima `pending` | Nome da matéria + `allocatedSeconds` formatado como `HH:mm:ss` + botão "Iniciar" |

**"Próxima sessão pendente"** = primeira `PlannedSession` com `status === 'pending'` ordenada por `position ASC` (a query `getByCycle` já retorna em `position ASC`).

**Regra: só uma sessão `in_progress` por vez.** Ao "Iniciar" uma nova sessão, a anterior precisa estar `done` ou `pending`. O fluxo atual já garante isso via tela `/session`.

**Timer de sessão `in_progress`:**

O `started_at` não está na interface `PlannedSession`. O ViewModel busca na tabela `study_sessions` via novo método em `SessionRepository` (não em `PlannedSessionRepository`):

```typescript
// SessionRepository.getInProgressByPlannedSession(plannedSessionId: string): Promise<StudySession | null>
SELECT * FROM study_sessions
WHERE planned_session_id = ? AND ended_at IS NULL
ORDER BY started_at DESC
LIMIT 1
```

O `started_at` retornado é usado para calcular `elapsed = now - new Date(started_at)`.

### 3. Lista de sessões (SessionList)

ScrollView abaixo do círculo. Cada linha:

```
| Matéria | Sessão (HH:mm:ss) | ⏱ Tempo restante | ▷ | ⋮ |
```

- **Sessão (HH:mm:ss):** `allocatedSeconds` formatado
- **⏱ Tempo restante:**
  - `pending`: exibe `allocatedSeconds` (total planejado)
  - `in_progress`: exibe `allocatedSeconds - elapsed`
  - `done`: exibe 0 / não exibe (substitui por ✓)
- Sessão `done`: ícone ✓ verde no lugar de ▷, linha levemente opaca
- Sessão `in_progress`: indicador pulsante (mesma animação do círculo)
- Toque em ▷: chama `handlePlaySession(id)` — reimplementado no Home ViewModel (não importado do Cycle)

**Menu ⋮:**

| Opção | Condição de exibição | Ação |
|---|---|---|
| Registrar como feito | status `pending` ou `in_progress` | Abre `ManualSessionModal` |
| Desfazer execução | status `done` | Chama `handleUndoSession(id)` |

**Modal "Registrar como feito":**
- Título: "Registrar sessão manualmente"
- Input: "Quanto tempo você estudou? (minutos)"
- Botão "Confirmar" → chama `handleRegisterManual(plannedSessionId, minutes)`

### 4. FAB (Floating Action Button)

- Posição: `position: absolute`, `bottom: 24`, `right: 24`
- Estilo: círculo 56×56, `backgroundColor: colors.brand.primary`, sombra
- Ícone: `Ionicons name="add"` tamanho 28, cor branca
- Ação: `bottomSheetRef.current?.expand()`
- `@gorhom/bottom-sheet` já é dependência do projeto — não requer instalação
- Após criar ciclo com sucesso: permanece na Home (circle atualiza via query invalidation)

**Padrão correto de uso do BottomSheet (igual a `Cycle.view.tsx`):**

`NewCycleBottomSheetView` é um componente regular sem `forwardRef` — não aceita `ref` diretamente. O `ref` pertence ao `<BottomSheet>` wrapper, não ao conteúdo. Renderizar no final de `Home.view.tsx`:

```tsx
import BottomSheet from '@gorhom/bottom-sheet'
import { NewCycleBottomSheetView } from '@/screens/Cycle/components/NewCycleBottomSheet/NewCycleBottomSheet.view'

// No JSX do Home, após o FAB:
<BottomSheet ref={bottomSheetRef} index={-1} snapPoints={['85%']} enablePanDownToClose>
  <NewCycleBottomSheetView onClose={() => bottomSheetRef.current?.close()} />
</BottomSheet>
```

---

## Dados e Queries

### useHomeViewModel (reescrita completa)

```typescript
// Carrega
- useGetPlannedSessionsQuery()       → sessões para o círculo e lista
- useGetCycleSubjectsQuery()         → array de (CycleSubject & { subject: Subject })
- useCycleStore → activeCycleId, activeConcursoId
- useAuthStore  → user (avatar)
- useRef<BottomSheet>(null)          → bottomSheetRef para FAB

// Estado local
- modalSession: PlannedSession | null  → sessão selecionada para o modal manual
- inProgressStudySession: StudySession | null  → buscado quando há in_progress (para started_at)

// Ações
- handlePlaySession(id)              → reimplementar (cópia de useCycleViewModel)
- handleRegisterManual(id, minutes)  → novo (chama useRegisterManualSessionMutation)
- handleUndoSession(id)              → novo (chama useUndoSessionMutation)
- handleOpenNewCycle()               → bottomSheetRef.current?.expand()
- handleOpenModal(session)           → setModalSession(session)
- handleCloseModal()                 → setModalSession(null)
```

### handlePlaySession (reimplementação)

```typescript
const handlePlaySession = useCallback(async (plannedSessionId: string) => {
  try {
    await PlannedSessionRepository.updateStatus(plannedSessionId, 'in_progress')
    queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
    router.push({ pathname: '/(private)/session', params: { plannedSessionId } })
  } catch (e) {
    Alert.alert('Erro ao iniciar sessão', e instanceof Error ? e.message : 'Tente novamente.')
  }
}, [queryClient])
```

### Mapeamento de cores por matéria

`useGetCycleSubjectsQuery()` retorna `(CycleSubject & { subject: Subject })[]`. A cor é atribuída por posição no array. Para que a cor seja estável entre re-renderizações, o repositório `CycleRepository.getCycleSubjects` deve incluir `ORDER BY id ASC` (garantia de ordem de inserção).

```typescript
const subjectColorMap = useMemo(() =>
  new Map(cycleSubjects.map((cs, idx) => [cs.subjectId, SUBJECT_COLORS[idx % SUBJECT_COLORS.length]])),
  [cycleSubjects]
)
```

### Banco de dados

**`study_sessions`**: adicionar coluna `is_manual INTEGER NOT NULL DEFAULT 0`.

**`SessionRepository.create()`**: adicionar `isManual` ao parâmetro e ao INSERT.

**`StudySession` interface** (`src/shared/interfaces/session.ts`): adicionar `isManual: boolean`.

**`PlannedSessionRepository`**:
- `resetStatus(id)` → apenas `UPDATE planned_sessions SET status = 'pending' WHERE id = ?`
  - A deleção da study_session e o decremento de horas são feitos pela mutation, não pelo repositório

**`SessionRepository`** (novos métodos):
- `getInProgressByPlannedSession(plannedSessionId)` → `SELECT * FROM study_sessions WHERE planned_session_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1`
- `getByPlannedSessionId(plannedSessionId)` → `SELECT * FROM study_sessions WHERE planned_session_id = ? ORDER BY started_at DESC LIMIT 1`
- `deleteById(id)` → `DELETE FROM study_sessions WHERE id = ?`

**`CycleRepository.getCycleSubjects`**: adicionar `ORDER BY id ASC` para cor estável.

---

## Lógica das mutations

### useRegisterManualSessionMutation

```typescript
mutationFn: async ({ plannedSessionId, minutes }) => {
  const plannedSession = await PlannedSessionRepository.getById(plannedSessionId)
  // getById retorna PlannedSession | null — guardar contra null
  if (!plannedSession) throw new Error('Sessão não encontrada')
  const now = new Date().toISOString()
  const studySeconds = minutes * 60
  await SessionRepository.create({
    plannedSessionId,
    cycleSubjectId: plannedSession.cycleSubjectId,
    subjectId: plannedSession.subjectId,
    startedAt: now,
    endedAt: now,
    studySeconds,
    reviewSeconds: 0,
    pausedSeconds: 0,
    isManual: true,
  })
  await PlannedSessionRepository.updateStatus(plannedSessionId, 'done')
  await CycleRepository.incrementCycleSubjectHours(
    plannedSession.cycleSubjectId,
    studySeconds / 3600
  )
}
onSuccess: () => {
  // Partial key — TanStack Query usa prefix matching, ['cycle-subjects'] invalida ['cycle-subjects', activeCycleId]
  queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
  queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
}
```

### useUndoSessionMutation

```typescript
mutationFn: async ({ plannedSessionId }) => {
  // Busca a study_session mais recente (ORDER BY started_at DESC LIMIT 1)
  const session = await SessionRepository.getByPlannedSessionId(plannedSessionId)
  // Executar as 3 escritas em transação para atomicidade
  const db = await getDatabase()
  await db.withTransactionAsync(async () => {
    if (session) {
      // Decrementa completed_hours do cycle_subject
      await CycleRepository.decrementCycleSubjectHours(
        session.cycleSubjectId,
        session.studySeconds / 3600
      )
      // Deleta a study_session
      await SessionRepository.deleteById(session.id)
    }
    // Reverte status da planned_session
    await PlannedSessionRepository.resetStatus(plannedSessionId)
  })
}
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['planned-sessions'] })
  queryClient.invalidateQueries({ queryKey: ['cycle-subjects'] })
}
```

**Nota:** O comportamento de desfazer é idêntico para sessões manuais e temporizadas — apenas a study_session é deletada e o completed_hours é decrementado pelo valor de `studySeconds`.

---

## Paleta de cores por matéria

Cores fixas atribuídas por posição no array de `cycleSubjects` (estável por `ORDER BY id ASC`):

```
0: #4F6CF7  (brand primary)
1: #FF9800  (laranja)
2: #9C27B0  (roxo)
3: #00BCD4  (ciano)
4: #F44336  (vermelho)
5: #4CAF50  (verde)
6: #FF5722  (laranja escuro)
7: #3F51B5  (índigo)
8: #009688  (teal)
9: #FFC107  (âmbar)
10: #E91E63 (pink)
11: #607D8B (blue grey)
```

Sessão `done` sempre sobrescreve a cor da matéria com `#4CAF50`.

---

## Migration necessária

`002_add_is_manual.ts` (id `2` — confirmado, apenas a migration `id: 1` existe):

```sql
ALTER TABLE study_sessions ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0;
```

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/screens/Home/Home.view.tsx` | Reescrever completo |
| `src/screens/Home/useHome.viewModel.ts` | Reescrever completo |
| `src/screens/Home/components/CycleCircle/CycleCircle.view.tsx` | Criar |
| `src/screens/Home/components/SessionList/SessionList.view.tsx` | Criar |
| `src/screens/Home/components/SessionList/SessionRow.view.tsx` | Criar |
| `src/screens/Home/components/ManualSessionModal/ManualSessionModal.view.tsx` | Criar |
| `src/screens/Home/components/HomeHeader/HomeHeader.view.tsx` | Criar |
| `src/shared/queries/cycles/use-register-manual-session.mutation.ts` | Criar |
| `src/shared/queries/cycles/use-undo-session.mutation.ts` | Criar |
| `src/shared/database/repositories/planned-session.repository.ts` | Adicionar `resetStatus()` |
| `src/shared/database/repositories/session.repository.ts` | Adicionar `isManual` ao INSERT; atualizar `rowToStudySession` para mapear `row.is_manual as boolean`; adicionar `getInProgressByPlannedSession()`, `getByPlannedSessionId()` e `deleteById()` |
| `src/shared/queries/sessions/use-save-session.mutation.ts` | Adicionar `isManual: false` na chamada a `SessionRepository.create()` (campo ficou obrigatório) |
| `src/shared/database/repositories/cycle.repository.ts` | Adicionar `decrementCycleSubjectHours()`, adicionar `ORDER BY id ASC` em `getCycleSubjects()` |
| `src/shared/interfaces/session.ts` | Adicionar `isManual: boolean` à interface `StudySession` |
| `src/shared/database/migrations/002_add_is_manual.ts` | Criar |
| `src/shared/database/migrations/index.ts` | Registrar migration 002 |

---

## Fora do escopo desta spec

- Redesign da tab Dashboard
- Animação de entrada do círculo
- Cores dinâmicas (paleta fixa é suficiente)
- Notificações de sessão
