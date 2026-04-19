# Session Caderno Tag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When starting a study session the user can type a caderno name (auto-suggested from TEC DOM); every Anki card sent during that session gets tagged `caderno::<slug>::erros|revisao`, and the caderno name is stored in session history.

**Architecture:** Four-file change: (1) `anki.js` gains an `extraTags` parameter; (2) `tec.js` responds to a `getCadernoName` message; (3) `content.js` reads the caderno from `sessaoAtiva` and passes it as `extraTags`; (4) popup and history UIs surface the caderno name. No new files created.

**Tech Stack:** Chrome Extension MV3, `chrome.storage.local`, `chrome.tabs.sendMessage`, vanilla JS.

---

## File Map

| File | Change |
|------|--------|
| `extensao-caveira-cards/caveira-cards/shared/anki.js` | Add `extraTags = []` parameter to `enviarQuestao`, spread into tags array |
| `extensao-caveira-cards/caveira-cards/sites/tec.js` | Add `chrome.runtime.onMessage` handler for `getCadernoName` after `window.CaveiraCardsAdapter` |
| `extensao-caveira-cards/caveira-cards/content.js` | In `enviarParaAnki`: read `sessaoAtiva.caderno`, build slug, call `enviarQuestao` with `extraTags` |
| `extensao-caveira-cards/caveira-cards/popup.html` | Add `session-starting` div (input + confirm/cancel), `#session-caderno` label in active state, `#summary-caderno` in summary state, input CSS |
| `extensao-caveira-cards/caveira-cards/popup.js` | Wire `session-starting` state: query TEC tab, prefill input, start session with caderno; display caderno in active/summary; propagate caderno to `historicoSessoes` |
| `extensao-caveira-cards/caveira-cards/sessoes.js` | In `finalizarSessaoAtiva`: add `caderno` to `novaSessao`; in `renderizar`: show `📓 caderno` in date cell |

---

