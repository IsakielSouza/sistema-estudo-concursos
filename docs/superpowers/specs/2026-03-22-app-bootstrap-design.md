# App Bootstrap — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Problem:** `activeConcursoId` e `activeCycleId` no `cycle.store` não são inicializados ao startup do app, causando falha silenciosa na criação de ciclos.

---

## Contexto

O `cycle.store` (Zustand + AsyncStorage) guarda `activeConcursoId` e `activeCycleId`. Esses valores são definidos apenas quando:
- O usuário configura a planilha em Settings (`setActiveConcurso`)
- Um ciclo é criado com sucesso (`setActiveCycle`)

Não existe nenhum código que reconcilia o store com o banco SQLite no startup. Isso causa:
- `activeConcursoId = null` → subjects query desabilitada → form do ciclo vazio → validação bloqueia criação
- `activeCycleId` apontando para um ciclo que não existe mais no banco → queries retornam vazio

---

## Solução

### 1. Store — nova action `clearActiveCycleId`

O `clearActiveCycle` atual limpa **ambos** `activeCycleId` e `activeConcursoId`. Precisamos de uma action que limpe apenas `activeCycleId`, para que o step 2 do bootstrap não desfaça o step 1.

Adicionar ao `cycle.store.ts`:
```ts
clearActiveCycleId: () => set({ activeCycleId: null }),
```

### 2. Repository — novo método `CycleRepository.getById`

Não existe método para buscar um ciclo pelo seu `id` isoladamente. Adicionar ao `cycle.repository.ts`:
```ts
async getById(id: string): Promise<Cycle | null> {
  const db = await getDatabase()
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM cycles WHERE id = ?', [id]
  )
  return row ? rowToCycle(row) : null
}
```

### 3. Hook `useAppBootstrap`

**Localização:** `src/shared/hooks/useAppBootstrap.ts`

#### Hydration guard

O middleware `persist` do Zustand com AsyncStorage é assíncrono. O hook deve aguardar a hidratação do store antes de agir, usando `useCycleStore.persist.onFinishHydration` ou `hasHydrated()`.

Usar um state local `hasHydrated` que começa `false` e é setado para `true` após a hidratação:
```ts
const [hasHydrated, setHasHydrated] = useState(
  () => useCycleStore.persist.hasHydrated()
)

useEffect(() => {
  if (hasHydrated) return
  return useCycleStore.persist.onFinishHydration(() => setHasHydrated(true))
}, [hasHydrated])
```

O bootstrap só roda quando `hasHydrated === true`.

#### Lógica de reconciliação

```
// Step 1: Reconciliar activeConcursoId
concurso = SELECT * FROM concursos WHERE is_active = 1 LIMIT 1
if concurso existe AND concurso.id != store.activeConcursoId:
  setActiveConcurso(concurso.id)
// Se não existe concurso: não faz nada (usuário ainda não sincronizou)

// Step 2: Reconciliar activeCycleId (apenas se há um id no store)
if store.activeCycleId não é null:
  cycle = CycleRepository.getById(store.activeCycleId)
  if cycle não existe OR cycle.status NOT IN ('active', 'late'):
    clearActiveCycleId()   ← action nova, NÃO o clearActiveCycle
```

#### Dependency array do useEffect

O useEffect de bootstrap tem dependência `[hasHydrated]`. Roda uma vez quando `hasHydrated` passa de `false` para `true`. Não roda em re-renders subsequentes.

### 4. Integração

`src/app/(private)/_layout.tsx` — adicionar `useAppBootstrap()` antes do return:

```tsx
export default function PrivateLayout() {
  useAppBootstrap()
  return <Drawer ...>
```

Sem loading state — SQLite local é rápido e os queries existentes já têm `enabled` guards que protegem contra estado nulo durante o bootstrap.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/shared/stores/cycle.store.ts` | Adicionar `clearActiveCycleId: () => void` na interface `CycleStore` e implementar a action |
| `src/shared/database/repositories/cycle.repository.ts` | Adicionar método `getById` |
| `src/shared/hooks/useAppBootstrap.ts` | Criar (novo arquivo) |
| `src/app/(private)/_layout.tsx` | Adicionar `useAppBootstrap()` |

---

## Fora do escopo

- Criação automática de concurso se nenhum existir no banco (usuário deve sincronizar primeiro via Settings)
- Loading state durante bootstrap (SQLite local é suficientemente rápido)
