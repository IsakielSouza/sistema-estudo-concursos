# CaveiraCards — Design: 3 Fixes (2026-04-05)

## Escopo

Três melhorias na extensão CaveiraCards:

1. **Issue 1** — Popup "já existe no deck" fecha em 1 segundo
2. **Issue 2** — Questões novas erroneamente rejeitadas como duplicatas após a primeira adição
3. **Issue 3** — Botão para capturar comentários de alunos (TEC Concursos) e incluir no card Anki

---

## Issue 1 — Popup duplicata: 1s e fecha

**Arquivo:** `caveira-cards/content.js`

**Comportamento atual:** qualquer erro em `enviarParaAnki` exibe mensagem por 4s, reverte o texto e minimiza o overlay.

**Comportamento novo:** se `err.message.includes("duplicate")`:
- Exibe "Já existe no deck" por **1000ms**
- Remove o overlay completamente (`overlay.remove()`, `overlayEl = null`)

Erros que não são "duplicate" mantêm o comportamento atual (4s, revert, minimiza).

---

## Issue 2 — Duplicatas falsas: CSS inline nos campos

### Causa raiz

`card-builder.js` inclui um bloco `<style>` com ~500 chars de CSS no início do campo `Frente`. O Anki calcula o "sort field" (sfld) removendo tags HTML mas mantendo o texto interno das tags — incluindo o conteúdo de `<style>`. Como o CSS é idêntico em todos os cards, o sfld de todos começa com a mesma string longa, fazendo o Anki tratar todos como duplicatas do primeiro card adicionado.

### Solução

**`card-builder.js`:**
- Remove a constante `CSS` e sua concatenação com `frente` e `verso`
- Os campos passam a conter apenas o HTML semântico

**`anki.js` — `createModel`:**
- Move o CSS completo para o campo `css` do modelo (escopo `.card`)
- O template Anki aplica o CSS via `.card { }`, não mais inline

**`anki.js` — `configurarAnki`:**
- Se o modelo já existe: chama `updateModelStyling` com o CSS completo (atualiza usuários existentes)
- Se o modelo não existe: cria com o CSS no campo correto

**`content.js`:**
- Muda chave do storage de `ankiSetupDone` → `ankiSetupDone_v2`
- Força re-execução do setup em usuários existentes para o `updateModelStyling` rodar

Cards já existentes no Anki recebem o CSS atualizado automaticamente (Anki aplica o CSS do modelo a todos os cards do modelo).

---

## Issue 3 — Botão para capturar comentários (TEC Concursos)

### Fluxo

1. Usuário responde questão → overlay aparece
2. Usuário clica para adicionar ao Anki → `addNote` retorna `noteId` → armazenado em memória
3. Overlay mostra "Adicionado! ✓"
4. Botão `📎` aparece discretamente no overlay (visível inclusive no estado minimizado)
5. Usuário abre o painel de comentários no TEC Concursos
6. Usuário clica `📎` → extensão lê comentários visíveis, pega top 3 por nota, atualiza o card
7. Botão muda para `✓` por 1s e some

### Seletores DOM (TEC Concursos)

| Dado | Seletor |
|------|---------|
| Lista de comentários | `ul.discussao-comentarios > li` |
| Nota do comentário | `.discussao-comentario-nota-numero .ng-binding` (texto) ou `aria-label` |
| Texto do comentário | `.discussao-comentario-post-texto` |
| Painel visível | `ul.discussao-comentarios` presente no DOM e visível |

### Mudanças por arquivo

**`caveira-cards/sites/tec.js`:**
- Novo método `capturarComentarios()`:
  - Seleciona todos os `li` da lista
  - Extrai score (parse de int do texto de `.discussao-comentario-nota-numero .ng-binding`)
  - Extrai HTML de `.discussao-comentario-post-texto`
  - Ordena por score desc
  - Retorna array dos top 3: `[{ score, html }]`
  - Retorna `null` se painel não estiver visível

**`caveira-cards/sites/gran.js`:**
- Adiciona `capturarComentarios()` retornando `null` (Gran não suportado nesta versão)

**`caveira-cards/shared/anki.js`:**
- Novo método `atualizarExtra(noteId, extraHtml)`:
  - Chama `updateNoteFields` com `{ Extra: extraHtml }`

**`caveira-cards/content.js`:**
- `enviarParaAnki`: armazena o `noteId` retornado por `CaveiraAnki.enviarQuestao`
- Após sucesso: renderiza botão `📎` no overlay
- Clique no `📎`:
  - Chama `adapter.capturarComentarios()` 
  - Se retorna `null`: mostra toast "Abra o painel de comentários"
  - Se retorna comentários: formata em HTML, chama `CaveiraAnki.atualizarExtra(noteId, extra)`
  - Após sucesso: botão vira `✓`, some após 1s

**`caveira-cards/shared/overlay.css`:**
- Estilo do botão `📎`: pequeno (24×24px), posicionado no canto inferior direito do `.cc-card`, fundo neutro, visível também no estado `.minimizado`

**`caveira-cards/shared/anki.js` — `enviarQuestao`:**
- Retorna o `noteId` (resultado do `addNote`)

### Formato dos comentários no campo Extra

```html
<hr>
<div class="cc-comentarios">
  <strong>💬 Top comentários</strong>
  <div class="cc-comentario">
    <span class="cc-score">▲ 119</span>
    <div>...texto do comentário...</div>
  </div>
  ...
</div>
```

---

## Arquivos modificados

| Arquivo | Issues |
|---------|--------|
| `content.js` | 1, 2, 3 |
| `shared/anki.js` | 2, 3 |
| `shared/card-builder.js` | 2 |
| `shared/overlay.css` | 3 |
| `sites/tec.js` | 3 |
| `sites/gran.js` | 3 |
