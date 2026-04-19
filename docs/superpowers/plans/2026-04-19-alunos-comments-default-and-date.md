# Alunos Comments — Default Active, Key Rename and Date Capture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar "Salvar comentários dos alunos" ativo por padrão, renomear a chave de storage `manualCommentCaptureEnabled` → `alunosCommentCaptureEnabled` com migração, e capturar/exibir a data de publicação dos comentários de alunos no card Anki.

**Architecture:** Quatro camadas de mudança: (1) default + renomeação em popup.html/popup.js/content.js com migração de storage; (2) captura de `dataPublicacao` em cada adapter de plataforma; (3) renderização da data em `formatarComentarios` em content.js. Sem novo estado, sem nova interface — apenas extensão do objeto de comentário e atualização de template.

**Tech Stack:** JavaScript (Chrome Extension MV3), `chrome.storage.local`, DOM/Vue instance inspection

---

## Mapa de arquivos

| Arquivo | Mudança |
|---|---|
| `caveira-cards/popup.html` | Adicionar `checked` ao `<input id="toggle-manual">` |
| `caveira-cards/popup.js` | Renomear chave, corrigir default, adicionar migração |
| `caveira-cards/content.js` | Renomear variável/chave, corrigir default, atualizar `onChanged`, atualizar `formatarComentarios`, adicionar migração |
| `caveira-cards/sites/tec.js` | Adicionar `dataPublicacao` em `capturarComentariosAlunos` |
| `caveira-cards/sites/gran.js` | Adicionar `dataPublicacao` em `capturarComentarios` |
| `caveira-cards/sites/qconcurso.js` | Adicionar `dataPublicacao` em `capturarComentarios` |

---

### Task 1: Renomear chave de storage + corrigir defaults + migração

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/popup.html:301-305`
- Modify: `extensao-caveira-cards/caveira-cards/popup.js:187-212`
- Modify: `extensao-caveira-cards/caveira-cards/content.js:25-62, 578-596`

- [ ] **Step 1: Adicionar `checked` ao toggle de alunos em popup.html**

Localizar linha 302 em `popup.html`:
```html
      <input type="checkbox" id="toggle-manual">
```
Substituir por:
```html
      <input type="checkbox" id="toggle-manual" checked>
```

- [ ] **Step 2: Atualizar popup.js — renomear chave + default + migração**

Substituir o bloco `chrome.storage.local.get` das linhas 187-194:

**ANTES:**
```js
chrome.storage.local.get(
  ["caveiraCardsEnabled", "manualCommentCaptureEnabled", "professorCommentCaptureEnabled"],
  ({ caveiraCardsEnabled, manualCommentCaptureEnabled, professorCommentCaptureEnabled }) => {
    atualizarToggle(caveiraCardsEnabled !== false);                     // default: ativo
    atualizarToggleManual(manualCommentCaptureEnabled === true);        // default: inativo
    atualizarToggleProfessor(professorCommentCaptureEnabled !== false); // default: ativo
  }
);
```

**DEPOIS:**
```js
chrome.storage.local.get(
  ["caveiraCardsEnabled", "alunosCommentCaptureEnabled", "manualCommentCaptureEnabled", "professorCommentCaptureEnabled"],
  ({ caveiraCardsEnabled, alunosCommentCaptureEnabled, manualCommentCaptureEnabled: legacyManual, professorCommentCaptureEnabled }) => {
    atualizarToggle(caveiraCardsEnabled !== false);
    atualizarToggleProfessor(professorCommentCaptureEnabled !== false);
    if (legacyManual !== undefined) {
      chrome.storage.local.set({ alunosCommentCaptureEnabled: legacyManual });
      chrome.storage.local.remove("manualCommentCaptureEnabled");
      atualizarToggleManual(legacyManual !== false);
    } else {
      atualizarToggleManual(alunosCommentCaptureEnabled !== false); // default: ativo
    }
  }
);
```

- [ ] **Step 3: Atualizar popup.js — escrita de storage no toggle (linha 204)**

**ANTES:**
```js
  chrome.storage.local.set({ manualCommentCaptureEnabled: ativo });
```

**DEPOIS:**
```js
  chrome.storage.local.set({ alunosCommentCaptureEnabled: ativo });
