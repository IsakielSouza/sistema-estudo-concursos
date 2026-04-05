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
      return !!document.querySelector("li.erro, .questao-enunciado-resolucao-errou");
    },

    detectarAcerto() {
      return !!document.querySelector("li.acerto, .questao-enunciado-resolucao-acertou");
    },

    capturarQuestao() {
      try {
        // ... (código anterior igual até a parte de alternativas)
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

        // Índice correta/errada — ATUALIZADO para aceitar .acerto e .correcao
        let idxCorreta = -1;
        let idxErrada = -1;
        todosLis.filter(el =>
          el.classList.contains("correcao") || el.classList.contains("acerto") || el.classList.contains("erro")
        ).forEach(el => {
          const divTexto = el.querySelector(".questao-enunciado-alternativa-texto");
          if (!divTexto) return;
          const texto = divTexto.innerText.trim();
          const idx = textos.indexOf(texto);
          if (idx === -1) return;
          if (el.classList.contains("correcao") || el.classList.contains("acerto")) idxCorreta = idx;
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

        // ID da Questão (NOVO)
        let idQuestao = "";
        const idEl = document.querySelector(".id-questao");
        if (idEl) idQuestao = idEl.innerText.replace("#", "").trim();

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
          idQuestao,
          plataforma: this.nomePlataforma,
          url: window.location.href,
          timestamp: new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/TEC] Erro ao capturar questão:", e);
        return null;
      }
    },

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
        const html = textoEl.innerHTML.trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/\s+on\w+="[^"]*"/gi, "")
          .replace(/\s+on\w+='[^']*'/gi, "");
        if (!html) return null;
        return { score, html };
      }).filter(Boolean);

      if (!comentarios.length) return null;

      comentarios.sort((a, b) => b.score - a.score);
      return comentarios.slice(0, 3);
    },
  };
})();
