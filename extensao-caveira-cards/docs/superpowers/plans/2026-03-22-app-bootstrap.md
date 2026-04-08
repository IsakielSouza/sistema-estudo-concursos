# App Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconciliar `activeConcursoId` e `activeCycleId` do cycle store com o banco SQLite no startup, eliminando a falha silenciosa na criação de ciclos.

**Architecture:** Um hook `useAppBootstrap` chamado no private layout aguarda a hidratação do Zustand persist antes de consultar o banco. Ele seta `activeConcursoId` se o concurso ativo existe no DB e limpa `activeCycleId` se o ciclo armazenado não existir mais ou estiver concluído.

**Tech Stack:** React Native, Expo, Zustand 5 (persist middleware), expo-sqlite

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/shared/stores/cycle.store.ts` | Modificar | Adicionar interface + action `clearActiveCycleId` |
| `src/shared/database/repositories/cycle.repository.ts` | Modificar | Adicionar método `getById` |
| `src/shared/hooks/useAppBootstrap.ts` | Criar | Hook de reconciliação do store com o banco |
| `src/app/(private)/_layout.tsx` | Modificar | Chamar `useAppBootstrap()` |

---

## Task 1: Adicionar `clearActiveCycleId` ao cycle store

**Files:**
- Modify: `concursos-app/src/shared/stores/cycle.store.ts`

- [ ] **Step 1: Abrir o arquivo e ler o estado atual**

  Arquivo: `concursos-app/src/shared/stores/cycle.store.ts`

  Confirmar que a interface `CycleStore` tem as actions existentes: `setActiveCycle`, `setActiveConcurso`, `clearActiveCycle`, `reset`.

- [ ] **Step 2: Adicionar `clearActiveCycleId` na interface**

  Localizar o bloco `interface CycleStore` e adicionar após `clearActiveCycle`:
  ```ts
  clearActiveCycleId: () => void
  ```

  O bloco deve ficar:
  ```ts
  interface CycleStore {
    activeCycleId: string | null
    activeConcursoId: string | null
    setActiveCycle: (cycleId: string, concursoId: string) => void
    setActiveConcurso: (concursoId: string) => void
    clearActiveCycle: () => void
    clearActiveCycleId: () => void
    reset: () => void
  }
  ```

- [ ] **Step 3: Implementar a action no corpo do store**

  Localizar onde `clearActiveCycle` está implementado e adicionar após:
  ```ts
  clearActiveCycleId: () => set({ activeCycleId: null }),
  ```

- [ ] **Step 4: Verificar TypeScript**

  ```bash
  cd concursos-app && npx tsc --noEmit
  ```

  Expected: sem erros relacionados ao cycle.store.

- [ ] **Step 5: Commit**

  ```bash
  git add concursos-app/src/shared/stores/cycle.store.ts
  git commit -m "feat: add clearActiveCycleId action to cycle store"
  ```

---

## Task 2: Adicionar `CycleRepository.getById`

**Files:**
- Modify: `concursos-app/src/shared/database/repositories/cycle.repository.ts`

- [ ] **Step 1: Localizar onde adicionar o método**

  Abrir `concursos-app/src/shared/database/repositories/cycle.repository.ts`.

  O método `getActiveCycle` (linha ~31) é o padrão a seguir — ele usa `getFirstAsync` com `rowToCycle`.

- [ ] **Step 2: Adicionar `getById` ao objeto `CycleRepository`**

  Adicionar após `getActiveCycle`:
  ```ts
  async getById(id: string): Promise<Cycle | null> {
    const db = await getDatabase()
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM cycles WHERE id = ?',
      [id]
    )
    return row ? rowToCycle(row) : null
  },
  ```

- [ ] **Step 3: Verificar TypeScript**

  ```bash
  cd concursos-app && npx tsc --noEmit
  ```

  Expected: sem erros.

- [ ] **Step 4: Commit**

  ```bash
  git add concursos-app/src/shared/database/repositories/cycle.repository.ts
  git commit -m "feat: add CycleRepository.getById method"
  ```

---

## Task 3: Criar o hook `useAppBootstrap`

**Files:**
- Create: `concursos-app/src/shared/hooks/useAppBootstrap.ts`

- [ ] **Step 1: Verificar hooks existentes para referência de padrão**

  Olhar `concursos-app/src/shared/hooks/useGoogleAuth.ts` para entender a convenção de imports e estrutura dos hooks existentes.

- [ ] **Step 2: Criar o arquivo `useAppBootstrap.ts`**

  ```ts
  // src/shared/hooks/useAppBootstrap.ts
  import { useEffect, useState } from 'react'
  import { SubjectRepository } from '@/shared/database/repositories/subject.repository'
  import { CycleRepository } from '@/shared/database/repositories/cycle.repository'
  import { useCycleStore } from '@/shared/stores/cycle.store'

  export function useAppBootstrap() {
    const [hasHydrated, setHasHydrated] = useState(
      () => useCycleStore.persist.hasHydrated()
    )

    useEffect(() => {
      if (hasHydrated) return
      return useCycleStore.persist.onFinishHydration(() => setHasHydrated(true))
    }, [hasHydrated])

    useEffect(() => {
      if (!hasHydrated) return

      async function reconcile() {
        const { activeCycleId, activeConcursoId, setActiveConcurso, clearActiveCycleId } =
          useCycleStore.getState()

        // Step 1: Reconciliar activeConcursoId
        const concurso = await SubjectRepository.getActiveConcurso()
        if (concurso && concurso.id !== activeConcursoId) {
          setActiveConcurso(concurso.id)
        }

        // Step 2: Reconciliar activeCycleId
        if (activeCycleId) {
          const cycle = await CycleRepository.getById(activeCycleId)
          if (!cycle || (cycle.status !== 'active' && cycle.status !== 'late')) {
            clearActiveCycleId()
          }
        }
      }

      reconcile()
    }, [hasHydrated])
  }
  ```

  **Nota:** `useCycleStore.getState()` é chamado dentro de `reconcile()` para garantir que os valores lidos são os pós-hidratação, evitando qualquer problema de closure. O `useEffect` com `[hasHydrated]` roda uma única vez quando a hidratação completa.

- [ ] **Step 3: Verificar TypeScript**

  ```bash
  cd concursos-app && npx tsc --noEmit
  ```

  Expected: sem erros. Verificar especialmente que `useCycleStore.persist.hasHydrated` e `onFinishHydration` são reconhecidos — eles fazem parte da API do Zustand 5 com persist middleware.

- [ ] **Step 4: Commit**

  ```bash
  git add concursos-app/src/shared/hooks/useAppBootstrap.ts
  git commit -m "feat: create useAppBootstrap hook for store/db reconciliation"
  ```

---

## Task 4: Integrar `useAppBootstrap` no private layout

**Files:**
- Modify: `concursos-app/src/app/(private)/_layout.tsx`

- [ ] **Step 1: Abrir o arquivo**

  Arquivo: `concursos-app/src/app/(private)/_layout.tsx`

  Confirmar que é o componente `PrivateLayout` que contém o `<Drawer>`.

- [ ] **Step 2: Adicionar o import e a chamada do hook**

  Adicionar o import no topo:
  ```ts
  import { useAppBootstrap } from '@/shared/hooks/useAppBootstrap'
  ```

  Adicionar a chamada como **primeira linha** dentro de `PrivateLayout`, antes do `return`:
  ```ts
  export default function PrivateLayout() {
    useAppBootstrap()
    return (
      <Drawer ...>
  ```

- [ ] **Step 3: Verificar TypeScript**

  ```bash
  cd concursos-app && npx tsc --noEmit
  ```

  Expected: sem erros.

- [ ] **Step 4: Verificação manual no simulador**

  Testar os dois cenários críticos:

  **Cenário A — activeConcursoId nulo:**
  1. Limpar AsyncStorage do cycle store (ou instalar fresh)
  2. Abrir o app logado com spreadsheetId configurado
  3. Navegar para a aba Ciclo → clicar "Novo Ciclo"
  4. Expected: bottom sheet abre **com a lista de matérias populada**

  **Cenário B — activeCycleId stale:**
  1. Forçar no store um `activeCycleId` que não existe no banco (ex: via Reactotron ou AsyncStorage viewer)
  2. Reiniciar o app
  3. Expected: home screen mostra `centerState = 'no_cycle'` (sem travamento)

- [ ] **Step 5: Commit final**

  ```bash
  git add concursos-app/src/app/(private)/_layout.tsx
  git commit -m "fix: call useAppBootstrap in private layout to fix cycle creation"
  ```