### Task 1: Add `extraTags` parameter to `enviarQuestao` in `anki.js`

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/shared/anki.js:420-430`

- [ ] **Step 1: Change the function signature and spread `extraTags` into the tags array**

Open `shared/anki.js`. Find `async function enviarQuestao(questao, frente, verso)` at line 420.

Replace:
```js
async function enviarQuestao(questao, frente, verso) {
    const resultado = questao.resultado;
    const deckName  = await criarDecks(questao.plataforma, resultado, questao.materiaLimpa);

    const tags = [
      "caveira-cards",
      resultado === "Erros" ? "caderno-de-erros" : "revisao",
      questao.plataforma.toLowerCase().replace(/\s+/g, "-"),
      questao.materiaLimpa.toLowerCase().replace(/[\s:/\\?*^]/g, "-"),
    ].filter(Boolean);
```

With:
```js
async function enviarQuestao(questao, frente, verso, extraTags = []) {
    const resultado = questao.resultado;
    const deckName  = await criarDecks(questao.plataforma, resultado, questao.materiaLimpa);

    const tags = [
      "caveira-cards",
      resultado === "Erros" ? "caderno-de-erros" : "revisao",
      questao.plataforma.toLowerCase().replace(/\s+/g, "-"),
      questao.materiaLimpa.toLowerCase().replace(/[\s:/\\?*^]/g, "-"),
      ...extraTags,
    ].filter(Boolean);
```

- [ ] **Step 2: Verify `window.CaveiraAnki` export still includes `enviarQuestao`**

At the end of `anki.js` (line 568) confirm this line is unchanged:
```js
window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra, buscarNotas };
```

- [ ] **Step 3: Commit**

```bash
cd /Users/isakielsouza/projects/sistema-estudo-concursos
git add extensao-caveira-cards/caveira-cards/shared/anki.js
git commit -m "feat: add extraTags parameter to enviarQuestao"
```

---

### Task 2: Add `getCadernoName` message handler to TEC adapter

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/sites/tec.js:549-550`

- [ ] **Step 1: Add listener after `window.CaveiraCardsAdapter` closes**

Open `sites/tec.js`. Find the last two lines (549-550):
```js
  };
})();
```

Replace with:
```js
  };

  // Responde ao popup quando ele pede o nome do caderno ativo
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action !== "getCadernoName") return false;
    const el = document.querySelector(".caderno-subtitulo-secao-nome .titulo");
    sendResponse({ caderno: el?.textContent?.trim() || null });
    return false;
  });
})();
```

- [ ] **Step 2: Verify it compiles (no syntax error)**

Open Chrome → `chrome://extensions` → reload the extension → open TEC Concursos → open DevTools → confirm no errors in console.

- [ ] **Step 3: Manual test**

In TEC DevTools console, run:
```js
chrome.runtime.sendMessage({ action: "getCadernoName" }, r => console.log(r));
```
Expected: `{ caderno: "04. DESAFIO 200 Q PRF | 04" }` (or the actual caderno name shown on the page), or `{ caderno: null }` if no caderno is shown.

- [ ] **Step 4: Commit**

```bash
git add extensao-caveira-cards/caveira-cards/sites/tec.js
git commit -m "feat: add getCadernoName message handler to TEC adapter"
```

---

### Task 3: Pass caderno tag via `extraTags` in `content.js`

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/content.js:750-801`

- [ ] **Step 1: Replace `enviarParaAnki` with the version that reads caderno from storage**

Find `async function enviarParaAnki(questao)` at line 750. Replace the entire function with:

```js
async function enviarParaAnki(questao) {
  const overlay = overlayEl;
  if (!overlay) return;
  const titleEl = overlay.querySelector(".cc-title");
  const subEl = overlay.querySelector(".cc-sub");

  titleEl.textContent = "Enviando...";
  overlay.classList.add("loading");

  try {
    const { frente, verso } = window.CaveiraCardBuilder.montarCard(questao);

    // Build caderno tag if active session has a caderno name
    const extraTags = [];
    try {
      const { sessaoAtiva } = await chrome.storage.local.get("sessaoAtiva");
      if (sessaoAtiva?.caderno) {
        const slug = sessaoAtiva.caderno
          .toLowerCase()
          .replace(/[|.\s/\\]+/g, "-")
          .replace(/-{2,}/g, "-")
          .replace(/^-|-$/g, "");
        const res = questao.resultado === "Erros" ? "erros" : "revisao";
        extraTags.push(`caderno::${slug}::${res}`);
      }
    } catch { /* caderno tag is optional — ignore if storage unavailable */ }

    const noteId = await window.CaveiraAnki.enviarQuestao(questao, frente, verso, extraTags);

    noteIdAtual = noteId;
    overlay.classList.remove("loading", "errou", "acertou");
    overlay.classList.add("sucesso");
    titleEl.textContent = "Adicionado! ✓";

    // ── Auto-captura de comentários (TEC) ──
    if (adapter.nomePlataforma === "TEC Concursos") {
      autoCapturarComentarios(adapter, questao, noteId);
    }

  } catch (err) {
    overlay.classList.remove("loading");

    if (err.message.includes("duplicate")) {
      overlay.classList.remove("errou", "acertou");
      overlay.classList.add("sucesso");
      titleEl.textContent = "Já está no Anki ✓";
      subEl.textContent = "Questão duplicada";
    } else {
      overlay.classList.add("falha");
      if (err.message.includes("Failed to fetch")) {
        titleEl.textContent = "Anki Fechado";
        subEl.textContent = "Abra o Anki e tente novamente";
      } else {
        titleEl.textContent = "Erro ao enviar";
        subEl.textContent = err.message.substring(0, 40);
      }

      setTimeout(() => {
        if (!overlay.isConnected) return;
        overlay.classList.remove("falha");
        titleEl.textContent = "Adicionar ao Anki";
        subEl.textContent = `${questao.resultado} · ${questao.materia}`;
      }, 4000);
    }
  }
}
```

- [ ] **Step 2: Verify the function is still called the same way**

Search for `enviarParaAnki(questao)` in `content.js` — it should appear at line ~482 inside the overlay click handler. Confirm it has not changed.

- [ ] **Step 3: Commit**

```bash
git add extensao-caveira-cards/caveira-cards/content.js
git commit -m "feat: inject caderno tag into Anki card via extraTags"
```

---

### Task 4: Add caderno input UI to `popup.html`

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/popup.html`

- [ ] **Step 1: Add CSS for the caderno input field inside the `<style>` block**

Find the closing `</style>` tag (line 272). Just before it, add:

```css
  /* ── Caderno input (session starting state) ── */
  .session-starting {
    padding: 10px 14px;
  }
  .session-starting-label {
    font-size: 11px;
    color: #64748b;
    margin-bottom: 6px;
  }
  #input-caderno {
    width: 100%;
    background: #080d1a;
    border: 1px solid #1e2d4d;
    border-radius: 6px;
    padding: 7px 10px;
    color: #e2e8f0;
    font-size: 12px;
    margin-bottom: 8px;
    outline: none;
    box-sizing: border-box;
  }
  #input-caderno:focus { border-color: #3b6ff5; }
  .starting-actions { display: flex; gap: 6px; }
  .btn-cancelar-sessao {
    background: transparent;
    border: 1px solid #1e2d4d;
    border-radius: 6px;
    color: #475569;
    font-size: 11px;
    padding: 4px 10px;
    cursor: pointer;
    transition: border-color .15s, color .15s;
  }
  .btn-cancelar-sessao:hover { border-color: #3b6ff5; color: #94a3b8; }
  /* ── Caderno label in active/summary states ── */
  .session-caderno-label {
    font-size: 11px;
    color: #64748b;
    text-align: center;
    margin-top: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
```

- [ ] **Step 2: Add `session-starting` div inside `session-box`, after `session-idle`**

Find `<!-- Estado: ativa -->` (line 329). Insert before it:

```html
    <!-- Estado: iniciando (input caderno) -->
    <div class="session-starting" id="session-starting" style="display:none">
      <div class="session-starting-label">📓 Nome do caderno (opcional)</div>
      <input type="text" id="input-caderno" placeholder="Ex: 04. DESAFIO 200 Q PRF | 04">
      <div class="starting-actions">
        <button class="btn-iniciar" id="btn-confirmar-sessao" style="flex: 1;">▶ Confirmar</button>
        <button class="btn-cancelar-sessao" id="btn-cancelar-sessao">Cancelar</button>
      </div>
    </div>

```

- [ ] **Step 3: Add `#session-caderno` label inside the active session block**

Find `<button class="btn-encerrar" id="btn-encerrar">⏹ Encerrar sessão</button>` (line 344). Add after it:

```html
      <div class="session-caderno-label" id="session-caderno"></div>
```

- [ ] **Step 4: Add `#summary-caderno` label inside the summary block**

Find `<div class="summary-val" id="summary-val">—</div>` (line 352). Add after it:

```html
      <div class="session-caderno-label" id="summary-caderno"></div>
```

- [ ] **Step 5: Commit**

```bash
git add extensao-caveira-cards/caveira-cards/popup.html
git commit -m "feat: add caderno input UI to popup session flow"
```

---

### Task 5: Wire caderno session logic in `popup.js`

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/popup.js`

- [ ] **Step 1: Add `session-starting` to `mostrarEstado`**

Find `function mostrarEstado(estado)` (line 50). Replace the whole function with:

```js
function mostrarEstado(estado) {
  sessionIdle.style.display    = estado === "idle"     ? "flex"  : "none";
  document.getElementById("session-starting").style.display = estado === "starting" ? "block" : "none";
  sessionActive.style.display  = estado === "active"   ? "block" : "none";
  sessionSummary.style.display = estado === "summary"  ? "block" : "none";
}
```

- [ ] **Step 2: Update the initial state reader to show caderno in active/summary**

Find `chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {` (line 64). Replace the entire block (lines 64-76) with:

```js
chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
  if (sessaoAtiva && sessaoAtiva.ativa) {
    mostrarEstado("active");
    questoesEl.textContent = sessaoAtiva.questoes || 0;
    acertosEl.textContent  = sessaoAtiva.acertos  || 0;
    iniciarTimer(sessaoAtiva.inicio);
    const cadernoEl = document.getElementById("session-caderno");
    if (cadernoEl) cadernoEl.textContent = sessaoAtiva.caderno ? `📓 ${sessaoAtiva.caderno}` : "";
  } else if (sessaoAtiva && !sessaoAtiva.ativa && sessaoAtiva.resumo) {
    summaryValEl.textContent = sessaoAtiva.resumo;
    const summaryC = document.getElementById("summary-caderno");
    if (summaryC) summaryC.textContent = sessaoAtiva.caderno ? `📓 ${sessaoAtiva.caderno}` : "";
    mostrarEstado("summary");
  } else {
    mostrarEstado("idle");
  }
});
```

- [ ] **Step 3: Replace the "Iniciar" button handler with the async version that shows the input**

Find `document.getElementById("btn-iniciar").addEventListener("click", () => {` (line 79). Replace the entire handler (lines 79-86) with:

```js
document.getElementById("btn-iniciar").addEventListener("click", async () => {
  let cadernoDetectado = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes("tecconcursos.com.br")) {
      const resp = await chrome.tabs.sendMessage(tab.id, { action: "getCadernoName" });
      cadernoDetectado = resp?.caderno || "";
    }
  } catch { /* not on TEC or content script not ready — leave field empty */ }
  document.getElementById("input-caderno").value = cadernoDetectado;
  mostrarEstado("starting");
});
```

- [ ] **Step 4: Add "Confirmar" and "Cancelar" handlers after the Iniciar handler**

After the Iniciar handler, add:

```js
// Confirmar sessão (com ou sem caderno)
document.getElementById("btn-confirmar-sessao").addEventListener("click", () => {
  const caderno = document.getElementById("input-caderno").value.trim() || undefined;
  const sessao = { inicio: Date.now(), questoes: 0, acertos: 0, ativa: true, caderno };
  chrome.storage.local.set({ sessaoAtiva: sessao });
  questoesEl.textContent = 0;
  acertosEl.textContent  = 0;
  const cadernoEl = document.getElementById("session-caderno");
  if (cadernoEl) cadernoEl.textContent = caderno ? `📓 ${caderno}` : "";
  iniciarTimer(sessao.inicio);
  mostrarEstado("active");
});

