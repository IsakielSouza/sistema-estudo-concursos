// sites/deltinha.js — CaveiraCards adapter para Deltinha
// Suporta: www.deltinha.com.br/questoes
// Expõe: window.CaveiraCardsAdapter

(function () {
  "use strict";

  window.CaveiraCardsAdapter = {
    nomePlataforma: "Deltinha",
    deckBase: "CaveiraCards::Deltinha",
    modelName: "CaveiraCards",
    tags: ["deltinha", "caveira-cards"],

    // Seletor do container de cada questão (filtrado por presença do enunciado)
    seletorQuestao: ".rounded-lg.shadow-sm",

    // Retorna true se a questão foi respondida (feedback visível)
    questaoRespondida(questaoEl) {
      const feedback = questaoEl.children[1]?.children[1];
      return !!(feedback?.innerText?.includes("Resposta"));
    },

    detectarErro() {
      return !!document.querySelector('[class*="status-error-border"]');
    },

    detectarAcerto() {
      return (
        !!document.querySelector('[class*="status-success-border"]') &&
        !document.querySelector('[class*="status-error-border"]')
      );
    },

    capturarQuestao(questaoEl) {
      try {
        // ── Enunciado ──
        const enunciadoEl = questaoEl.querySelector(".text-base.leading-relaxed");
        if (!enunciadoEl) return null;
        const enunciado = enunciadoEl.innerHTML.trim();
        if (!enunciado) return null;

        // ── Alternativas ──
        const altsContainer = questaoEl.children[1]?.children[0];
        const altEls = altsContainer
          ? Array.from(altsContainer.querySelectorAll(".w-full.group"))
          : [];

        const alternativas = [];
        let idxCorreta = -1;
        let idxErrada  = -1;

        altEls.forEach((altEl) => {
          const letraEl = altEl.querySelector("span");
          const textoEl = altEl.querySelector(".flex-1.text-sm");
          const texto   = textoEl?.innerText?.trim();
          if (!texto) return;

          const i = alternativas.length;
          alternativas.push(texto);

          if (textoEl?.className?.includes("status-success-text")) idxCorreta = i;
          if (textoEl?.className?.includes("status-error-text"))   idxErrada  = i;
        });

        // ── Feedback — confirmar erro/acerto ──
        const feedbackEl = questaoEl.children[1]?.children[1];
        const feedbackText = feedbackEl?.innerText || "";
        const resultado = feedbackText.includes("incorreta") ? "Erros" : "Revisão";

        // ── Metadados: disciplina, assunto ──
        const header   = questaoEl.children[0];
        const metaText = header?.innerText?.trim() || "";

        const disciplinaMatch = metaText.match(/Disciplina:\s*([^\n]+)/);
        const assuntoMatch    = metaText.match(/Assunto:\s*([^\n]+)/);

        // Matéria principal = span whitespace-nowrap (ex: "Jurisprudência em Teses")
        // Disciplina mais específica quando disponível
        const materiaEl  = header?.querySelector("span.whitespace-nowrap");
        const materiaRaw = disciplinaMatch?.[1]?.trim()
                        || materiaEl?.innerText?.trim()
                        || "Geral";
        const assunto    = assuntoMatch?.[1]?.trim() || "";

        // Banca: quando presente após "|" no header (ex: "CESPE | 2023")
        let banca = "";
        const bancaMatch = metaText.match(/Banca:\s*([^\n]+)/);
        if (bancaMatch) banca = bancaMatch[1].trim();

        const materiaLimpa = materiaRaw.replace(/[:"]/g, "").trim();

        return {
          enunciado,
          alternativas,
          idxCorreta,
          idxErrada,
          materia: materiaRaw,
          materiaLimpa,
          assunto,
          banca,
          explicacao: "",
          resultado,
          plataforma: this.nomePlataforma,
          url: window.location.href,
          timestamp: new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/Deltinha] Erro ao capturar questão:", e);
        return null;
      }
    },

    capturarComentarios() {
      return null;
    },
  };
})();