```

- [ ] **Step 4: Atualizar content.js — variável local + default (linhas 25-35)**

**ANTES:**
```js
  let manualCommentCaptureEnabled = false;     // default: inativo (alunos)
  let professorCommentCaptureEnabled = true;   // default: ativo  (professor)

  chrome.storage.local.get(
    ["caveiraCardsEnabled", "manualCommentCaptureEnabled", "professorCommentCaptureEnabled"],
    ({ caveiraCardsEnabled, manualCommentCaptureEnabled: manualEnabled, professorCommentCaptureEnabled: profEnabled }) => {
      extensaoAtiva = caveiraCardsEnabled !== false;
      manualCommentCaptureEnabled = manualEnabled === true;
      professorCommentCaptureEnabled = profEnabled !== false; // undefined → true
    }
  );
```

**DEPOIS:**
```js
  let alunosCommentCaptureEnabled = true;      // default: ativo (alunos)
  let professorCommentCaptureEnabled = true;   // default: ativo (professor)

  chrome.storage.local.get(
    ["caveiraCardsEnabled", "alunosCommentCaptureEnabled", "manualCommentCaptureEnabled", "professorCommentCaptureEnabled"],
    ({ caveiraCardsEnabled, alunosCommentCaptureEnabled: alunosEnabled, manualCommentCaptureEnabled: legacyManual, professorCommentCaptureEnabled: profEnabled }) => {
      extensaoAtiva = caveiraCardsEnabled !== false;
      professorCommentCaptureEnabled = profEnabled !== false;
      if (legacyManual !== undefined) {
        chrome.storage.local.set({ alunosCommentCaptureEnabled: legacyManual });
        chrome.storage.local.remove("manualCommentCaptureEnabled");
        alunosCommentCaptureEnabled = legacyManual !== false;
      } else {
        alunosCommentCaptureEnabled = alunosEnabled !== false; // undefined → true
      }
    }
  );
```

- [ ] **Step 5: Atualizar content.js — `onChanged.addListener` (linhas 47-48)**

**ANTES:**
```js
    if ("manualCommentCaptureEnabled" in changes) {
      manualCommentCaptureEnabled = changes.manualCommentCaptureEnabled.newValue === true;
    }
```

**DEPOIS:**
```js
    if ("alunosCommentCaptureEnabled" in changes) {
      alunosCommentCaptureEnabled = changes.alunosCommentCaptureEnabled.newValue !== false;
    }
```

- [ ] **Step 6: Atualizar content.js — click handler e funções (linhas 56-62 e 578-596)**

Linha 62 — **ANTES:**
```js
    if (!extensaoAtiva || !manualCommentCaptureEnabled) return;
```
**DEPOIS:**
```js
    if (!extensaoAtiva || !alunosCommentCaptureEnabled) return;
```

Comentário bloco linha 56 — **ANTES:**
```js
  // Semântica do toggle `manualCommentCaptureEnabled` (conforme SKILL.md):
  //   • Professor é SEMPRE enviado automaticamente (obrigatório).
  //   • ALUNOS são enviados automaticamente APENAS com o toggle ATIVADO.
  //   • O clique no 👍 permite ao usuário adicionar 1 comentário avulso
  //     de aluno ao card existente (respeita o mesmo toggle).
```
**DEPOIS:**
```js
  // Semântica do toggle `alunosCommentCaptureEnabled`:
  //   • Professor é SEMPRE enviado automaticamente (obrigatório).
  //   • ALUNOS são enviados automaticamente quando o toggle está ATIVO (default: ativo).
  //   • O clique no 👍 permite ao usuário adicionar 1 comentário avulso
  //     de aluno ao card existente (respeita o mesmo toggle).
```

Função `coletarComentariosDeAlunos` linha 596 — **ANTES:**
```js
  function coletarComentariosDeAlunos() {
    return manualCommentCaptureEnabled === true;
  }
```
**DEPOIS:**
```js
  function coletarComentariosDeAlunos() {
    return alunosCommentCaptureEnabled;
  }
```

Comentário bloco linha 578 — **ANTES:**
```js
       • manualCommentCaptureEnabled     → default FALSE
```
**DEPOIS:**
```js
       • alunosCommentCaptureEnabled     → default TRUE
```

Também linha 205 — **ANTES:**
```js
      // respeitando o toggle `manualCommentCaptureEnabled` (alunos).
```
**DEPOIS:**
```js
      // respeitando o toggle `alunosCommentCaptureEnabled` (alunos).
```

- [ ] **Step 7: Commit Task 1**

```bash
git add extensao-caveira-cards/caveira-cards/popup.html \
        extensao-caveira-cards/caveira-cards/popup.js \
        extensao-caveira-cards/caveira-cards/content.js