// Cancelar — volta para idle
document.getElementById("btn-cancelar-sessao").addEventListener("click", () => {
  mostrarEstado("idle");
});
```

- [ ] **Step 5: Add caderno to `novaSessao` in the "Encerrar" handler**

Find `const novaSessao = {` inside `btn-encerrar` handler (around line 108). Add `caderno` field:

```js
    const novaSessao = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-BR"),
      inicio: sessaoAtiva.inicio,
      fim: agora,
      duracaoMs,
      duracaoStr: formatarTimer(duracaoMs),
      questoes,
      acertos,
      aproveitamento: questoes > 0 ? Math.round((acertos / questoes) * 100) + "%" : "0%",
      mediaTempoMs,
      mediaTempoStr: mediaTempoMs > 0 ? formatarTimer(mediaTempoMs) : "-",
      materias: listaMaterias,
      caderno: sessaoAtiva.caderno || null,
      detalhesPorMateria: agruparPorMateria(detalhes),
      detalhes: detalhes
    };
```

- [ ] **Step 6: Show caderno in summary state after Encerrar**

Find `summaryValEl.textContent = resumo;` inside the btn-encerrar handler (line 132). Add after it:

```js
    const summaryC = document.getElementById("summary-caderno");
    if (summaryC) summaryC.textContent = sessaoAtiva.caderno ? `📓 ${sessaoAtiva.caderno}` : "";
