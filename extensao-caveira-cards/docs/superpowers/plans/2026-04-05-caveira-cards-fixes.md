# CaveiraCards Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir 3 problemas: popup duplicata fecha em 1s, bug de duplicatas falsas causado por CSS inline no campo Frente, e botão 📎 para capturar comentários de alunos no TEC Concursos.

**Architecture:** A raiz do bug de duplicatas é o bloco `<style>` inline no campo `Frente` — o Anki usa o texto do primeiro campo como "sort field" e o CSS idêntico em todos os cards faz o Anki rejeitá-los. A solução move o CSS para o modelo Anki. O botão 📎 armazena o `noteId` após envio e usa `updateNoteFields` para atualizar o campo `Extra` do card com os top 3 comentários por pontuação.

**Tech Stack:** Chrome Extension (Manifest V3), AnkiConnect HTTP API (localhost:8765), JavaScript vanilla, CSS

---

## Arquivos modificados

| Arquivo | O que muda |
|---------|-----------|
| `caveira-cards/content.js` | Issue 1: timeout duplicata; Issue 2: storage key; Issue 3: noteId, extraOriginal, botão 📎 |
| `caveira-cards/shared/anki.js` | Issue 2: MODEL_CSS, createModel, configurarAnki, updateModelStyling+Templates; Issue 3: retorna noteId, novo atualizarExtra |
| `caveira-cards/shared/card-builder.js` | Issue 2: remove CSS inline dos campos |
| `caveira-cards/shared/overlay.css` | Issue 3: estilo do botão 📎 |
| `caveira-cards/sites/tec.js` | Issue 3: método capturarComentarios |
| `caveira-cards/sites/gran.js` | Issue 3: stub capturarComentarios retorna null |

---

## Task 1: Issue 1 — Popup duplicata fecha em 1 segundo

**Arquivo:** `caveira-cards/content.js`

- [ ] **Localizar o bloco de tratamento de erro duplicata**

No arquivo `caveira-cards/content.js`, linhas ~144-163, o bloco `catch` de `enviarParaAnki`:

```javascript
    } else if (err.message.includes("duplicate")) {
        titleEl.textContent = "Já existe no deck";
        subEl.textContent = "Questão duplicada";
    } else {
        titleEl.textContent = "Erro ao enviar";
        subEl.textContent = err.message.substring(0, 40);
    }

    // Após 4s volta ao estado normal e minimiza
    setTimeout(() => {
        if (!overlay.isConnected) return;
        overlay.classList.remove("falha");
        titleEl.textContent = "Adicionar ao Anki";
        subEl.textContent = `${questao.resultado} · ${questao.materia}`;
        minimizar(overlay);
    }, 4000);
```

- [ ] **Substituir pelo comportamento correto**

O caso `duplicate` agora sai cedo com 1s e remove o overlay. Outros erros mantêm o comportamento de 4s.

```javascript
    } else if (err.message.includes("duplicate")) {
        titleEl.textContent = "Já existe no deck";
        subEl.textContent = "Questão duplicada";
        setTimeout(() => {
            if (!overlay.isConnected) return;
            overlay.remove();
            overlayEl = null;
        }, 1000);
        return;
    } else {
        titleEl.textContent = "Erro ao enviar";
        subEl.textContent = err.message.substring(0, 40);
    }

    // Após 4s volta ao estado normal e minimiza
    setTimeout(() => {
        if (!overlay.isConnected) return;
        overlay.classList.remove("falha");
        titleEl.textContent = "Adicionar ao Anki";
        subEl.textContent = `${questao.resultado} · ${questao.materia}`;
        minimizar(overlay);
    }, 4000);
```

- [ ] **Verificar manualmente**

No Chrome: carregar a extensão, responder uma questão que já foi adicionada ao Anki (ou simular o erro "duplicate" via DevTools). O overlay deve exibir "Já existe no deck" e desaparecer completamente após ~1s.

- [ ] **Commit**

```bash
git add caveira-cards/content.js
git commit -m "fix: popup duplicata fecha em 1s e remove overlay"
```

---

## Task 2: Issue 2 — Remover CSS inline dos campos (card-builder.js)

**Arquivo:** `caveira-cards/shared/card-builder.js`

- [ ] **Remover a constante CSS e sua concatenação**

