# CaveiraCards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a extensão unificada CaveiraCards que integra TEC Concursos e Gran Questões com o Anki, com identidade visual própria de @isakielsouza e página de doação PIX.

**Architecture:** Dispatcher central (`content.js`) injeta shared modules + adapter do site específico via `manifest.json`. Cada site expõe `window.CaveiraCardsAdapter` com interface padronizada. Lógica de Anki e montagem de cards é compartilhada em `shared/`.

**Tech Stack:** JavaScript puro (ES6+), Manifest V3, AnkiConnect API (localhost:8765), qrcode.js (bundled local), CSS puro.

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `caveira-cards/manifest.json` | Declaração da extensão, permissões, content_scripts por site |
| `caveira-cards/background.js` | Service worker mínimo |
| `caveira-cards/content.js` | Loop principal: MutationObserver + gerenciamento do overlay |
| `caveira-cards/shared/anki.js` | Comunicação com AnkiConnect, criação de decks e notas |
| `caveira-cards/shared/card-builder.js` | Monta HTML frente/verso do card Anki |
| `caveira-cards/shared/overlay.css` | Estilos do botão flutuante (expandido + minimizado) |
| `caveira-cards/sites/tec.js` | Adapter TEC Concursos: detecta erro/acerto, captura questão |
| `caveira-cards/sites/gran.js` | Adapter Gran Questões: detecta erro/acerto, captura questão |
| `caveira-cards/popup.html` | Painel da extensão: todas as plataformas + links |
| `caveira-cards/doacao.html` | Página de doação PIX com QR Code dinâmico |
| `caveira-cards/guia.html` | Guia de instalação do AnkiConnect |
| `caveira-cards/libs/qrcode.min.js` | Biblioteca QR Code (bundled local) |
| `caveira-cards/icons/` | Ícones gerados do CaveiraCards.png |

---

## Task 1: Scaffold do projeto — manifest, background e estrutura de pastas

**Files:**
- Create: `caveira-cards/manifest.json`
- Create: `caveira-cards/background.js`

- [ ] **Step 1: Criar estrutura de pastas**

```bash
mkdir -p extensao-caveira-cards/caveira-cards/{shared,sites,icons,libs}
```

- [ ] **Step 2: Criar manifest.json**

```json
{
  "manifest_version": 3,
  "name": "CaveiraCards",
  "version": "1.0.0",
  "description": "Integração com plataformas de questões e Anki — TEC Concursos, Gran Questões e mais.",
  "author": "@isakielsouza",
  "permissions": [
    "activeTab",
    "storage",
    "notifications",
    "tabs"
  ],
  "host_permissions": [
    "https://www.tecconcursos.com.br/*",
    "https://*.grancursosonline.com.br/*",
    "http://localhost:8765/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://www.tecconcursos.com.br/*"],
      "js": [
        "shared/anki.js",
        "shared/card-builder.js",
        "sites/tec.js",
        "content.js"
      ],
      "css": ["shared/overlay.css"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://*.grancursosonline.com.br/*"],
      "js": [
        "shared/anki.js",
        "shared/card-builder.js",
        "sites/gran.js",
        "content.js"
      ],
      "css": ["shared/overlay.css"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 3: Criar background.js**

```js
// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("[CaveiraCards] Extensão instalada com sucesso! by @isakielsouza");
});
```

- [ ] **Step 4: Commit**

```bash
git add caveira-cards/
git commit -m "feat: scaffold projeto CaveiraCards — manifest V3 e background"
```

---

## Task 2: shared/anki.js — comunicação com AnkiConnect

**Files:**
- Create: `caveira-cards/shared/anki.js`

- [ ] **Step 1: Criar shared/anki.js**

```js
// shared/anki.js
// Comunicação com AnkiConnect (http://localhost:8765)
// Expõe: window.CaveiraAnki = { enviarQuestao }

(function () {
  "use strict";

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

  // Cria todos os níveis do deck hierárquico:
  // CaveiraCards → CaveiraCards::TEC Concursos → ...::Erros → ...::Erros::Direito Constitucional
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
    const resultado = questao.resultado; // "Erros" ou "Revisão"
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

    await ankiRequest("addNote", {
      note: {
        deckName,
        modelName: "CaveiraCards",
        fields: {
          Frente: frente,
          Verso: verso,
          Extra: questao.banca || "",
        },
        tags,
        options: { allowDuplicate: false, duplicateScope: "deck" },
      },
    });

    return deckName;
  }

  window.CaveiraAnki = { enviarQuestao };
})();
```

- [ ] **Step 2: Verificar manualmente**

Abra o console do navegador em qualquer página e execute:
```js
// Deve existir sem erros (não conecta ainda, só verifica o objeto)
console.log(typeof window.CaveiraAnki); // "object"
console.log(typeof window.CaveiraAnki.enviarQuestao); // "function"
```

- [ ] **Step 3: Commit**

```bash
git add caveira-cards/shared/anki.js
git commit -m "feat: adiciona shared/anki.js com comunicação AnkiConnect"
```

---

## Task 3: shared/card-builder.js — monta HTML dos cards

**Files:**
- Create: `caveira-cards/shared/card-builder.js`

- [ ] **Step 1: Criar shared/card-builder.js**

```js
// shared/card-builder.js
// Monta HTML da frente e verso do card Anki
// Expõe: window.CaveiraCardBuilder = { montarCard }