git commit -m "refactor: rename manualCommentCaptureEnabled to alunosCommentCaptureEnabled, enable by default, add storage migration"
```

---

### Task 2: Adicionar `dataPublicacao` ao adapter TEC Concursos

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/sites/tec.js` — função `capturarComentariosAlunos` (linha ~430)

- [ ] **Step 1: Localizar o map de items em `capturarComentariosAlunos`**

Abrir `sites/tec.js`, localizar linha ~430 onde começa:
```js
        const items = Array.from(ul.querySelectorAll("li"))
          .map(li => {
```

- [ ] **Step 2: Adicionar captura de data no objeto retornado**

**ANTES** (linha ~453-454):
```js
            // Props com _ são ignoradas pela serialização (anki.js usa só html/score/type)
            return { score, html, type: "aluno", _liEl: li, _btnLike: btnLike };
```

**DEPOIS:**
```js
            // Captura data de publicação se disponível no DOM
            const dataEl = li.querySelector(
              ".discussao-comentario-data, .comentario-data, time, [class*='comentario'][class*='data']"
            );
            const rawData = dataEl?.textContent?.trim() || "";
            // Aceitar somente strings que contenham dígitos (evita textos como "há 2 dias")
            const dataPublicacao = rawData && /\d{2}[/\-.]\d{2}[/\-.]\d{2,4}/.test(rawData)
              ? rawData
              : undefined;

            // Props com _ são ignoradas pela serialização (anki.js usa só html/score/type)
            return { score, html, type: "aluno", dataPublicacao, _liEl: li, _btnLike: btnLike };
```

- [ ] **Step 3: Commit Task 2**

```bash
git add extensao-caveira-cards/caveira-cards/sites/tec.js
git commit -m "feat: capture comment publication date in TEC Concursos adapter"
```

---

### Task 3: Adicionar `dataPublicacao` ao adapter Gran Questões

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/sites/gran.js` — função `capturarComentarios` (linha ~153)

- [ ] **Step 1: Localizar o map de alunos em `capturarComentarios`**

Abrir `sites/gran.js`, localizar linha ~154:
```js
        const displayed = vm.$data?.comments?.displayed || [];
        const items = displayed.map(c => {
          const score = c.curtidas || c.likes || c.total_curtidas || 0;
          const html = sanitizarHtml(c.texto || c.conteudo || c.content || "");
          if (!html || html.length < 10) return null;
          return { score, html };
        }).filter(Boolean);
```

- [ ] **Step 2: Adicionar captura de data via campos do Vue data**

**DEPOIS:**
```js
        const displayed = vm.$data?.comments?.displayed || [];
        const items = displayed.map(c => {
          const score = c.curtidas || c.likes || c.total_curtidas || 0;
          const html = sanitizarHtml(c.texto || c.conteudo || c.content || "");
          if (!html || html.length < 10) return null;

          // Captura data de publicação a partir dos campos do Vue data
          const rawData = c.created_at || c.data || c.publicadoEm || c.date || c.dataCriacao;
          let dataPublicacao;
          if (rawData) {
            const d = new Date(rawData);
            dataPublicacao = isNaN(d.getTime())
              ? (typeof rawData === "string" && /\d/.test(rawData) ? rawData.trim() : undefined)
              : d.toLocaleDateString("pt-BR");
          }

          return { score, html, dataPublicacao };
        }).filter(Boolean);
```

- [ ] **Step 3: Commit Task 3**

```bash
git add extensao-caveira-cards/caveira-cards/sites/gran.js
git commit -m "feat: capture comment publication date in Gran Questões adapter"
```

---

### Task 4: Adicionar `dataPublicacao` ao adapter QConcursos

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/sites/qconcurso.js` — função `capturarComentarios` (linha ~326)

- [ ] **Step 1: Localizar o map de commentBlocks em `capturarComentarios`**

Abrir `sites/qconcurso.js`, localizar linha ~326:
```js
          const items = commentBlocks.map(block => {
            const textEl = block.querySelector(".js-question-comment-text, .q-comment-text, .q-lesson-text");
            if (!textEl) return null;
            const likesEl = block.querySelector(".js-likes, .q-likes");
            const score = likesEl ? (parseInt(likesEl.textContent.trim(), 10) || 0) : 0;
            const html = sanitizarHtml(textEl.innerHTML);
            if (!html || html.length < 5) return null;
            return { score, html };
          }).filter(Boolean);
```

