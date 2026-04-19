# Session Caderno Tag — Design Spec

**Date:** 2026-04-19
**Feature:** Associate a study session with a TEC Concursos caderno, tagging all Anki cards sent during that session with `caderno::slug::resultado`.

---

## Context

Users do weekly group challenges ("desafios") using named question booklets ("cadernos") on TEC Concursos. Example caderno name: `04. DESAFIO 200 Q PRF | 04`. Cards saved to Anki during such a session currently have no association with the caderno, making it impossible to filter all errors or revision cards from a specific challenge.

---

## Goals

- Allow a session to be named after a caderno before it starts
- Automatically tag every Anki card sent during that session with `caderno::slug::resultado`
- Store the caderno name in session history for reference
- Auto-detect the caderno name from TEC Concursos DOM; user can edit or clear it
- TEC Concursos only (for now)

---

## Non-Goals

- Deck hierarchy changes (tags only, no new deck levels)
- Auto-detect on Gran / QConcursos
- Mandatory caderno name (field is always optional)

---

## Design

### 1. Storage Shape

`sessaoAtiva` in `chrome.storage.local` gains one optional field:

```js
sessaoAtiva: {
  inicio:          number,
  questoes:        number,
  acertos:         number,
  ativa:           boolean,
  ultimaAtividade: number,
  detalhes:        Array,
  caderno?:        string   // raw user-confirmed name, e.g. "04. DESAFIO 200 Q PRF | 04"
                            // undefined when no caderno was set
}
```

`historicoSessoes` entries gain the same field:

```js
novaSessao: {
  // ... existing fields ...
  caderno: sessaoAtiva.caderno || null,   // null when no caderno
}
```

### 2. Popup UI Flow

**Trigger:** User clicks "Iniciar" button.

**Steps:**
1. Query active tab URL. If hostname is `tecconcursos.com.br`, send `chrome.tabs.sendMessage({ action: "getCadernoName" })` to content script.
2. Receive response `{ caderno: string | null }` (or catch timeout/error → treat as `null`).
3. Expand a caderno input section below the "Iniciar" button:
   - Text input, `placeholder="Nome do caderno (opcional)"`
   - Pre-filled with detected caderno name (empty if null / not on TEC)
   - A **Confirmar** button that starts the session
4. On confirm: `sessaoAtiva.caderno = input.value.trim() || undefined`
5. If no TEC tab / no caderno detected, the field is still shown but empty — user can type manually or leave blank.

**Session display:** While a session with a caderno is active, show the caderno name below the stats in the active session box: `📓 04. DESAFIO 200 Q PRF | 04` (truncated with ellipsis if too long).

**Session summary:** Show `📓 <caderno>` in the summary value when set.

### 3. TEC Adapter — Message Handler

Add to `sites/tec.js`:

```js
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action !== "getCadernoName") return false;
  const el = document.querySelector(".caderno-subtitulo-secao-nome .titulo");
  sendResponse({ caderno: el?.textContent?.trim() || null });
  return false;
});
```

Selector: `.caderno-subtitulo-secao-nome .titulo` — already confirmed present in TEC DOM.

### 4. Tag Injection in Anki Send

In `content.js`, inside `enviarParaAnki()`, after building the `tags` array, add caderno tag if session has a caderno:

**Name normalization:**
```
"04. DESAFIO 200 Q PRF | 04"
  → lowercase:          "04. desafio 200 q prf | 04"
  → replace [|.\s/\\]+: "04-desafio-200-q-prf-04"
  → collapse --:        "04-desafio-200-q-prf-04"
  → trim leading/trail: "04-desafio-200-q-prf-04"
```

**Tags added:**
```
caderno::04-desafio-200-q-prf-04::erros     ← quando resultado === "Erros"
caderno::04-desafio-200-q-prf-04::revisao   ← quando resultado !== "Erros"
```

**Implementation pattern:**
```js
// Inside enviarParaAnki(), after tags array is built, before ankiRequest
chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
  if (sessaoAtiva?.caderno) {
    const slug = sessaoAtiva.caderno
      .toLowerCase()
      .replace(/[|.\s/\\]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "");
    const res = questao.resultado === "Erros" ? "erros" : "revisao";
    tags.push(`caderno::${slug}::${res}`);
  }
  // proceed with ankiRequest("addNote", ...)
});
```

Note: `enviarParaAnki` must be refactored to delay the `ankiRequest` call until inside this storage callback, since it becomes async.

### 5. Session History Display (`sessoes.html`)

Each session entry that has `caderno` set shows it as a subtitle line:
```
📓 04. DESAFIO 200 Q PRF | 04
```
Sessions without `caderno` show nothing extra — no visual regression.

---

## Files Changed

| File | Change |
|------|--------|
| `popup.html` | Add caderno input section (hidden by default, shown on Iniciar click) |
| `popup.js` | Tab query + sendMessage + show input + store caderno in sessaoAtiva; show caderno in active/summary states |
| `sites/tec.js` | Add `chrome.runtime.onMessage` handler for `getCadernoName` |
| `content.js` | In `enviarParaAnki()`: read `sessaoAtiva.caderno`, build slug, push tag before sending |
| `sessoes.html` | Render `caderno` field in session history rows |

---

## Anki Filter Examples

| Goal | Filter |
|------|--------|
| Tudo do caderno 04 | `tag:caderno::04-desafio*` |
| Erros do caderno 04 | `tag:caderno::04-desafio*::erros` |
| Revisão do caderno 04 | `tag:caderno::04-desafio*::revisao` |
| Todos os cadernos | `tag:caderno::*` |
