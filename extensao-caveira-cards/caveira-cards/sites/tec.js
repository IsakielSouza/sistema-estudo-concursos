// sites/tec.js — CaveiraCards adapter para TEC Concursos
// Expõe: window.CaveiraCardsAdapter

(function () {
  "use strict";

  /* ── helpers ── */
  function primeiroCSSQuery(...seletores) {
    for (const s of seletores) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  }

  function textoLimpo(el) {
    if (!el) return "";
    return el.innerText.replace(/\s+/g, " ").trim();
  }

  /* ─────────────────────────────────────────────────────────────
     ADAPTER
  ───────────────────────────────────────────────────────────── */
  window.CaveiraCardsAdapter = {
    nomePlataforma: "TEC Concursos",
    deckBase:       "CaveiraCards::TEC Concursos",
    modelName:      "CaveiraCards",
    tags:           ["tec-concursos", "caveira-cards"],

    /* ── Detecta resultado ── */
    detectarErro() {
      return !!(
        document.querySelector("li.erro") ||
        document.querySelector(".questao-enunciado-resolucao-errou") ||
        document.querySelector(".questao-resultado-errou")
      );
    },

    detectarAcerto() {
      return !!(
        document.querySelector("li.acerto") ||
        document.querySelector(".questao-enunciado-resolucao-acertou") ||
        document.querySelector(".questao-resultado-acertou")
      );
    },

    /* ── Captura questão ── */
    capturarQuestao() {
      try {
        /* 1. Texto Associado (se houver) ────────────────────────── */
        let textoAssociado = "";
        const textoAssocEl = primeiroCSSQuery(
          ".questao-enunciado-texto",
          "[class*='enunciado-texto']",
          ".questao-enunciado .texto"
        );
        if (textoAssocEl) {
          const cloneAssoc = textoAssocEl.cloneNode(true);
          // Limpeza de estilos que poluem o Anki
          cloneAssoc.querySelectorAll("*").forEach(el => {
            el.removeAttribute("style");
            el.removeAttribute("color");
            el.removeAttribute("face");
            el.removeAttribute("size");
          });
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

        /* 2. Enunciado (Comando) ────────────────────────────────── */
        const enunciadoEl = primeiroCSSQuery(
          ".questao-enunciado-comando",
          "[class*='questao-enunciado-comando']",
          ".questao-enunciado .comando",
          ".questao-enunciado"
        );
        if (!enunciadoEl && !textoAssociado) return null;

        const enuncClone = enunciadoEl ? enunciadoEl.cloneNode(true) : document.createElement("div");
        // Remove estilos inline que causam texto preto no Anki
        enuncClone.querySelectorAll("*").forEach(el => {
          el.removeAttribute("style");
          el.removeAttribute("color");
          el.removeAttribute("face");
          el.removeAttribute("size");
        });
        // IMPORTANTE: Remove o bloco de texto associado se ele estiver dentro do clone do enunciado,
        // para evitar que apareça 2x (uma vez no toggle e outra aberta).
        enuncClone.querySelectorAll(
          ".questao-enunciado-texto, " +
          "[class*='enunciado-texto']"
        ).forEach(el => el.remove());

        // Remove listas de alternativas que podem estar dentro do enunciado
        enuncClone.querySelectorAll("ul, ol, li").forEach(el => el.remove());
        // Remove elementos de resolução e feedback embutidos que poluem o enunciado
        enuncClone.querySelectorAll(
          ".questao-enunciado-resolucao, " +
          "[class*='resolucao'], " +
          ".questao-resultado, " +
          "[class*='resultado'], " +
          ".questao-enunciado-comando-resolucao, " +
          ".questao-enunciado-alternativa-correta-marcada, " +
          ".questao-enunciado-resolucao-errou, " +
          ".questao-enunciado-resolucao-acertou"
        ).forEach(el => el.remove());

        let enunciadoPrincipal = enuncClone.innerHTML.trim();

        // Lista exaustiva de marcadores de feedback que devem ser cortados
        const cortes = [
          "Você selecionou:",
          "Você errou!",
          "Você acertou!",
          "Gabarito:",
          "Gabarito :",
          "Resposta correta:",
          "Ver resolução",
          "Sua resposta:",
          "Resultado:",
        ];
        
        // Remove qualquer texto de feedback que tenha sobrado como texto puro
        for (const corte of cortes) {
          const regex = new RegExp(corte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ".*", "gi");
          enunciadoPrincipal = enunciadoPrincipal.replace(regex, "").trim();
        }

        const enunciado = (textoAssociado + enunciadoPrincipal).trim();
        if (!enunciado || enunciado.length < 5) return null;

        /* 3. Alternativas ──────────────────────────────────────── */
        // Coleta todos os <li> de alternativas, rastreando o índice
        // DIRETAMENTE no array (sem comparação de texto posterior)
        const todosLis = Array.from(
          document.querySelectorAll("li[ng-repeat*='alternativa']")
        );

        const alternativas = [];
        let idxCorreta = -1;
        let idxErrada  = -1;
        const vistos   = new Set();

        todosLis.forEach(el => {
          const divTexto = el.querySelector(
            ".questao-enunciado-alternativa-texto, .alternativa-texto"
          );
          if (!divTexto) return;

          const clone = divTexto.cloneNode(true);
          clone.querySelectorAll("p.elemento-vazio, p[size]").forEach(p => p.remove());
          const texto = clone.innerText.replace(/\s+/g, " ").trim();
          if (!texto || vistos.has(texto)) return;

          const arrIdx = alternativas.length;
          vistos.add(texto);
          alternativas.push(texto);

          // Identifica correta e errada pelo índice de array
          const isCorreta =
            el.classList.contains("correcao") ||
            el.classList.contains("acerto")   ||
            el.classList.contains("correta");
          const isErrada =
            el.classList.contains("erro") ||
            el.classList.contains("errada");

          if (isCorreta && idxCorreta === -1) idxCorreta = arrIdx;
          if (isErrada  && idxErrada  === -1) idxErrada  = arrIdx;
        });

        if (alternativas.length === 0) return null;

        /* 3. Matéria e assunto ──────────────────────────────────── */
        let materia = "Geral";
        const materiaEl = primeiroCSSQuery(
          ".questao-cabecalho-informacoes-materia a",
          ".questao-cabecalho-informacoes-materia",
          "[class*='materia'] a",
          "[class*='materia']"
        );
        if (materiaEl) materia = textoLimpo(materiaEl);

        let assunto = "";
        const assuntoEl = primeiroCSSQuery(
          ".questao-cabecalho-informacoes-assunto a",
          ".questao-cabecalho-informacoes-assunto",
          "[class*='assunto'] a"
        );
        if (assuntoEl) assunto = textoLimpo(assuntoEl);

        /* 4. Banca ─────────────────────────────────────────────── */
        let banca = "";
        const bancaEl = primeiroCSSQuery(
          ".questao-titulo",
          "[class*='questao-titulo']",
          ".questao-cabecalho-titulo"
        );
        if (bancaEl) banca = textoLimpo(bancaEl);

        /* 5. ID da questão ─────────────────────────────────────── */
        let idQuestao = "";
        const idEl = primeiroCSSQuery(".id-questao", "[class*='id-questao']");
        if (idEl) idQuestao = textoLimpo(idEl).replace(/^#/, "");

        /* 6. Resolução / explicação ────────────────────────────── */
        let explicacao = "";
        const resEl = primeiroCSSQuery(
          ".questao-enunciado-resolucao-texto",
          ".questao-enunciado-resolucao .texto",
          ".questao-enunciado-resolucao",
          "[class*='resolucao-texto']",
          "[class*='resolucao']"
        );
        if (resEl) {
          // Limpa o clone: remove cabeçalhos como "Resolução:" que são visuais
          const resClone = resEl.cloneNode(true);
          resClone.querySelectorAll(
            ".resolucao-cabecalho, h4, h5, " +
            ".questao-enunciado-resolucao-errou, " +
            ".questao-enunciado-resolucao-acertou"
          ).forEach(h => h.remove());
          explicacao = resClone.innerHTML.trim();
        }

        const materiaLimpa = materia.replace(/[:"\/\\\[\]]/g, "").trim() || "Geral";
        const resultado = this.detectarErro() ? "Erros" : "Revisão";

        return {
          enunciado,
          alternativas,
          idxCorreta,
          idxErrada,
          materia,
          materiaLimpa,
          assunto,
          banca,
          explicacao,
          resultado,
          idQuestao,
          plataforma: this.nomePlataforma,
          url:        window.location.href,
          timestamp:  new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/TEC] Erro ao capturar questão:", e);
        return null;
      }
    },

    /* ── Captura comentários (professor + fórum) ── */
    async capturarComentarios() {
      try {
        const comentarios = [];

        // 1. Comentário do Professor (seção específica)
        const professorEl = document.querySelector(".questao-complementos-comentario-conteudo-texto");
        if (professorEl) {
          const html = professorEl.innerHTML.trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/\s+on\w+="[^"]*"/gi, "")
            .replace(/\s+on\w+='[^']*'/gi, "");
          if (html) {
            comentarios.push({ score: 9999, html, type: "professor" });
          }
        }

        // 2. Fórum de discussão (Alunos)
        const ul = primeiroCSSQuery(
          "ul.discussao-comentarios",
          ".discussao ul",
          "[class*='discussao'] ul"
        );

        if (ul && ul.offsetParent !== null) {
          const items = Array.from(ul.querySelectorAll("li"));
          const itemsAlunos = items.map(li => {
            const scoreEl = li.querySelector(".discussao-comentario-nota-numero .ng-binding, .nota-numero, [class*='nota-numero']");
            const textoEl = li.querySelector(".discussao-comentario-post-texto, .comentario-texto, [class*='post-texto'], [class*='comentario-texto']");
            if (!textoEl) return null;

            const score = scoreEl ? (parseInt(scoreEl.textContent.trim(), 10) || 0) : 0;
            const html = textoEl.innerHTML.trim()
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
              .replace(/\s+on\w+="[^"]*"/gi, "")
              .replace(/\s+on\w+='[^']*'/gi, "");

            return html ? { score, html, type: "aluno" } : null;
          }).filter(Boolean);

          comentarios.push(...itemsAlunos);
        }

        if (!comentarios.length) return null;

        // Ordena por tipo (professor primeiro) e depois por score
        comentarios.sort((a, b) => {
          if (a.type === "professor" && b.type !== "professor") return -1;
          if (a.type !== "professor" && b.type === "professor") return 1;
          return b.score - a.score;
        });

        return comentarios.slice(0, 6); // Professor + top 5 alunos
      } catch (e) {
        console.error("[CaveiraCards/TEC] Erro ao capturar comentários:", e);
        return null;
      }
    },

    // ── Helper para captura manual via clique no Like ──
    capturarUnicoComentario(btnLike) {
      const li = btnLike.closest("li");
      if (!li) return null;
      const textoEl = li.querySelector(".discussao-comentario-post-texto, .comentario-texto, [class*='post-texto']");
      if (!textoEl) return null;
      const html = textoEl.innerHTML.trim();
      return html ? { score: "Manual", html } : null;
    }
  };
})();