Substituir o conteúdo completo do arquivo:

```javascript
// shared/card-builder.js
// Monta HTML da frente e verso do card Anki
// Expõe: window.CaveiraCardBuilder = { montarCard }

(function () {
  "use strict";

  const LETRAS = ["A", "B", "C", "D", "E", "F"];

  function sanitizar(html) {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\s+on\w+="[^"]*"/gi, "")
      .replace(/\s+on\w+='[^']*'/gi, "");
  }

  function altFrente(alternativas) {
    return alternativas.map((a, i) => {
      const texto = a.replace(/\s+/g, " ").trim();
      const letra = LETRAS[i] || String(i + 1);
      return `<div class="cc-alt"><span class="cc-letra">${letra}</span><span>${texto}</span></div>`;
    }).join("");
  }

  function altVerso(alternativas, idxCorreta, idxErrada) {
    const ic = Number(idxCorreta);
    const ie = Number(idxErrada);
    return alternativas.map((a, i) => {
      const classe = i === ic ? "cc-alt correta" : i === ie ? "cc-alt errada" : "cc-alt";
      const letra = LETRAS[i] || String(i + 1);
      return `<div class="${classe}"><span class="cc-letra">${letra}</span><span>${a.replace(/\s+/g, " ").trim()}</span></div>`;
    }).join("");
  }

  function montarCard(questao) {
    const frente = `<div class="cc-wrap">
      <div class="cc-meta">
        <span class="cc-tag-plataforma">${questao.plataforma}</span>
        <span class="cc-tag-materia">${questao.materia}</span>
        ${questao.assunto ? `<span class="cc-tag-assunto">${questao.assunto}</span>` : ""}
      </div>
      ${questao.banca ? `<div class="cc-banca">${questao.banca}</div>` : ""}
      <div class="cc-enunciado">${sanitizar(questao.enunciado)}</div>
      <div class="cc-alts">${altFrente(questao.alternativas)}</div>
    </div>`;

    const verso = `<div class="cc-wrap">
      <div class="cc-gabarito-label">Gabarito</div>
      <div class="cc-alts">${altVerso(questao.alternativas, questao.idxCorreta, questao.idxErrada)}</div>
      ${questao.explicacao ? `<div class="cc-explicacao"><strong>Comentário:</strong><br>${sanitizar(questao.explicacao)}</div>` : ""}
      <div class="cc-fonte">
        <a href="${questao.url}" target="_blank">Ver questão — ${questao.plataforma}</a>
        &nbsp;|&nbsp; ${questao.timestamp}
      </div>
    </div>`;

    return { frente, verso };
  }

  window.CaveiraCardBuilder = { montarCard };
})();
```

- [ ] **Commit**

```bash
git add caveira-cards/shared/card-builder.js
git commit -m "fix: remove CSS inline dos campos Frente/Verso — move para modelo Anki"
```

---

## Task 3: Issue 2 — Mover CSS para o modelo Anki (anki.js) + atualizarExtra

**Arquivo:** `caveira-cards/shared/anki.js`

- [ ] **Substituir o conteúdo completo do arquivo**

O `MODEL_CSS` contém todo o CSS original mais os estilos de comentários. `configurarAnki` agora atualiza CSS e template em modelos existentes. `enviarQuestao` retorna `noteId`. Novo método `atualizarExtra`.

```javascript
// shared/anki.js
// Comunicação com AnkiConnect (http://localhost:8765)
// Expõe: window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra }

(function () {
  "use strict";

  const MODEL_CSS = `
