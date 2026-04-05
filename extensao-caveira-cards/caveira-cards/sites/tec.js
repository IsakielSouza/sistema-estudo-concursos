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