(function () {
  "use strict";

  const LETRAS = ["A", "B", "C", "D", "E", "F"];

  const CSS = `<style>
.cc-wrap{font-family:'Segoe UI',system-ui,sans-serif !important;max-width:640px;margin:0 auto;padding:4px;background:#fff !important;color:#1f2937 !important}
.cc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cc-tag-plataforma{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:700 !important;text-transform:uppercase;letter-spacing:.04em;background:#1a1a2e !important;color:#e0e0e0 !important}
.cc-tag-materia{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:700 !important;text-transform:uppercase;background:#dbeafe !important;color:#1e40af !important}
.cc-tag-assunto{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:600 !important;background:#ede9fe !important;color:#5b21b6 !important}
.cc-banca{font-size:12px !important;color:#6b7280 !important;margin-bottom:10px;font-style:italic}
.cc-enunciado{font-size:15px !important;line-height:1.7;color:#1f2937 !important;margin-bottom:14px}
.cc-alts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.cc-alt{display:flex !important;align-items:center;gap:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #e5e7eb !important;background:#f9fafb !important;font-size:13px !important;line-height:1.3;color:#1f2937 !important}
.cc-alt.correta{background:#f0fdf4 !important;border-color:#22c55e !important;color:#166534 !important}
.cc-alt.errada{background:#fef2f2 !important;border-color:#ef4444 !important;color:#991b1b !important}
.cc-letra{min-width:26px;height:26px;border-radius:50%;background:#e5e7eb !important;color:#374151 !important;display:flex;align-items:center;justify-content:center;font-size:12px !important;font-weight:700 !important;flex-shrink:0}
.cc-alt.correta .cc-letra{background:#22c55e !important;color:white !important}
.cc-alt.errada .cc-letra{background:#ef4444 !important;color:white !important}
.cc-gabarito-label{font-size:12px !important;font-weight:700 !important;text-transform:uppercase;color:#6b7280 !important;letter-spacing:.05em;margin-bottom:8px}
.cc-explicacao{margin-top:12px;padding:12px;border-radius:8px;background:#fffbeb !important;border:1px solid #fcd34d;font-size:13px !important;color:#92400e !important;line-height:1.6}
.cc-fonte{margin-top:10px;font-size:11px !important;color:#9ca3af !important}
.cc-fonte a{color:#6366f1 !important;text-decoration:none}
</style>`;

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
    const frente = CSS + `<div class="cc-wrap">
      <div class="cc-meta">
        <span class="cc-tag-plataforma">${questao.plataforma}</span>
        <span class="cc-tag-materia">${questao.materia}</span>
        ${questao.assunto ? `<span class="cc-tag-assunto">${questao.assunto}</span>` : ""}
      </div>
      ${questao.banca ? `<div class="cc-banca">${questao.banca}</div>` : ""}
      <div class="cc-enunciado">${questao.enunciado}</div>
      <div class="cc-alts">${altFrente(questao.alternativas)}</div>
    </div>`;

    const verso = CSS + `<div class="cc-wrap">
      <div class="cc-gabarito-label">Gabarito</div>
      <div class="cc-alts">${altVerso(questao.alternativas, questao.idxCorreta, questao.idxErrada)}</div>
      ${questao.explicacao ? `<div class="cc-explicacao"><strong>Comentário:</strong><br>${questao.explicacao}</div>` : ""}
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

- [ ] **Step 2: Verificar manualmente**

No console do navegador (após extensão carregada no site):
```js
const q = {
  plataforma: "TEC Concursos", materia: "Direito", assunto: "CF",
  banca: "FCC", enunciado: "Teste", alternativas: ["A", "B", "C"],
  idxCorreta: 1, idxErrada: 0, explicacao: "", url: "http://ex.com",
  timestamp: "01/01/2026"
};
const { frente, verso } = window.CaveiraCardBuilder.montarCard(q);
console.log(frente.includes("cc-wrap")); // true
console.log(verso.includes("Gabarito")); // true
```

- [ ] **Step 3: Commit**

```bash
git add caveira-cards/shared/card-builder.js
git commit -m "feat: adiciona shared/card-builder.js — monta HTML dos cards Anki"
```

---

## Task 4: shared/overlay.css — estilos do botão flutuante

**Files:**
- Create: `caveira-cards/shared/overlay.css`

- [ ] **Step 1: Criar shared/overlay.css**

```css
/* shared/overlay.css — CaveiraCards overlay */

/* Container principal — posição fixa no canto inferior direito */
#cc-overlay {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  font-family: 'Segoe UI', system-ui, sans-serif;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Estado expandido */
#cc-overlay .cc-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0f1729;
  border: 1px solid #1e2d4d;
  border-radius: 16px;
  padding: 14px 16px;
  min-width: 240px;
  max-width: 300px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  cursor: pointer;
  position: relative;
  transition: opacity 0.3s, transform 0.3s;
}

#cc-overlay .cc-card:hover {
  border-color: #3b6ff5;
  transform: translateY(-2px);
}

/* Resultado: borda colorida */
#cc-overlay.errou .cc-card { border-left: 3px solid #ef4444; }
#cc-overlay.acertou .cc-card { border-left: 3px solid #22c55e; }

/* Ícone/logo */
#cc-overlay .cc-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

/* Textos */
#cc-overlay .cc-title {
  font-size: 13px;
  font-weight: 700;
  color: #e2e8f0;
  display: block;
}
#cc-overlay .cc-sub {
  font-size: 11px;
  color: #64748b;
  display: block;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* Botão fechar */
#cc-overlay .cc-close {
  position: absolute;
  top: 6px;
  right: 8px;
  background: none;
  border: none;
  color: #334155;
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 4px;
}
#cc-overlay .cc-close:hover { color: #e2e8f0; }

/* Estado de sucesso */
#cc-overlay.sucesso .cc-card { border-left: 3px solid #22c55e; }
#cc-overlay.sucesso .cc-title { color: #4ade80; }

/* Estado de erro */
#cc-overlay.falha .cc-card { border-left: 3px solid #ef4444; }
#cc-overlay.falha .cc-title { color: #f87171; }

/* Estado carregando */
#cc-overlay.loading .cc-title { color: #93c5fd; }

/* ── Estado MINIMIZADO ── */
/* Quando tem a classe .minimizado, esconde o cc-card e mostra só o ícone */
#cc-overlay.minimizado .cc-card {
  display: none;
}