.card{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;margin:0;padding:8px;color:#1f2937}
.cc-wrap{max-width:640px;margin:0 auto;padding:4px;color:#1f2937}
.cc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cc-tag-plataforma{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:#1a1a2e;color:#e0e0e0}
.cc-tag-materia{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;background:#dbeafe;color:#1e40af}
.cc-tag-assunto{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;background:#ede9fe;color:#5b21b6}
.cc-banca{font-size:12px;color:#6b7280;margin-bottom:10px;font-style:italic}
.cc-enunciado{font-size:15px;line-height:1.7;color:#1f2937;margin-bottom:14px}
.cc-alts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.cc-alt{display:flex;align-items:center;gap:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #e5e7eb;background:#f9fafb;font-size:13px;line-height:1.3;color:#1f2937}
.cc-alt.correta{background:#f0fdf4;border-color:#22c55e;color:#166534}
.cc-alt.errada{background:#fef2f2;border-color:#ef4444;color:#991b1b}
.cc-letra{min-width:26px;height:26px;border-radius:50%;background:#e5e7eb;color:#374151;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.cc-alt.correta .cc-letra{background:#22c55e;color:white}
.cc-alt.errada .cc-letra{background:#ef4444;color:white}
.cc-gabarito-label{font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;margin-bottom:8px}
.cc-explicacao{margin-top:12px;padding:12px;border-radius:8px;background:#fffbeb;border:1px solid #fcd34d;font-size:13px;color:#92400e;line-height:1.6}
.cc-fonte{margin-top:10px;font-size:11px;color:#9ca3af}
.cc-fonte a{color:#6366f1;text-decoration:none}
.cc-comentarios{margin-top:8px}
.cc-comentarios strong{font-size:12px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
.cc-comentario{margin-top:10px;padding:10px 12px;border-radius:8px;background:#f0f9ff;border:1px solid #bae6fd;font-size:13px;line-height:1.6;color:#0c4a6e}
.cc-score{display:inline-block;font-size:11px;font-weight:700;color:#0284c7;margin-bottom:4px}
`.trim();

  const BACK_TEMPLATE = "{{Verso}}{{#Extra}}<hr style='border:1px solid #e5e7eb;margin:12px 0'>{{Extra}}{{/Extra}}";

  async function ankiRequest(action, params) {
    const response = await fetch("http://localhost:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  async function criarDecks(plataforma, resultado, materiaLimpa) {
    const niveis = [
      "CaveiraCards",
      `CaveiraCards::${plataforma}`,
      `CaveiraCards::${plataforma}::${resultado}`,
      `CaveiraCards::${plataforma}::${resultado}::${materiaLimpa}`,
    ];
    for (const deck of niveis) {
      await ankiRequest("createDeck", { deck });
    }
    return niveis[niveis.length - 1];
  }

  async function enviarQuestao(questao, frente, verso) {
    const resultado = questao.resultado;
    const deckName = await criarDecks(
      questao.plataforma,
      resultado,
      questao.materiaLimpa
    );

    const tags = [
      "caveira-cards",
      resultado === "Erros" ? "caderno-de-erros" : "revisao",
      questao.plataforma.toLowerCase().replace(/\s+/g, "-"),
      questao.materiaLimpa.toLowerCase().replace(/\s+/g, "-"),
    ];

    const noteId = await ankiRequest("addNote", {
      note: {
        deckName,
        modelName: "CaveiraCards",
        fields: {
          Frente: frente,
          Verso: verso,
          Extra: [questao.banca, questao.explicacao].filter(Boolean).join("<br><br>"),
        },
        tags,
        options: { allowDuplicate: false, duplicateScope: "deck" },
      },
    });

    return noteId;
  }

  async function atualizarExtra(noteId, extraHtml) {
    await ankiRequest("updateNoteFields", {
      note: {
        id: noteId,
        fields: { Extra: extraHtml },
      },
    });
  }

  async function configurarAnki() {
    const modelos = await ankiRequest("modelNames", {});

    if (!modelos.includes("CaveiraCards")) {
      await ankiRequest("createModel", {
        modelName: "CaveiraCards",
        inOrderFields: ["Frente", "Verso", "Extra"],
        css: MODEL_CSS,
        cardTemplates: [{
          Name: "CaveiraCards",
          Front: "{{Frente}}",
          Back: BACK_TEMPLATE,
        }],
      });
    } else {
      await ankiRequest("updateModelStyling", {
        model: { name: "CaveiraCards", css: MODEL_CSS },
      });
      await ankiRequest("updateModelTemplates", {
        model: {
          name: "CaveiraCards",
          templates: [{
            name: "CaveiraCards",
            qfmt: "{{Frente}}",
            afmt: BACK_TEMPLATE,
          }],
        },
      });
    }
  }

  window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra };
})();
```

- [ ] **Commit**

```bash
git add caveira-cards/shared/anki.js
git commit -m "fix: move CSS para modelo Anki, corrige duplicatas falsas + adiciona atualizarExtra"
```

---

## Task 4: Issue 2 — Forçar re-execução do setup (content.js)

**Arquivo:** `caveira-cards/content.js`

- [ ] **Alterar a chave de storage de `ankiSetupDone` para `ankiSetupDone_v2`**

Há duas ocorrências. Substituir:

```javascript
  chrome.storage.local.get("ankiSetupDone", async ({ ankiSetupDone }) => {
    if (ankiSetupDone) return;
    try {
      await window.CaveiraAnki.configurarAnki();
      chrome.storage.local.set({ ankiSetupDone: true });
    } catch (e) {
      // Anki fechado — tenta na próxima visita
    }
  });
```

Por:

```javascript
  chrome.storage.local.get("ankiSetupDone_v2", async ({ ankiSetupDone_v2 }) => {
    if (ankiSetupDone_v2) return;
    try {
      await window.CaveiraAnki.configurarAnki();
      chrome.storage.local.set({ ankiSetupDone_v2: true });
    } catch (e) {
      // Anki fechado — tenta na próxima visita
    }
  });
```

- [ ] **Verificar manualmente**

No Chrome: recarregar a extensão com o Anki aberto. Abrir DevTools → Application → Storage → Local Storage. Verificar que `ankiSetupDone_v2` é criado. No Anki: Ferramentas → Gerenciar tipos de notas → CaveiraCards → confirmar que o CSS foi atualizado e o template do verso mostra `{{Verso}}{{#Extra}}...{{/Extra}}`.

- [ ] **Commit**

```bash
git add caveira-cards/content.js
git commit -m "fix: força re-setup do modelo Anki via ankiSetupDone_v2 para migrar CSS"
```

---

## Task 5: Issue 3 — capturarComentarios no TEC Concursos (tec.js)

**Arquivo:** `caveira-cards/sites/tec.js`

- [ ] **Adicionar o método `capturarComentarios` ao adapter**

Inserir após o método `capturarQuestao`, antes do fechamento do objeto:

```javascript
    capturarComentarios() {
      const ul = document.querySelector("ul.discussao-comentarios");
      if (!ul || ul.offsetParent === null) return null;

      const items = Array.from(ul.querySelectorAll("li"));
      if (!items.length) return null;

      const comentarios = items.map(li => {
        const scoreEl = li.querySelector(".discussao-comentario-nota-numero .ng-binding");
        const textoEl = li.querySelector(".discussao-comentario-post-texto");
        if (!scoreEl || !textoEl) return null;
        const score = parseInt(scoreEl.textContent.trim(), 10) || 0;
        const html = textoEl.innerHTML.trim();
        if (!html) return null;
        return { score, html };
      }).filter(Boolean);

      if (!comentarios.length) return null;

      comentarios.sort((a, b) => b.score - a.score);
      return comentarios.slice(0, 3);
    },
```

- [ ] **Commit**

```bash
git add caveira-cards/sites/tec.js
git commit -m "feat: capturarComentarios no adapter TEC — top 3 por pontuação"
```

---

## Task 6: Issue 3 — stub capturarComentarios no Gran (gran.js)

**Arquivo:** `caveira-cards/sites/gran.js`

- [ ] **Adicionar stub após o método `capturarQuestao`**

```javascript
    capturarComentarios() {
      return null;
    },
```

- [ ] **Commit**

```bash
git add caveira-cards/sites/gran.js
git commit -m "feat: stub capturarComentarios no adapter Gran (não suportado ainda)"
```

---

## Task 7: Issue 3 — Botão 📎 e lógica de atualização (content.js)

**Arquivo:** `caveira-cards/content.js`

- [ ] **Adicionar helper `formatarComentarios` antes da função `enviarParaAnki`**

```javascript
  function formatarComentarios(comentarios) {
    const items = comentarios.map(c =>
      `<div class="cc-comentario"><span class="cc-score">▲ ${c.score}</span><div>${c.html}</div></div>`
    ).join("");
    return `<hr style="border:1px solid #e5e7eb;margin:12px 0"><div class="cc-comentarios"><strong>💬 Top comentários</strong>${items}</div>`;
  }
```

- [ ] **Atualizar `enviarParaAnki` — bloco de sucesso**

Substituir o bloco `try` atual:

```javascript
    try {
      const { frente, verso } = window.CaveiraCardBuilder.montarCard(questao);
      await window.CaveiraAnki.enviarQuestao(questao, frente, verso);

      overlay.classList.remove("loading", "errou", "acertou");
      overlay.classList.add("sucesso");
      titleEl.textContent = "Adicionado! ✓";
      subEl.textContent = questao.materia;

      // Após 2.5s minimiza (não remove — fica como ícone)
      clearTimeout(timerMinimizar);
      timerMinimizar = setTimeout(() => minimizar(overlay), 2500);
```

Por:

```javascript
    try {
      const { frente, verso } = window.CaveiraCardBuilder.montarCard(questao);
      const noteId = await window.CaveiraAnki.enviarQuestao(questao, frente, verso);
      const extraOriginal = [questao.banca, questao.explicacao].filter(Boolean).join("<br><br>");

      overlay.classList.remove("loading", "errou", "acertou");
      overlay.classList.add("sucesso");
      titleEl.textContent = "Adicionado! ✓";
      subEl.textContent = questao.materia;

      // Botão 📎 para capturar comentários
      if (typeof adapter.capturarComentarios === "function") {
        const btnComent = document.createElement("button");
        btnComent.className = "cc-btn-comentarios";
        btnComent.title = "Capturar comentários";
        btnComent.textContent = "📎";
        overlay.querySelector(".cc-card").appendChild(btnComent);

        btnComent.addEventListener("click", async e => {
          e.stopPropagation();
          const comentarios = adapter.capturarComentarios();
          if (!comentarios) {
            btnComent.textContent = "⚠️";
            btnComent.title = "Abra o painel de comentários primeiro";
            setTimeout(() => {
              if (!btnComent.isConnected) return;
              btnComent.textContent = "📎";
              btnComent.title = "Capturar comentários";
            }, 2000);
            return;
          }
          const comentariosHtml = formatarComentarios(comentarios);
          const extraFinal = extraOriginal
            ? extraOriginal + comentariosHtml
            : comentariosHtml.replace(/^<hr[^>]*>/, "");
          try {
            await window.CaveiraAnki.atualizarExtra(noteId, extraFinal);
            btnComent.textContent = "✓";
            setTimeout(() => { if (btnComent.isConnected) btnComent.remove(); }, 1000);
          } catch (err) {
            btnComent.textContent = "❌";
            setTimeout(() => {
              if (!btnComent.isConnected) return;
              btnComent.textContent = "📎";
            }, 2000);
          }
        });
      }

      // Após 2.5s minimiza (não remove — fica como ícone)
      clearTimeout(timerMinimizar);
      timerMinimizar = setTimeout(() => minimizar(overlay), 2500);
```

- [ ] **Commit**

```bash
git add caveira-cards/content.js
git commit -m "feat: botão 📎 para capturar comentários TEC e atualizar campo Extra no Anki"
```

---

## Task 8: Issue 3 — Estilos do botão 📎 (overlay.css)

**Arquivo:** `caveira-cards/shared/overlay.css`

- [ ] **Ler o arquivo overlay.css atual para localizar onde adicionar os estilos**

Abrir `caveira-cards/shared/overlay.css` e identificar o final do arquivo.

- [ ] **Adicionar os estilos do botão e do estado minimizado**

Ao final do arquivo, adicionar:

```css
/* Botão de comentários */
#cc-overlay .cc-btn-comentarios {
  position: absolute;
  bottom: 6px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s;
  z-index: 2;
}
#cc-overlay .cc-btn-comentarios:hover {
  background: #e5e7eb;
}
#cc-overlay.minimizado .cc-btn-comentarios {
  display: none;
}
```

- [ ] **Verificar visualmente**

No Chrome com a extensão carregada: responder questão no TEC Concursos, clicar para adicionar ao Anki, confirmar que o botão 📎 aparece no overlay. Abrir painel de comentários no TEC, clicar 📎, confirmar que muda para ✓ e some. No Anki, abrir o card e conferir que o campo Extra mostra banca/resolução + "💬 Top comentários".

- [ ] **Commit final**

```bash
git add caveira-cards/shared/overlay.css
git commit -m "feat: estilos do botão 📎 no overlay"
```
