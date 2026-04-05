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