```

- [ ] **Step 7: Commit**

```bash
git add extensao-caveira-cards/caveira-cards/popup.js
git commit -m "feat: wire caderno input flow and persist caderno in session history"
```

---

### Task 6: Display caderno in session history (`sessoes.js`)

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/sessoes.js:162-207` (finalizarSessaoAtiva)
- Modify: `extensao-caveira-cards/caveira-cards/sessoes.js:109-133` (renderizar history rows)
- Modify: `extensao-caveira-cards/caveira-cards/sessoes.js:84-106` (renderizar active session row)

- [ ] **Step 1: Add `caderno` to `novaSessao` in `finalizarSessaoAtiva`**

Find `const novaSessao = {` inside `finalizarSessaoAtiva` (line ~180). Replace the object literal with:

```js
      const novaSessao = {
        id: Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        inicio: sessaoAtiva.inicio,
        fim: agora,
        duracaoMs,
        duracaoStr: formatarTimer(duracaoMs),
        questoes: q,
        acertos: a,
        aproveitamento: q > 0 ? Math.round((a / q) * 100) + "%" : "0%",
        mediaTempoMs,
        mediaTempoStr: mediaTempoMs > 0 ? formatarTimer(mediaTempoMs) : "-",
        materias: listaMaterias || "Sessão sem questões mapeadas",
        caderno: sessaoAtiva.caderno || null,
        detalhesPorMateria: agruparPorMateria(detalhes),
        detalhes: detalhes
      };
```

