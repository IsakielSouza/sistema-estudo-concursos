// sites/qconcurso.js — CaveiraCards adapter para QConcursos
// Suporta automaticamente duas interfaces:
//   • app.qconcursos.com  → Svelte SPA (interface "Mesa de Estudos")
//   • www.qconcursos.com  → Rails (interface "Questões de Concursos")
// Expõe: window.CaveiraCardsAdapter

(function () {
  "use strict";

  // ── Detectar qual interface está ativa ──────────────────────────────────────
  const isApp = !!document.querySelector(".main.rounded-lg") ||
                window.location.hostname === "app.qconcursos.com";
  const isWww = !!document.querySelector(".js-question-item") ||
                window.location.hostname === "www.qconcursos.com";

  // ── Helpers compartilhados ──────────────────────────────────────────────────

  function parseBancaWww(infoEl) {
    if (!infoEl) return "";
    // Cada span tem "Banca: VUNESP", "Órgão: UNIFIPA" — extrair só o valor após ": "
    const spans = Array.from(infoEl.querySelectorAll("span"));
    let banca = "", orgao = "";
    spans.forEach(sp => {
      const t = sp.innerText?.trim();
      if (t?.startsWith("Banca:"))  banca = t.replace("Banca:", "").trim();
      if (t?.startsWith("Órgão:"))  orgao = t.replace("Órgão:", "").trim();
    });
    return [banca, orgao].filter(Boolean).join(" | ");
  }

  // ── ADAPTER ─────────────────────────────────────────────────────────────────
  window.CaveiraCardsAdapter = {
    nomePlataforma: "QConcursos",
    deckBase: "CaveiraCards::QConcursos",
    modelName: "CaveiraCards",
    tags: ["qconcursos", "caveira-cards"],

    // Qual interface está ativa (usado pelo content.js)
    interface: isApp ? "app" : "www",

    // ── Seletores conforme interface ──
    seletorQuestao: isApp ? ".main.rounded-lg.elevation-1" : ".js-question-item",

    // ── Detectar se questão foi respondida AGORA (trigger do overlay) ──
    questaoRespondida(questaoEl) {
      if (isApp) {
        return !!questaoEl.querySelector(".question-feedback");
      }
      // www: .js-response-wrong ou .js-response-correct com display != none
      const wrong   = questaoEl.querySelector(".js-response-wrong");
      const correct = questaoEl.querySelector(".js-response-correct");
      const visible = (el) => el && getComputedStyle(el).display !== "none";
      return visible(wrong) || visible(correct);
    },

    detectarErro() {
      if (isApp) return !!document.querySelector(".alternative-container.wrong");
      const wrong = document.querySelector(".js-response-wrong");
      return wrong ? getComputedStyle(wrong).display !== "none" : false;
    },

    detectarAcerto() {
      if (isApp) {
        return !!document.querySelector(".alternative-container.right") &&
               !document.querySelector(".alternative-container.wrong");
      }
      const correct = document.querySelector(".js-response-correct");
      return correct ? getComputedStyle(correct).display !== "none" : false;
    },

    // ── Captura principal ────────────────────────────────────────────────────
    capturarQuestao(questaoEl) {
      try {
        return isApp
          ? this._capturarApp(questaoEl)
          : this._capturarWww(questaoEl);
      } catch (e) {
        console.error("[CaveiraCards/QConcursos] Erro ao capturar questão:", e);
        return null;
      }
    },

    // ── Interface app.qconcursos.com ─────────────────────────────────────────
    _capturarApp(questaoEl) {
      const enunciadoEl = questaoEl.querySelector(".statement-container");
      if (!enunciadoEl) return null;
      const enunciado = enunciadoEl.innerHTML.trim();
      if (!enunciado) return null;

      const altEls = questaoEl.querySelectorAll(".alternative-container");
      const alternativas = [];
      let idxCorreta = -1, idxErrada = -1;

      altEls.forEach((el) => {
        const lines = (el.innerText?.trim() || "").split("\n").map(l => l.trim()).filter(Boolean);
        const texto = lines.slice(1).join(" ").trim();
        if (!texto) return;
        const i = alternativas.length;
        alternativas.push(texto);
        if (el.classList.contains("right"))  idxCorreta = i;
        if (el.classList.contains("wrong"))  idxErrada  = i;
      });

      let banca = "", materia = "Geral", assunto = "", instituicao = "";
      const headerEl = questaoEl.querySelector("header");
      if (headerEl) {
        const bancaEl = headerEl.querySelector(".font-weight-bold.font-size-2");
        if (bancaEl) banca = bancaEl.innerText.trim();
        const textos = [...new Set(
          Array.from(headerEl.querySelectorAll(".d-inline-block"))
            .map(el => el.innerText?.trim()).filter(Boolean)
        )];
        if (textos.length > 1) materia    = textos[1];
        if (textos.length > 2) assunto    = textos[2];
        if (textos.length > 3) instituicao = textos[3];
      }

      const feedbackText = questaoEl.querySelector(".question-feedback")?.innerText || "";
      const resultado = (feedbackText.includes("incorreta") || idxErrada !== -1)
        ? "Erros" : "Revisão";

      return this._montarDados({
        enunciado, alternativas, idxCorreta, idxErrada,
        materia, assunto,
        banca: [banca, instituicao].filter(Boolean).join(" | "),
        resultado
      });
    },

    // ── Interface www.qconcursos.com ─────────────────────────────────────────
    _capturarWww(questaoEl) {
      /* 1. Texto Associado (se houver) ────────────────────────── */
      let textoAssociado = "";
      const textoAssocEl = questaoEl.querySelector(".q-question-text");
      if (textoAssocEl) {
        const cloneAssoc = textoAssocEl.cloneNode(true);
        // Remove os links de "Texto associado" que são botões de abrir/fechar
        cloneAssoc.querySelectorAll("a.q-link").forEach(a => a.remove());
        // Remove ícones
        cloneAssoc.querySelectorAll("i.q-icon").forEach(i => i.remove());
        
        const conteudoAssoc = cloneAssoc.innerHTML.trim();
        if (conteudoAssoc) {
          textoAssociado = `
            <div class="cc-texto-associado-wrap">
              <div class="cc-texto-associado-toggle">
                <span>Texto associado</span>
                <span class="cc-texto-associado-icon">+</span>
              </div>
              <div class="cc-texto-associado-content" style="display: none;">
                ${conteudoAssoc}
              </div>
            </div>`;
        }
      }

      /* 2. Enunciado Principal ────────────────────────────────── */
      const enunciadoEl = questaoEl.querySelector(".q-question-enunciation");
      if (!enunciadoEl && !textoAssociado) return null;
      
      const enunciadoPrincipal = enunciadoEl ? enunciadoEl.innerHTML.trim() : "";
      const enunciado = (textoAssociado + enunciadoPrincipal).trim();
      if (!enunciado) return null;

      // Alternativas: letra (value do input) + texto (span .js-alternative-content)
      const labels = Array.from(questaoEl.querySelectorAll("label.js-choose-alternative"));
      const alternativas = [];
      let idxCorreta = -1, idxErrada = -1;
      const letraParaIdx = {};

      labels.forEach((lb) => {
        const input  = lb.querySelector("input.js-question-answer");
        const span   = lb.querySelector(".js-alternative-content");
        const texto  = span?.innerText?.trim();
        const letra  = input?.value?.trim().toUpperCase();
        if (!texto || !letra) return;
        const i = alternativas.length;
        alternativas.push(texto);
        letraParaIdx[letra] = i;
      });

      // Alternativa errada = radio marcado quando js-response-wrong visível
      const wrongVisible = getComputedStyle(
        questaoEl.querySelector(".js-response-wrong") || document.createElement("div")
      ).display !== "none";

      if (wrongVisible) {
        const checkedInput = questaoEl.querySelector("input.js-question-answer:checked");
        const letraErrada = checkedInput?.value?.toUpperCase();
        if (letraErrada && letraParaIdx[letraErrada] !== undefined)
          idxErrada = letraParaIdx[letraErrada];

        // Alternativa correta = span .js-question-right-answer (populado via AJAX)
        const letraCorreta = questaoEl.querySelector(".js-question-right-answer")
          ?.innerText?.trim().toUpperCase();
        if (letraCorreta && letraParaIdx[letraCorreta] !== undefined)
          idxCorreta = letraParaIdx[letraCorreta];
      } else {
        // Acertou: radio marcado é a correta
        const checkedInput = questaoEl.querySelector("input.js-question-answer:checked");
        const letraCorreta = checkedInput?.value?.toUpperCase();
        if (letraCorreta && letraParaIdx[letraCorreta] !== undefined)
          idxCorreta = letraParaIdx[letraCorreta];
      }

      // Matéria e assunto (breadcrumb)
      const breadLinks = Array.from(questaoEl.querySelectorAll(".q-question-breadcrumb a"));
      const materia  = breadLinks[0]?.innerText?.trim() || "Geral";
      const assunto  = breadLinks[1]?.innerText?.trim() || "";

      // Banca/Órgão
      const infoEl = questaoEl.querySelector(".q-question-info");
      const banca  = parseBancaWww(infoEl);

      const resultado = wrongVisible ? "Erros" : "Revisão";

      return this._montarDados({
        enunciado, alternativas, idxCorreta, idxErrada,
        materia, assunto, banca, resultado
      });
    },

    // ── Montar objeto padronizado ────────────────────────────────────────────
    _montarDados({ enunciado, alternativas, idxCorreta, idxErrada,
                   materia, assunto, banca, resultado }) {
      return {
        enunciado,
        alternativas,
        idxCorreta,
        idxErrada,
        materia,
        materiaLimpa: materia.replace(/[:"]/g, "").trim(),
        assunto,
        banca,
        explicacao: "",
        resultado,
        plataforma: this.nomePlataforma,
        url: window.location.href,
        timestamp: new Date().toLocaleDateString("pt-BR"),
      };
    },

    // ── Capturar comentários: professor (Gabarito Comentado) + aulas relevantes ──
    async capturarComentarios(questaoEl) {
      try {
        const root = questaoEl || document;

        // ── Helper: esperar elemento aparecer no container ──
        function waitForEl(container, selector, timeout = 3000) {
          return new Promise(resolve => {
            const found = container.querySelector(selector);
            if (found) { resolve(found); return; }
            const timer = setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
            const obs = new MutationObserver(() => {
              const f = container.querySelector(selector);
              if (f) { clearTimeout(timer); obs.disconnect(); resolve(f); }
            });
            obs.observe(container, { childList: true, subtree: true });
          });
        }

        // ── Helper: sanitizar HTML removendo scripts e eventos inline ──
        function sanitizarHtml(html) {
          return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/\s+on\w+="[^"]*"/gi, "")
            .replace(/\s+on\w+='[^']*'/gi, "")
            .trim();
        }

        // ── Helper: ativar aba e retornar o painel de conteúdo ──
        async function activateTab(tabLink) {
          const href = tabLink.getAttribute("href") || "";
          const paneId = href.replace("#", "");
          if (!paneId) return null;
          const pane = document.getElementById(paneId);
          if (!pane) return null;
          tabLink.click();
          // Aguarda 1,8s para AJAX carregar o conteúdo
          await new Promise(r => setTimeout(r, 1800));
          return pane;
        }

        const comentarios = [];

        // ── 1. Comentário do professor (Gabarito Comentado) ─────────────────
        const teacherTabLink = root.querySelector("a[data-component-name=\"question_teacher\"]");
        if (teacherTabLink) {
          const pane = await activateTab(teacherTabLink);
          if (pane) {
            const isEmpty = !!pane.querySelector(".q-empty-list-message");
            if (!isEmpty) {
              const commentEl =
                pane.querySelector(".q-comment-text") ||
                pane.querySelector(".q-teacher-comment") ||
                pane.querySelector(".q-answer") ||
                pane.querySelector(".panel-body");
              const html = sanitizarHtml((commentEl || pane).innerHTML);
              if (html && html.length > 30) {
                comentarios.push({ score: 9999, html, type: "professor" });
              }
            }
          }
        }

        // ── 2. Comentários dos Alunos e Aulas ──────────────────────────────
        // Tenta primeiro a aba de comentários dos alunos, depois a de aulas
        const tabsToTry = [
          "a[data-component-name=\"question_comments\"]",
          "a[data-component-name=\"question_lessons\"]"
        ];

        for (const selector of tabsToTry) {
          const tabLink = root.querySelector(selector);
          if (!tabLink) continue;

          const pane = await activateTab(tabLink);
          if (!pane) continue;

          const isEmpty = !!pane.querySelector(".q-empty-list-message");
          if (isEmpty) continue;

          // Busca todos os blocos de comentários
          const commentBlocks = Array.from(pane.querySelectorAll(".js-question-comment, .q-lesson-item, .q-comment"));
          
          const items = commentBlocks.map(block => {
            // Texto do comentário
            const textEl = block.querySelector(".js-question-comment-text, .q-comment-text, .q-lesson-text");
            if (!textEl) return null;

            // Likes
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

          comentarios.push(...items);
        }

        if (!comentarios.length) return null;

        // Ordena por curtidas e remove duplicados (mesmo HTML)
        comentarios.sort((a, b) => b.score - a.score);
        const vistos = new Set();
        const final = comentarios.filter(c => {
          const mini = c.html.substring(0, 100);
          if (vistos.has(mini)) return false;
          vistos.add(mini);
          return true;
        });

        // Retorna os 5 melhores
        return final.slice(0, 5);

      } catch (e) {
        console.error("[CaveiraCards/QConcursos] capturarComentarios erro:", e);
        return null;
      }
    },

    // ── Helper para captura manual via clique no Like ──
    capturarUnicoComentario(btnLike) {
      const container = btnLike.closest(".js-question-comment, .q-comment, .q-lesson-item");
      if (!container) return null;
      const textEl = container.querySelector(".js-question-comment-text, .q-comment-text, .q-lesson-text");
      if (!textEl) return null;
      const html = textEl.innerHTML.trim();
      return html ? { score: "Manual", html } : null;
    }
  };
})();
