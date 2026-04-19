# Design: Comentários de alunos — ativo por padrão, renomeação de chave e data de publicação

## Problema

1. O toggle "Salvar comentários dos alunos" está inativo por padrão, ao contrário do professor que é ativo por padrão.
2. A chave de storage `manualCommentCaptureEnabled` tem semântica confusa — o nome "manual" não reflete que o comportamento é automático (captura top 5 ao enviar).
3. Os comentários de alunos salvos no Anki não incluem a data de publicação visível na plataforma.

## Objetivos

1. Tornar "Salvar comentários dos alunos" ativo por padrão (igual ao professor).
2. Renomear a chave `manualCommentCaptureEnabled` → `alunosCommentCaptureEnabled` em todo o codebase.
3. Capturar e exibir a data de publicação de cada comentário quando disponível no DOM/dados da plataforma.

## Não incluído

- Mudança no comportamento de captura (ainda top 5 por score).
- Novo toggle separado para data.
- Fallback textual quando data não está disponível (omite o campo silenciosamente).

---

## Seção 1: Default + renomeação de chave

### Mudanças de default

| Arquivo | Linha aprox. | Mudança |
|---|---|---|
| `caveira-cards/popup.html` | 302 | Adicionar `checked` ao `<input id="toggle-manual">` |
| `caveira-cards/popup.js` | 191 | `manualCommentCaptureEnabled === true` → `alunosCommentCaptureEnabled !== false` |
| `caveira-cards/content.js` | 25 | `let manualCommentCaptureEnabled = false` → `let alunosCommentCaptureEnabled = true` |

### Renomeação completa

Todos os arquivos que referenciam `manualCommentCaptureEnabled`:
- `caveira-cards/content.js` — variável local (linha 25), `chrome.storage.local.get` (linhas 29-32), `chrome.storage.onChanged.addListener` (linhas 47-48), função `coletarComentariosDeAlunos()` (linha 596), comentários internos (linhas 56, 205, 578)
- `caveira-cards/popup.js` — `chrome.storage.local.get` (linhas 188-191), escrita de storage no toggle (linha 204)

> ⚠️ O `onChanged.addListener` em `content.js` escuta `"manualCommentCaptureEnabled"` — deve ser atualizado para `"alunosCommentCaptureEnabled"` ou o toggle deixará de funcionar em tempo real.

### Migração de storage

Na inicialização do popup (`popup.js`) e do content script (`content.js`), executar uma única vez:

```js
chrome.storage.local.get("manualCommentCaptureEnabled", ({ manualCommentCaptureEnabled }) => {
  if (manualCommentCaptureEnabled !== undefined) {
    chrome.storage.local.set({ alunosCommentCaptureEnabled: manualCommentCaptureEnabled });
    chrome.storage.local.remove("manualCommentCaptureEnabled");
  }
});
```

Garante que usuários existentes com a chave antiga não percam a configuração salva.

---

## Seção 2: Campo `dataPublicacao` nos comentários

### Modelo de dado

O objeto de comentário de aluno passa a suportar campo opcional:

```js
{
  score: number,
  html: string,
  type: "aluno",
  dataPublicacao?: string   // "15/03/2024" — omitido se não disponível
}
```

### Estratégia por plataforma

**TEC Concursos** — `sites/tec.js`, função `capturarComentariosAlunos()`

Buscar seletor de data no `<li>` com tentativa múltipla:
```js
const dataEl = li.querySelector(
  ".discussao-comentario-data, time, .comentario-data, [class*='data']"
);
const dataPublicacao = dataEl?.textContent?.trim() || undefined;
```

**Gran Questões** — `sites/gran.js`, função `capturarComentarios()`

Os dados vêm do `$data.comments.displayed[i]` do Vue. Tentar campos:
```js
const dataPublicacao = c.created_at || c.data || c.publicadoEm || c.date || undefined;
// Normalizar para "DD/MM/AAAA" se vier em formato ISO
```

**QConcursos** — `sites/qconcurso.js`, função `capturarComentarios()`

Buscar elemento de data no DOM do item de comentário:
```js
const dataEl = li?.querySelector("time, .date, .created-at, [class*='date'], [class*='data']");
const dataPublicacao = dataEl?.getAttribute("datetime") || dataEl?.textContent?.trim() || undefined;
```

Se nenhum seletor retornar valor: `dataPublicacao` é omitido do objeto (sem fallback textual).

---

## Seção 3: Renderização em `formatarComentarios` (`content.js`)

### Mudança no template HTML dos comentários de alunos

**Antes:**
```js
`<span class="cc-score">▲ ${c.score}</span>`
```

**Depois:**
```js
`<span class="cc-score">▲ ${c.score}${c.dataPublicacao ? ' · ' + c.dataPublicacao : ''}</span>`
```

Resultado visual no card Anki: `▲ 42 · 15/03/2024`

---

## Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `caveira-cards/popup.html` | Default `checked` no toggle |
| `caveira-cards/popup.js` | Renomeia chave, atualiza default, adiciona migração |
| `caveira-cards/content.js` | Renomeia variável/chave, atualiza default, atualiza `formatarComentarios`, adiciona migração |
| `caveira-cards/sites/tec.js` | Adiciona `dataPublicacao` em `capturarComentariosAlunos` |
| `caveira-cards/sites/gran.js` | Adiciona `dataPublicacao` em `capturarComentarios` |
| `caveira-cards/sites/qconcurso.js` | Adiciona `dataPublicacao` em `capturarComentarios` |