- [ ] **Step 2: Show caderno in active session row**

Find the active session row template inside `renderizar` (around line 92). It starts with:
```js
      html += `
        <tr style="background: rgba(59, 111, 245, 0.1); border-left: 4px solid #3b6ff5;">
          <td class="row-data"><span style="background: #3b6ff5; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 8px;">AO VIVO</span> ${new Date(sessaoAtiva.inicio).toLocaleDateString("pt-BR")}</td>
```

Replace with:

```js
      const cadernoAtivoHtml = sessaoAtiva.caderno
        ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">📓 ${sessaoAtiva.caderno}</div>`
        : "";

      html += `
        <tr style="background: rgba(59, 111, 245, 0.1); border-left: 4px solid #3b6ff5;">
          <td class="row-data"><span style="background: #3b6ff5; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 8px;">AO VIVO</span> ${new Date(sessaoAtiva.inicio).toLocaleDateString("pt-BR")}${cadernoAtivoHtml}</td>
```

- [ ] **Step 3: Show caderno in history rows**

Find inside the `historico.map(sessao => {` block (around line 112):

```js
      return `
        <tr>
          <td class="row-data">${sessao.data}</td>
```

Replace with:

```js
      const cadernoHtml = sessao.caderno
        ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;" title="${sessao.caderno}">📓 ${sessao.caderno}</div>`
        : "";

      return `
        <tr>
          <td class="row-data">${sessao.data}${cadernoHtml}</td>
```

- [ ] **Step 4: Commit**

```bash
git add extensao-caveira-cards/caveira-cards/sessoes.js
git commit -m "feat: show caderno in session history"
```

---

## End-to-End Manual Test

After all tasks are complete, verify the full flow:

1. Open Chrome with the extension loaded
2. Open TEC Concursos on a caderno page (e.g. `04. DESAFIO 200 Q PRF | 04`)
3. Click the CaveiraCards popup icon
4. Click **Iniciar** — the caderno input should appear pre-filled with `04. DESAFIO 200 Q PRF | 04`
5. Edit the name if desired, then click **Confirmar**
6. Answer a question on TEC → click overlay to send to Anki
7. In Anki Browser, search `tag:caderno::04-desafio*` — the card should appear
8. Also verify `tag:caderno::04-desafio*::erros` or `::revisao` depending on result
9. End the session in popup → caderno name appears in summary
10. Open **Ver Histórico** → the session row shows `📓 04. DESAFIO 200 Q PRF | 04`