- [ ] **Step 2: Adicionar captura de data via DOM do bloco**

**DEPOIS:**
```js
          const items = commentBlocks.map(block => {
            const textEl = block.querySelector(".js-question-comment-text, .q-comment-text, .q-lesson-text");
            if (!textEl) return null;
            const likesEl = block.querySelector(".js-likes, .q-likes");
            const score = likesEl ? (parseInt(likesEl.textContent.trim(), 10) || 0) : 0;
            const html = sanitizarHtml(textEl.innerHTML);
            if (!html || html.length < 5) return null;

            // Captura data de publicação se disponível no DOM do bloco
            const dataEl = block.querySelector("time, .date, .created-at, [class*='date'], [class*='data']");
            const rawData = dataEl?.getAttribute("datetime") || dataEl?.textContent?.trim();
            let dataPublicacao;
            if (rawData) {
              const d = new Date(rawData);
              dataPublicacao = isNaN(d.getTime())
                ? (/\d/.test(rawData) ? rawData.trim() : undefined)
                : d.toLocaleDateString("pt-BR");
            }

            return { score, html, dataPublicacao };
          }).filter(Boolean);
```

- [ ] **Step 3: Commit Task 4**

```bash
git add extensao-caveira-cards/caveira-cards/sites/qconcurso.js
git commit -m "feat: capture comment publication date in QConcursos adapter"
```

---

### Task 5: Renderizar `dataPublicacao` em `formatarComentarios`

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/content.js:497-499`

- [ ] **Step 1: Localizar `htmlAlunos` em `formatarComentarios` (linha ~497)**

Abrir `content.js`, localizar:
```js
    const htmlAlunos = alunos.map(c =>
      `<div class="cc-comentario"><span class="cc-score">▲ ${c.score}</span><div>${window.CaveiraCardBuilder.sanitizar(c.html)}</div></div>`
    ).join("");
```

- [ ] **Step 2: Adicionar `dataPublicacao` no template**

**DEPOIS:**
```js
    const htmlAlunos = alunos.map(c =>
      `<div class="cc-comentario"><span class="cc-score">▲ ${c.score}${c.dataPublicacao ? ' · ' + c.dataPublicacao : ''}</span><div>${window.CaveiraCardBuilder.sanitizar(c.html)}</div></div>`
    ).join("");
```

Resultado visual no Anki para um comentário com data: `▲ 42 · 15/03/2024`
Resultado visual sem data: `▲ 42` (sem alteração)

- [ ] **Step 3: Commit Task 5**

```bash
git add extensao-caveira-cards/caveira-cards/content.js
git commit -m "feat: display comment publication date in Anki card alongside score"
```

---

### Task 6: Verificação manual e commit de integração

- [ ] **Step 1: Recarregar a extensão**

Abrir `chrome://extensions` → CaveiraCards → clicar no ícone de reload. Confirmar que não há erro de sintaxe na aba.

- [ ] **Step 2: Verificar toggle padrão ativo**

Abrir o popup → confirmar que "Salvar comentários dos alunos" aparece marcado (checkbox ativo) por padrão em uma instalação limpa.

Para simular instalação limpa:
```js
// Console da página de extensões (background):
chrome.storage.local.remove(["manualCommentCaptureEnabled", "alunosCommentCaptureEnabled"]);
```
Fechar e reabrir o popup — toggle deve aparecer marcado.

- [ ] **Step 3: Verificar migração de chave antiga**

```js
// Simular usuário com chave antiga desativada:
chrome.storage.local.set({ manualCommentCaptureEnabled: false });
```
Reabrir popup — toggle deve aparecer DESMARCADO (respeitou o valor antigo). Verificar no DevTools:
```js
chrome.storage.local.get(["manualCommentCaptureEnabled", "alunosCommentCaptureEnabled"], console.log);
// Esperado: { alunosCommentCaptureEnabled: false }  (a chave antiga foi removida)
```

- [ ] **Step 4: Verificar captura de data (TEC)**

Responder uma questão no TEC Concursos → enviar para Anki → abrir o card no Anki e verificar se os comentários de alunos exibem `▲ N · DD/MM/AAAA` quando a data estava visível na página.

- [ ] **Step 5: Verificar que omissão funciona corretamente**

Para plataformas onde a data não está no DOM, o score deve aparecer sem data: `▲ N` (sem " · ").
