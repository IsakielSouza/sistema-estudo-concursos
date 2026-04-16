// sites/focus.js — CaveiraCards adapter para Focus Concursos
// URL: https://lms.focusconcursos.com.br/#/questions
// Expõe: window.CaveiraCardsAdapter
//
// Suporta dois formatos de questão:
//   • Certo / Errado  — radios com value="c" e value="e"
//   • Múltipla Escolha — radios com value="a","b","c","d","e" e labels "A) …"
//
// Estrutura HTML (Vue SPA / Vuetify):
//   .my-3.v-card                         → card de cada questão
//   .align-item-center.flex-auto.flex-wrap → metadados (Disciplina, Assunto, Banca…)
//   .layout.row.wrap[data-v-42587690]      → wrapper do conteúdo
//     .flex.mt-2.image-max-size.xs12       → bloco(s) de texto/contexto/enunciado
//     .flex.xs12 .v-input--radio-group     → opções de resposta
//     .flex.xs12 .v-alert.success/error    → resultado (se já respondido)

(function () {
  "use strict";

  /* ── helpers ──────────────────────────────────────────────────────────── */

  /**
   * Percorre os filhos imediatos de um <b> e coleta o texto até encontrar
   * um <i> (ícone separador arrow_right) ou outro <b>.
   */
  function valorAposBold(boldEl) {
    let valor = "";
    let node = boldEl.nextSibling;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        valor += node.textContent;
      } else if (node.nodeName === "SPAN") {
        valor += node.innerText || node.textContent || "";
      } else if (node.nodeName === "I" || node.nodeName === "B") {
        break;
      }
      node = node.nextSibling;
    }
    return valor.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  /** Retorna { "Disciplina": "Português", "Banca": "CESPE", … } */
  function parseMeta(divEl) {
    const map = {};
    if (!divEl) return map;
    divEl.querySelectorAll("b").forEach(b => {
      const label = (b.innerText || "").replace(/\u00a0/g, "").trim();
      if (label) map[label] = valorAposBold(b);
    });
    return map;
  }

  /**
   * Clona um elemento, remove atributos de estilo inline e retorna o innerHTML.
   */
  function cloneHtml(el) {
    if (!el) return "";
    const clone = el.cloneNode(true);
    clone.querySelectorAll("*").forEach(n => {
      n.removeAttribute("style");
      n.removeAttribute("color");
      n.removeAttribute("face");
      n.removeAttribute("size");
    });
    return clone.innerHTML.trim();
  }

  /**
   * Detecta se a questão é do tipo Certo/Errado.
   * Critério: exatamente 2 radios, com values "c" e "e".
   */
  function isCertoErrado(questaoEl) {
    const radios = Array.from(
      questaoEl.querySelectorAll(".v-input--radio-group__input input[type='radio']")
    );
    if (radios.length !== 2) return false;
    const vals = radios.map(r => r.value);
    return vals.includes("c") && vals.includes("e") && !vals.includes("a");
  }

  /* ── adapter ──────────────────────────────────────────────────────────── */
  window.CaveiraCardsAdapter = {
    nomePlataforma: "Focus Concursos",
    deckBase:       "CaveiraCards::Focus Concursos",
    modelName:      "CaveiraCards",
    tags:           ["focus-concursos", "caveira-cards"],

    /** Seletor dos cards individuais de questão. */
    seletorQuestao: ".my-3.v-card",

    /** True se o usuário já respondeu (alerta de acerto ou erro presente). */
    questaoRespondida(questaoEl) {
      return !!(
        questaoEl.querySelector(".v-alert.success") ||
        questaoEl.querySelector(".v-alert.error")
      );
    },

    detectarErro()   { return !!document.querySelector(".my-3.v-card .v-alert.error");   },
    detectarAcerto() { return !!document.querySelector(".my-3.v-card .v-alert.success"); },

    /* ── Captura principal ─────────────────────────────────────────────── */
    capturarQuestao(questaoEl) {
      try {
        /* 0. Verificar se foi respondida ─────────────────────────────────── */
        const alertSuccess = questaoEl.querySelector(".v-alert.success");
        const alertError   = questaoEl.querySelector(".v-alert.error");
        if (!alertSuccess && !alertError) return null;

        const errou    = !!alertError;
        const resultado = errou ? "Erros" : "Revisão";

        /* 1. Identificar tipo de questão ─────────────────────────────────── */
        const certoErrado = isCertoErrado(questaoEl);

        /* 2. Alternativas + índices correta/errada ───────────────────────── */
        const radioItems = Array.from(
          questaoEl.querySelectorAll(".v-input--radio-group__input .v-radio")
        );

        let alternativas = [];
        let idxCorreta   = -1;
        let idxErrada    = -1;
        let valorMarcado = null; // value do radio selecionado pelo usuário

        if (certoErrado) {
          // ── Certo / Errado ────────────────────────────────────────────
          alternativas = ["Certo", "Errado"];

          radioItems.forEach((item, i) => {
            const input = item.querySelector("input[type='radio']");
            if (input && input.getAttribute("aria-checked") === "true") {
              valorMarcado = input.value; // "c" ou "e"
            }
          });

          if (alertSuccess) {
            // Usuário acertou: o que marcou é a resposta correta
            idxCorreta = valorMarcado === "c" ? 0 : 1;
          } else {
            // Usuário errou: <strong> informa a resposta correta
            const strongEl = alertError.querySelector("strong");
            if (strongEl) {
              const txt = (strongEl.innerText || "").trim().toLowerCase();
              idxCorreta = txt === "certo" ? 0 : 1;
            }
            idxErrada = valorMarcado === "c" ? 0 : 1;
          }

        } else {
          // ── Múltipla escolha (A / B / C / D / E …) ────────────────────
          radioItems.forEach((item, i) => {
            const input  = item.querySelector("input[type='radio']");
            const label  = item.querySelector("label");
            if (!label) return;

            // O texto da alternativa está em <span> dentro do <label>
            const span = label.querySelector("span");
            const texto = span
              ? span.innerText.trim()
              : label.innerText.replace(/^[A-Ea-e]\)\s*/, "").trim();

            if (!texto) return;
            const arrIdx = alternativas.length;
            alternativas.push(texto);

            if (input && input.getAttribute("aria-checked") === "true") {
              valorMarcado = input.value; // "a","b","c","d","e"
              idxErrada    = arrIdx;      // assume errado; corrigimos abaixo
            }
          });

          if (alertSuccess) {
            // Usuário acertou: o que marcou é correto
            idxCorreta = idxErrada;
            idxErrada  = -1;
          } else {
            // Usuário errou: <strong> contém a letra correta (ex: "E")
            const strongEl = alertError.querySelector("strong");
            if (strongEl) {
              const letra = (strongEl.innerText || "").trim().toUpperCase();
              // Letra → índice: A=0, B=1, C=2, D=3, E=4
              idxCorreta = letra.charCodeAt(0) - 65;
            }
            // idxErrada já foi definido pelo radio marcado
          }
        }

        /* 3. Enunciado + texto associado ────────────────────────────────── */
        // Todos os blocos de conteúdo são .flex.mt-2.image-max-size.xs12
        // O padrão é:
        //   - Se há 1 bloco  → é o enunciado
        //   - Se há 2+ blocos → os primeiros N-1 são contexto/texto-associado,
        //                       o último é o enunciado da questão
        const contentDivs = Array.from(
          questaoEl.querySelectorAll(".flex.mt-2.image-max-size.xs12")
        );

        let enunciadoHtml = "";
        let contextoHtml  = "";

        if (contentDivs.length === 0) return null;

        if (contentDivs.length === 1) {
          enunciadoHtml = cloneHtml(contentDivs[0]);
        } else {
          // Últim bloco = enunciado
          enunciadoHtml = cloneHtml(contentDivs[contentDivs.length - 1]);
          // Todos os anteriores = contexto/texto associado
          const ctxParts = contentDivs
            .slice(0, -1)
            .map(d => cloneHtml(d))
            .filter(h => h.replace(/&nbsp;/g, "").replace(/\s/g, "").length > 5);
          if (ctxParts.length) {
            contextoHtml = ctxParts.join("\n");
          }
        }

        // Mescla contexto + enunciado
        if (contextoHtml && enunciadoHtml) {
          enunciadoHtml =
            `<div class="cc-contexto">${contextoHtml}</div>` +
            `<hr style="border:1px solid #ccc;margin:8px 0">` +
            enunciadoHtml;
        } else if (contextoHtml && !enunciadoHtml) {
          enunciadoHtml = contextoHtml;
        }

        if (!enunciadoHtml || enunciadoHtml.length < 10) return null;

        /* 4. Metadados ──────────────────────────────────────────────────── */
        const metaDivs = questaoEl.querySelectorAll(
          ".align-item-center.flex-auto.flex-wrap"
        );

        let materia = "Geral";
        let assunto = "";
        let banca   = "";
        let ano     = "";
        let orgao   = "";

        if (metaDivs[0]) {
          const m = parseMeta(metaDivs[0]);
          if (m["Disciplina"]) materia = m["Disciplina"];
          if (m["Assunto"])    assunto = m["Assunto"];
        }
        if (metaDivs[1]) {
          const m = parseMeta(metaDivs[1]);
          if (m["Banca"])  banca = m["Banca"];
          if (m["Ano"])    ano   = m["Ano"];
          if (m["Órgão"])  orgao = m["Órgão"];
        }

        const bancaCompleta = [banca, orgao, ano].filter(Boolean).join(" | ");
        const materiaLimpa  = materia.replace(/[:"\/\\]/g, "").trim() || "Geral";

        /* 5. Chave de deduplicação ──────────────────────────────────────── */
        // name do radiogroup (ex: "v-radio-472") — Vue garante unicidade por questão
        const radioInput = questaoEl.querySelector(
          ".v-input--radio-group__input input[type='radio']"
        );
        const idQuestao = radioInput ? radioInput.name : "";

        return {
          enunciado:   enunciadoHtml,
          alternativas,
          idxCorreta,
          idxErrada,
          materia,
          materiaLimpa,
          assunto,
          banca:       bancaCompleta,
          explicacao:  "",
          resultado,
          idQuestao,
          plataforma:  this.nomePlataforma,
          url:         window.location.href,
          timestamp:   new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/Focus] Erro ao capturar questão:", e);
        return null;
      }
    },

    // Focus não tem seção de comentários para capturar
    capturarComentarios: null,
  };
})();