#cc-overlay .cc-mini {
  display: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  border: 2px solid #1e2d4d;
  object-fit: cover;
  transition: transform 0.2s;
}

#cc-overlay.minimizado .cc-mini {
  display: block;
}

#cc-overlay .cc-mini:hover {
  transform: scale(1.1);
  border-color: #3b6ff5;
}
```

- [ ] **Step 2: Commit**

```bash
git add caveira-cards/shared/overlay.css
git commit -m "feat: adiciona shared/overlay.css — estilos do botão flutuante"
```

---

## Task 5: sites/tec.js — adapter TEC Concursos

**Files:**
- Create: `caveira-cards/sites/tec.js`

- [ ] **Step 1: Criar sites/tec.js**

```js
// sites/tec.js — CaveiraCards adapter para TEC Concursos
// Expõe: window.CaveiraCardsAdapter

(function () {
  "use strict";

  window.CaveiraCardsAdapter = {
    nomePlataforma: "TEC Concursos",
    deckBase: "CaveiraCards::TEC Concursos",
    modelName: "CaveiraCards",
    tags: ["tec-concursos", "caveira-cards"],

    detectarErro() {
      return !!document.querySelector("li.erro, li.ng-scope.erro");
    },

    detectarAcerto() {
      return (
        !!document.querySelector("li.correcao") &&
        !document.querySelector("li.erro, li.ng-scope.erro")
      );
    },

    capturarQuestao() {
      try {
        // Enunciado
        const enunciadoEl = document.querySelector(
          ".questao-enunciado-comando, [class*='questao-enunciado-comando'], .questao-enunciado"
        );
        if (!enunciadoEl) return null;

        const enunciadoClone = enunciadoEl.cloneNode(true);
        enunciadoClone.querySelectorAll("ul, ol, li").forEach(el => el.remove());
        let enunciado = enunciadoClone.innerHTML.trim();

        const cortes = ["Você selecionou:", "Você errou!", "Gabarito:", "Ver resolução"];
        for (const corte of cortes) {
          const idx = enunciado.indexOf(corte);
          if (idx !== -1) enunciado = enunciado.substring(0, idx).trim();
        }
        if (!enunciado) return null;

        // Alternativas (deduplicadas)
        const todosLis = Array.from(document.querySelectorAll("li[ng-repeat*='alternativa']"));
        const textos = [];
        const vistos = new Set();
        todosLis.forEach(el => {
          const divTexto = el.querySelector(".questao-enunciado-alternativa-texto");
          if (!divTexto) return;
          const clone = divTexto.cloneNode(true);
          clone.querySelectorAll("p.elemento-vazio, p[size]").forEach(p => p.remove());
          const texto = clone.innerText.trim();
          if (texto && !vistos.has(texto)) {
            vistos.add(texto);
            textos.push(texto);
          }
        });

        // Índice correta/errada
        let idxCorreta = -1;
        let idxErrada = -1;
        todosLis.filter(el =>
          el.classList.contains("correcao") || el.classList.contains("erro")
        ).forEach(el => {
          const divTexto = el.querySelector(".questao-enunciado-alternativa-texto");
          if (!divTexto) return;
          const clone = divTexto.cloneNode(true);
          clone.querySelectorAll("p.elemento-vazio, p[size]").forEach(p => p.remove());
          const texto = clone.innerText.trim();
          const idx = textos.indexOf(texto);
          if (idx === -1) return;
          if (el.classList.contains("correcao")) idxCorreta = idx;
          if (el.classList.contains("erro")) idxErrada = idx;
        });

        // Matéria
        let materia = "Geral";
        const materiaContainer = document.querySelector(".questao-cabecalho-informacoes-materia");
        if (materiaContainer) {
          const materiaLink = materiaContainer.querySelector("a");
          if (materiaLink) materia = materiaLink.innerText.trim();
        }

        // Assunto
        let assunto = "";
        const assuntoEl = document.querySelector(".questao-cabecalho-informacoes-assunto a");
        if (assuntoEl) assunto = assuntoEl.innerText.trim();

        // Banca
        let banca = "";
        const bancaEl = document.querySelector(".questao-titulo, [class*='questao-titulo']");
        if (bancaEl) banca = bancaEl.innerText.trim();

        // Resolução
        let explicacao = "";
        const explicacaoEl = document.querySelector(".questao-enunciado-resolucao, [class*='resolucao']");
        if (explicacaoEl) explicacao = explicacaoEl.innerText.trim();

        const materiaLimpa = materia.replace(/[:"]/g, "").trim();
        const resultado = this.detectarErro() ? "Erros" : "Revisão";

        return {
          enunciado,
          alternativas: textos,
          idxCorreta,
          idxErrada,
          materia,
          materiaLimpa,
          assunto,
          banca,
          explicacao,
          resultado,
          plataforma: this.nomePlataforma,
          url: window.location.href,
          timestamp: new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/TEC] Erro ao capturar questão:", e);
        return null;
      }
    },
  };
})();
```

- [ ] **Step 2: Testar manualmente no TEC Concursos**

1. Carregue a extensão no Chrome (`chrome://extensions` → Load unpacked → selecione `caveira-cards/`)
2. Acesse o TEC Concursos e responda uma questão errada
3. No console: `window.CaveiraCardsAdapter.detectarErro()` deve retornar `true`
4. `window.CaveiraCardsAdapter.capturarQuestao()` deve retornar objeto com `enunciado`, `alternativas`, etc.

- [ ] **Step 3: Commit**

```bash
git add caveira-cards/sites/tec.js
git commit -m "feat: adiciona adapter TEC Concursos (sites/tec.js)"
```

---

## Task 6: sites/gran.js — adapter Gran Questões

**Files:**
- Create: `caveira-cards/sites/gran.js`

- [ ] **Step 1: Criar sites/gran.js**

```js
// sites/gran.js — CaveiraCards adapter para Gran Questões
// Expõe: window.CaveiraCardsAdapter

(function () {
  "use strict";

  window.CaveiraCardsAdapter = {
    nomePlataforma: "Gran Questões",
    deckBase: "CaveiraCards::Gran Questões",
    modelName: "CaveiraCards",
    tags: ["gran-questoes", "caveira-cards"],

    detectarErro() {
      return !!document.querySelector(
        ".ds-question--answered .ds-question__body__options__option--wrong"
      );
    },

    detectarAcerto() {
      return (
        !!document.querySelector(
          ".ds-question--answered .ds-question__body__options__option--right"
        ) && !this.detectarErro()
      );
    },

    capturarQuestao(questaoEl) {
      try {
        const enunciadoEl = questaoEl.querySelector(".ds-question__body__statement");
        if (!enunciadoEl) return null;
        const enunciado = enunciadoEl.innerHTML.trim();
        if (!enunciado) return null;

        const opcoesEls = questaoEl.querySelectorAll(
          ".ds-question__body__options__option"
        );
        const alternativas = [];
        let idxCorreta = -1;
        let idxErrada = -1;

        opcoesEls.forEach(el => {
          const descEl = el.querySelector(
            ".ds-question__body__options__option__description"
          );
          if (!descEl) return;
          const texto = descEl.innerText.trim();
          if (!texto) return;
          const idx = alternativas.length;
          alternativas.push(texto);
          if (el.classList.contains("ds-question__body__options__option--wrong"))
            idxErrada = idx;
          if (el.classList.contains("ds-question__body__options__option--right"))
            idxCorreta = idx;
        });

        let materia = "Geral";
        const materiaEls = questaoEl.querySelectorAll(
          ".ds-question__header__top__subject a span"
        );
        if (materiaEls.length > 0) materia = materiaEls[0].innerText.trim();

        let banca = "";
        let prova = "";
        questaoEl.querySelectorAll(".ds-question__header__bottom__info").forEach(el => {
          if (el.innerText.includes("Banca:"))
            banca = el.innerText.replace("Banca:", "").trim();
          if (el.innerText.includes("Prova:"))
            prova = el.innerText.replace("Prova:", "").trim();
        });

        const materiaLimpa = materia
          .replace(/[:"]/g, "")
          .replace(/\s*>\s*/g, " - ")
          .trim();

        const resultado = idxErrada !== -1 ? "Erros" : "Revisão";

        return {
          enunciado,
          alternativas,
          idxCorreta,
          idxErrada,
          materia,
          materiaLimpa,
          assunto: "",
          banca: banca + (prova ? ` | ${prova}` : ""),
          explicacao: "",
          resultado,
          plataforma: this.nomePlataforma,
          url: window.location.href,
          timestamp: new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/Gran] Erro ao capturar questão:", e);
        return null;
      }
    },
  };
})();
```

- [ ] **Step 2: Testar manualmente no Gran Questões**

1. Acesse o Gran Questões e responda uma questão errada
2. No console: `window.CaveiraCardsAdapter.detectarErro()` deve retornar `true`
3. Localize o elemento da questão: `const el = document.querySelector(".ds-question--answered")`
4. `window.CaveiraCardsAdapter.capturarQuestao(el)` deve retornar o objeto da questão

- [ ] **Step 3: Commit**

```bash
git add caveira-cards/sites/gran.js
git commit -m "feat: adiciona adapter Gran Questões (sites/gran.js)"
```

---

## Task 7: content.js — dispatcher e gerenciamento do overlay

**Files:**
- Create: `caveira-cards/content.js`

- [ ] **Step 1: Criar content.js**

```js
// content.js — CaveiraCards dispatcher principal
// Depende de: window.CaveiraCardsAdapter, window.CaveiraAnki, window.CaveiraCardBuilder
// (injetados antes pelo manifest na ordem correta)

(function () {
  "use strict";

  const adapter = window.CaveiraCardsAdapter;
  if (!adapter) return;

  const LOGO_URL = chrome.runtime.getURL("CaveiraCards.png");

  // Rastro de questões já processadas (evita duplicar overlays)
  const processadas = new Set();
  let overlayEl = null;
  let timerMinimizar = null;

  // ── Observador de mudanças no DOM ──
  const observer = new MutationObserver(() => verificar());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(verificar, 2000);

  function verificar() {
    // TEC: uma questão por vez na página
    if (adapter.nomePlataforma === "TEC Concursos") {
      if (!adapter.detectarErro() && !adapter.detectarAcerto()) return;
      const questao = adapter.capturarQuestao();
      if (!questao) return;
      const chave = questao.enunciado.substring(0, 80);
      if (processadas.has(chave)) return;
      processadas.add(chave);
      mostrarOverlay(questao);
      return;
    }

    // Gran: múltiplas questões por página
    if (adapter.nomePlataforma === "Gran Questões") {
      const questoesEl = document.querySelectorAll(".ds-question--answered");
      questoesEl.forEach(questaoEl => {
        const enuncEl = questaoEl.querySelector(".ds-question__body__statement");
        if (!enuncEl) return;
        const chave = enuncEl.innerText.trim().substring(0, 80);
        if (!chave || processadas.has(chave)) return;
        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;
        processadas.add(chave);
        mostrarOverlay(questao);
      });
    }
  }

  // ── Overlay ──

  function mostrarOverlay(questao) {
    // Remove overlay anterior se existir
    if (overlayEl) overlayEl.remove();
    clearTimeout(timerMinimizar);

    const overlay = document.createElement("div");
    overlay.id = "cc-overlay";
    overlay.classList.add(questao.resultado === "Erros" ? "errou" : "acertou");

    overlay.innerHTML = `
      <div class="cc-card">
        <img class="cc-icon" src="${LOGO_URL}" alt="CaveiraCards">
        <div class="cc-text">
          <span class="cc-title">Adicionar ao Anki</span>
          <span class="cc-sub">${questao.resultado} · ${questao.materia}</span>
        </div>
        <button class="cc-close" title="Fechar">✕</button>
      </div>
      <img class="cc-mini" src="${LOGO_URL}" alt="CaveiraCards" title="CaveiraCards — clique para expandir">
    `;

    document.body.appendChild(overlay);
    overlayEl = overlay;

    // Clique no card → enviar para Anki
    overlay.querySelector(".cc-card").addEventListener("click", e => {
      if (e.target.classList.contains("cc-close")) return;
      enviarParaAnki(questao);
    });

    // Clique no X → remove definitivamente
    overlay.querySelector(".cc-close").addEventListener("click", e => {
      e.stopPropagation();
      overlay.remove();
      overlayEl = null;
      clearTimeout(timerMinimizar);
    });

    // Clique no ícone minimizado → expande de volta
    overlay.querySelector(".cc-mini").addEventListener("click", () => {
      overlay.classList.remove("minimizado");
      clearTimeout(timerMinimizar);
      timerMinimizar = setTimeout(() => minimizar(overlay), 5000);
    });

    // Minimiza automaticamente após 5s
    timerMinimizar = setTimeout(() => minimizar(overlay), 5000);
  }

  function minimizar(overlay) {
    if (!overlay.isConnected) return;
    overlay.classList.add("minimizado");
  }

  async function enviarParaAnki(questao) {
    const titleEl = overlayEl.querySelector(".cc-title");
    const subEl = overlayEl.querySelector(".cc-sub");

    titleEl.textContent = "Enviando...";
    overlayEl.classList.add("loading");

    try {
      const { frente, verso } = window.CaveiraCardBuilder.montarCard(questao);
      await window.CaveiraAnki.enviarQuestao(questao, frente, verso);

      overlayEl.classList.remove("loading", "errou", "acertou");
      overlayEl.classList.add("sucesso");
      titleEl.textContent = "Adicionado! ✓";
      subEl.textContent = questao.materia;

      // Após 2.5s minimiza (não remove — fica como ícone)
      clearTimeout(timerMinimizar);
      timerMinimizar = setTimeout(() => minimizar(overlayEl), 2500);

    } catch (err) {
      overlayEl.classList.remove("loading");
      overlayEl.classList.add("falha");

      if (err.message.includes("Failed to fetch")) {
        titleEl.textContent = "Anki fechado!";
        subEl.textContent = "Abra o Anki e tente de novo";
      } else if (err.message.includes("duplicate")) {
        titleEl.textContent = "Já existe no deck";
        subEl.textContent = "Questão duplicada";
      } else {
        titleEl.textContent = "Erro ao enviar";
        subEl.textContent = err.message.substring(0, 40);
      }

      // Após 4s volta ao estado normal e minimiza
      setTimeout(() => {
        if (!overlayEl) return;
        overlayEl.classList.remove("falha");
        titleEl.textContent = "Adicionar ao Anki";
        subEl.textContent = `${questao.resultado} · ${questao.materia}`;
        minimizar(overlayEl);
      }, 4000);
    }
  }
})();
```

- [ ] **Step 2: Copiar CaveiraCards.png para raiz da extensão**

```bash
cp extensao-caveira-cards/CaveiraCards.png extensao-caveira-cards/caveira-cards/CaveiraCards.png
```

E adicionar ao manifest.json o campo `web_accessible_resources` para que o content script acesse a imagem:

```json
"web_accessible_resources": [
  {
    "resources": ["CaveiraCards.png", "icons/*"],
    "matches": [
      "https://www.tecconcursos.com.br/*",
      "https://*.grancursosonline.com.br/*"
    ]
  }
]
```

- [ ] **Step 3: Testar fluxo completo**

1. Recarregue a extensão em `chrome://extensions`
2. Acesse TEC Concursos, responda uma questão errada
3. Verifique que o overlay aparece com a logo caveira e "Erros · [Matéria]"
4. Aguarde 5 segundos — deve minimizar para o ícone redondo
5. Clique no ícone — deve expandir novamente
6. Com o Anki aberto e AnkiConnect instalado, clique em "Adicionar ao Anki"
7. Verifique que aparece "Adicionado! ✓" e depois minimiza (não some)
8. Clique no X — overlay deve desaparecer definitivamente

- [ ] **Step 4: Commit**

```bash
git add caveira-cards/content.js caveira-cards/CaveiraCards.png caveira-cards/manifest.json
git commit -m "feat: adiciona content.js dispatcher e overlay minimizável"
```

---

## Task 8: popup.html — painel da extensão

**Files:**
- Create: `caveira-cards/popup.html`

- [ ] **Step 1: Criar popup.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 280px;
    background: #080d1a;
    color: #e2e8f0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    padding: 20px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .header img { width: 40px; height: 40px; border-radius: 50%; }
  .header-text h1 { font-size: 15px; font-weight: 700; color: #fff; }
  .header-text p { font-size: 11px; color: #3b6ff5; margin-top: 2px; }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #334155;
    margin-bottom: 8px;
  }
  .platforms { margin-bottom: 16px; }
  .platform {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #0f1729;
    border: 1px solid #1e2d4d;
    border-radius: 8px;
    margin-bottom: 6px;
  }
  .platform-name { font-size: 12px; color: #cbd5e1; }
  .badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .badge.ativo { background: #14532d; color: #4ade80; }
  .badge.inativo { background: #1e2d4d; color: #475569; }
  .badge.breve { background: #1e1a2d; color: #7c3aed; font-style: italic; }
  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    background: #0f1729;
    border: 1px solid #1e2d4d;
    border-radius: 10px;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    margin-bottom: 8px;
    transition: border-color .2s, color .2s;
  }
  .btn:hover { border-color: #3b6ff5; color: #e2e8f0; }
  .btn.destaque {
    background: #3b6ff5;
    border-color: #3b6ff5;
    color: white;
    font-weight: 700;
  }
  .btn.destaque:hover { background: #2d5ce0; }
  .footer {
    margin-top: 14px;
    text-align: center;
    font-size: 10px;
    color: #1e2d4d;
  }
  .footer a { color: #3b6ff5; text-decoration: none; }
</style>
</head>
<body>
  <div class="header">
    <img src="CaveiraCards.png" alt="CaveiraCards">
    <div class="header-text">
      <h1>CaveiraCards</h1>
      <p>@isakielsouza</p>
    </div>
  </div>

  <p class="section-title">Plataformas</p>
  <div class="platforms">
    <div class="platform">
      <span class="platform-name">TEC Concursos</span>
      <span class="badge" id="badge-tec">inativo</span>
    </div>
    <div class="platform">
      <span class="platform-name">Gran Questões</span>
      <span class="badge" id="badge-gran">inativo</span>
    </div>
    <div class="platform">
      <span class="platform-name">QConcurso</span>
      <span class="badge breve">em breve</span>
    </div>
  </div>

  <a class="btn" href="guia.html" target="_blank">📖 Guia de instalação</a>
  <a class="btn destaque" href="doacao.html" target="_blank">❤️ Apoiar o projeto</a>

  <div class="footer">
    Projeto livre &nbsp;·&nbsp;
    <a href="https://github.com/isakielsouza" target="_blank">GitHub</a>
  </div>

  <script>
    // Detecta a aba atual e atualiza os badges
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;
      const url = tabs[0].url || "";

      function setBadge(id, ativo) {
        const el = document.getElementById(id);
        el.textContent = ativo ? "ATIVO" : "inativo";
        el.className = "badge " + (ativo ? "ativo" : "inativo");
      }

      setBadge("badge-tec", url.includes("tecconcursos.com.br"));
      setBadge("badge-gran", url.includes("grancursosonline.com.br"));
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Testar popup**

1. Recarregue a extensão
2. Acesse o TEC Concursos e clique no ícone da extensão
3. Badge "TEC Concursos" deve aparecer como **ATIVO** (verde)
4. Gran Questões deve aparecer como **inativo** (cinza)
5. Clique em "Guia de instalação" — deve abrir nova aba
6. Clique em "Apoiar o projeto" — deve abrir `doacao.html`

- [ ] **Step 3: Commit**

```bash
git add caveira-cards/popup.html
git commit -m "feat: adiciona popup.html com status de plataformas e links"
```

---

## Task 9: libs/qrcode.min.js + doacao.html

**Files:**
- Create: `caveira-cards/libs/qrcode.min.js`
- Create: `caveira-cards/doacao.html`

- [ ] **Step 1: Baixar qrcode.js localmente**

```bash
curl -L "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" \
  -o extensao-caveira-cards/caveira-cards/libs/qrcode.min.js
```

Verifique que o arquivo foi baixado:
```bash
wc -c extensao-caveira-cards/caveira-cards/libs/qrcode.min.js
# deve ter ~10000 bytes
```

- [ ] **Step 2: Criar doacao.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Apoiar o CaveiraCards</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: #f8fafc;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .container { max-width: 360px; width: 100%; text-align: center; }

  /* Tela inicial */
  #tela-inicial .avatar {
    width: 90px; height: 90px; border-radius: 50%;
    object-fit: cover; margin: 0 auto 16px;
    border: 3px solid #1a1a2e;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
  #tela-inicial h1 { font-size: 20px; font-weight: 800; color: #1a1a2e; }
  #tela-inicial .handle { font-size: 13px; color: #6366f1; margin-top: 4px; }
  .apoio-box {
    background: white; border-radius: 16px;
    padding: 24px; margin-top: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    text-align: left;
  }
  .apoio-box h2 { font-size: 16px; color: #1a1a2e; margin-bottom: 8px; }
  .apoio-box p { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
  .pix-btn {
    display: block; width: 100%; padding: 14px;
    background: #f5a623; border: none; border-radius: 10px;
    color: #1a1a2e; font-size: 14px; font-weight: 800;
    cursor: pointer; margin-bottom: 10px;
    transition: background .2s, transform .1s;
  }
  .pix-btn:hover { background: #e09510; transform: translateY(-1px); }
  .pix-btn:active { transform: translateY(0); }

  /* Tela QR Code */
  #tela-qr { display: none; }
  .back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; color: #6366f1;
    font-size: 13px; font-weight: 600; cursor: pointer;
    margin-bottom: 20px;
  }
  .back-btn:hover { color: #4f46e5; }
  .qr-box {
    background: white; border-radius: 16px; padding: 28px 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  }
  .qr-valor { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 20px; }
  #qrcode { display: flex; justify-content: center; margin-bottom: 20px; }
  #qrcode canvas, #qrcode img { border-radius: 8px; }
  .chave-box {
    background: #f1f5f9; border-radius: 10px; padding: 12px 16px;
    margin-bottom: 14px; text-align: left;
  }
  .chave-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
  .chave-valor { font-size: 13px; color: #1a1a2e; font-weight: 600; margin-top: 4px; word-break: break-all; }
  .copiar-btn {
    display: block; width: 100%; padding: 12px;
    background: #1a1a2e; border: none; border-radius: 10px;
    color: white; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: background .2s;
  }
  .copiar-btn:hover { background: #2d3748; }
  .copiar-btn.copiado { background: #16a34a; }
</style>
</head>
<body>
<div class="container">

  <!-- Tela inicial -->
  <div id="tela-inicial">
    <img class="avatar" src="CaveiraCards.png" alt="CaveiraCards">
    <h1>CaveiraCards</h1>
    <p class="handle">@isakielsouza</p>

    <div class="apoio-box">
      <h2>Apoie o projeto</h2>
      <p>Se a extensão te ajudou nos estudos, considere uma contribuição para manter o projeto ativo.</p>
      <button class="pix-btn" data-valor="2.00" data-label="R$ 2,00">Fazer um PIX (R$ 2,00)</button>
      <button class="pix-btn" data-valor="3.00" data-label="R$ 3,00">Fazer um PIX (R$ 3,00)</button>
      <button class="pix-btn" data-valor="5.00" data-label="R$ 5,00">Fazer um PIX (R$ 5,00)</button>
    </div>
  </div>

  <!-- Tela QR Code -->
  <div id="tela-qr">
    <button class="back-btn" id="btn-voltar">← Voltar</button>
    <div class="qr-box">
      <div class="qr-valor" id="qr-valor-texto"></div>
      <div id="qrcode"></div>
      <div class="chave-box">
        <div class="chave-label">Chave PIX</div>
        <div class="chave-valor">isakielsouza@outlook.com.br</div>
      </div>
      <button class="copiar-btn" id="btn-copiar">📋 Copiar chave PIX</button>
    </div>
  </div>

</div>

<script src="libs/qrcode.min.js"></script>
<script>
  // ── Geração do payload PIX EMV (BR Code) ──
  function tlv(id, value) {
    return id + String(value.length).padStart(2, "0") + value;
  }

  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
  }

  function buildPixPayload(chave, valor, nome, cidade) {
    const gui      = tlv("00", "BR.GOV.BCB.PIX");
    const key      = tlv("01", chave);
    const merchant = tlv("26", gui + key);
    const nomeTrunc = nome.substring(0, 25);
    const cidadeTrunc = cidade.substring(0, 15);

    let payload =
      tlv("00", "01") +
      merchant +
      tlv("52", "0000") +
      tlv("53", "986") +
      tlv("54", valor) +
      tlv("58", "BR") +
      tlv("59", nomeTrunc) +
      tlv("60", cidadeTrunc) +
      tlv("62", tlv("05", "***")) +
      "6304";

    return payload + crc16(payload);
  }

  // ── Navegação entre telas ──
  const CHAVE_PIX  = "isakielsouza@outlook.com.br";
  const NOME_PIX   = "isakielsouza";
  const CIDADE_PIX = "BRASIL";

  let qrInstance = null;

  document.querySelectorAll(".pix-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const valor = btn.dataset.valor;
      const label = btn.dataset.label;

      document.getElementById("tela-inicial").style.display = "none";
      document.getElementById("tela-qr").style.display = "block";
      document.getElementById("qr-valor-texto").textContent = label;

      const qrEl = document.getElementById("qrcode");
      qrEl.innerHTML = "";

      const payload = buildPixPayload(CHAVE_PIX, valor, NOME_PIX, CIDADE_PIX);

      qrInstance = new QRCode(qrEl, {
        text: payload,
        width: 200,
        height: 200,
        colorDark: "#1a1a2e",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    });
  });

  document.getElementById("btn-voltar").addEventListener("click", () => {
    document.getElementById("tela-qr").style.display = "none";
    document.getElementById("tela-inicial").style.display = "block";
  });

  document.getElementById("btn-copiar").addEventListener("click", function () {
    navigator.clipboard.writeText(CHAVE_PIX).then(() => {
      this.textContent = "✓ Copiado!";
      this.classList.add("copiado");
      setTimeout(() => {
        this.textContent = "📋 Copiar chave PIX";
        this.classList.remove("copiado");
      }, 2000);
    });
  });
</script>
</body>
</html>
```

- [ ] **Step 3: Testar página de doação**

1. Abra `doacao.html` diretamente no Chrome (como arquivo ou via extensão)
2. Clique em "Fazer um PIX (R$ 2,00)" — deve mostrar tela do QR Code
3. Verifique que o QR Code é gerado (canvas aparece)
4. Clique em "📋 Copiar chave PIX" — deve copiar `isakielsouza@outlook.com.br`
5. Clique em "← Voltar" — deve retornar à tela inicial

- [ ] **Step 4: Adicionar libs/ ao manifest como web_accessible_resource**

No `manifest.json`, adicione `"libs/*"` à lista de `web_accessible_resources`.resources.

- [ ] **Step 5: Commit**

```bash
git add caveira-cards/libs/qrcode.min.js caveira-cards/doacao.html
git commit -m "feat: adiciona página de doação PIX com QR Code dinâmico"
```

---

## Task 10: guia.html — guia de instalação

**Files:**
- Create: `caveira-cards/guia.html`

- [ ] **Step 1: Criar guia.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Guia de Instalação — CaveiraCards</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: #f8fafc; color: #1e293b;
    max-width: 680px; margin: 0 auto; padding: 40px 24px;
  }
  .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .logo img { width: 48px; height: 48px; border-radius: 50%; }
  .logo h1 { font-size: 22px; font-weight: 800; }
  .logo span { font-size: 13px; color: #6366f1; display: block; }
  h2 { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 24px 0 8px; }
  p { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 12px; }
  ol { padding-left: 20px; }
  ol li { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 6px; }
  .code {
    background: #1e293b; color: #e2e8f0;
    padding: 12px 16px; border-radius: 8px;
    font-family: monospace; font-size: 13px;
    margin: 12px 0;
  }
  .btn {
    display: inline-block; padding: 12px 24px;
    background: #3b6ff5; color: white; border-radius: 10px;
    text-decoration: none; font-weight: 700; font-size: 14px;
    margin-top: 8px;
  }
  .btn:hover { background: #2d5ce0; }
  .alerta {
    background: #fffbeb; border: 1px solid #fcd34d;
    border-radius: 10px; padding: 14px 16px; margin: 16px 0;
    font-size: 13px; color: #92400e;
  }
</style>
</head>
<body>
  <div class="logo">
    <img src="CaveiraCards.png" alt="CaveiraCards">
    <div>
      <h1>CaveiraCards</h1>
      <span>Guia de instalação</span>
    </div>
  </div>

  <div class="alerta">
    ⚠️ O CaveiraCards precisa do <strong>Anki</strong> e do plugin <strong>AnkiConnect</strong> instalados no seu computador para funcionar.
  </div>

  <h2>Passo 1 — Instale o Anki</h2>
  <p>Baixe e instale o Anki gratuitamente no site oficial:</p>
  <a class="btn" href="https://apps.ankiweb.net" target="_blank">Baixar Anki</a>

  <h2>Passo 2 — Instale o AnkiConnect</h2>
  <ol>
    <li>Abra o Anki</li>
    <li>Vá em <strong>Ferramentas → Complementos → Baixar complementos</strong></li>
    <li>Cole o código abaixo e clique em OK:</li>
  </ol>
  <div class="code">2055492159</div>
  <p>Ou instale diretamente pelo AnkiWeb:</p>
  <a class="btn" href="https://ankiweb.net/shared/info/2055492159" target="_blank">Instalar AnkiConnect</a>

  <h2>Passo 3 — Reinicie o Anki</h2>
  <p>Após instalar o AnkiConnect, feche e abra o Anki novamente para o plugin ser ativado.</p>

  <h2>Passo 4 — Crie o modelo de card "CaveiraCards"</h2>
  <p>O CaveiraCards usa um modelo chamado <strong>CaveiraCards</strong> com os campos <strong>Frente</strong>, <strong>Verso</strong> e <strong>Extra</strong>.</p>
  <ol>
    <li>No Anki, vá em <strong>Ferramentas → Gerenciar tipos de notas</strong></li>
    <li>Clique em <strong>Adicionar</strong> → selecione "Básico"</li>
    <li>Renomeie para <strong>CaveiraCards</strong></li>
    <li>Edite os campos para ter: <strong>Frente</strong>, <strong>Verso</strong>, <strong>Extra</strong></li>
    <li>Salve</li>
  </ol>

  <h2>Pronto!</h2>
  <p>Com o Anki aberto, acesse o TEC Concursos ou Gran Questões, responda uma questão e o botão do CaveiraCards aparecerá automaticamente.</p>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add caveira-cards/guia.html
git commit -m "feat: adiciona guia.html de instalação do AnkiConnect"
```

---

## Task 11: Ícones — gerar a partir do CaveiraCards.png

**Files:**
- Create: `caveira-cards/icons/icon16.png`
- Create: `caveira-cards/icons/icon48.png`
- Create: `caveira-cards/icons/icon128.png`

- [ ] **Step 1: Verificar se ImageMagick está disponível**

```bash
convert --version
```

Se não estiver instalado:
```bash
sudo apt-get install imagemagick -y
```

- [ ] **Step 2: Gerar os ícones**

```bash
convert extensao-caveira-cards/CaveiraCards.png \
  -resize 16x16 extensao-caveira-cards/caveira-cards/icons/icon16.png

convert extensao-caveira-cards/CaveiraCards.png \
  -resize 48x48 extensao-caveira-cards/caveira-cards/icons/icon48.png

convert extensao-caveira-cards/CaveiraCards.png \
  -resize 128x128 extensao-caveira-cards/caveira-cards/icons/icon128.png
```

- [ ] **Step 3: Verificar os ícones**

```bash
ls -lh extensao-caveira-cards/caveira-cards/icons/
# Deve listar os 3 arquivos .png
```

- [ ] **Step 4: Commit**

```bash
git add caveira-cards/icons/
git commit -m "feat: adiciona ícones CaveiraCards (16, 48, 128px)"
```

---

## Task 12: Teste de integração final

- [ ] **Step 1: Carregar extensão no Chrome**

1. Abra `chrome://extensions`
2. Ative **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `caveira-cards/`
5. Verifique que a extensão aparece sem erros

- [ ] **Step 2: Testar TEC Concursos**

1. Acesse `https://www.tecconcursos.com.br`
2. Responda uma questão **errada**
3. ✅ Overlay aparece com borda vermelha + "Erros · [Matéria]"
4. ✅ Após 5s minimiza para ícone da caveira
5. ✅ Clique no ícone → expande
6. ✅ Com Anki aberto, clique "Adicionar ao Anki" → "Adicionado! ✓" → minimiza
7. ✅ No Anki: deck `CaveiraCards::TEC Concursos::Erros::[Matéria]` criado
8. ✅ Card com frente/verso HTML correto
9. Responda uma questão **certa**
10. ✅ Overlay aparece com borda verde + "Revisão · [Matéria]"
11. ✅ Card vai para `CaveiraCards::TEC Concursos::Revisão::[Matéria]`

- [ ] **Step 3: Testar Gran Questões**

1. Acesse `https://www.grancursosonline.com.br`
2. Responda questões erradas e acertadas
3. ✅ Overlay aparece para cada questão com resultado correto
4. ✅ Cards vão para `CaveiraCards::Gran Questões::Erros` ou `::Revisão`

- [ ] **Step 4: Testar popup**

1. Estando no TEC Concursos, clique no ícone da extensão
2. ✅ Badge TEC Concursos: **ATIVO** (verde)
3. ✅ Badge Gran Questões: inativo (cinza)
4. ✅ Botão "Guia de instalação" abre `guia.html`
5. ✅ Botão "Apoiar o projeto" abre `doacao.html`

- [ ] **Step 5: Testar página de doação**

1. Na página de doação, clique em R$3,00
2. ✅ QR Code é gerado
3. ✅ Botão "Copiar chave PIX" copia `isakielsouza@outlook.com.br`
4. ✅ Botão "← Voltar" retorna à tela inicial

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat: CaveiraCards v1.0 — extensão unificada TEC + Gran com overlay minimizável e doação PIX"
```
