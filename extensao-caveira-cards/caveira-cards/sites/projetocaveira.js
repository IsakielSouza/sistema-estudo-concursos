// sites/projetocaveira.js — CaveiraCards adapter para Projeto Caveira
// Suporta: app.caveira.com/questions
// Framework: Vue 3 + Quasar
// Expõe: window.CaveiraCardsAdapter

(function () {
  "use strict";

  window.CaveiraCardsAdapter = {
    nomePlataforma: "ProjetoCaveira",
    deckBase: "CaveiraCards::ProjetoCaveira",
    modelName: "CaveiraCards",
    tags: ["projeto-caveira", "caveira-cards"],

    // Seletor do container de cada questão
    seletorQuestao: ".q-card.q-card--dark.q-mb-lg.full-width",

    // Retorna true se a questão foi respondida (subtitle-stats visível)
    questaoRespondida(questaoEl) {
      return !!questaoEl.querySelector(".subtitle-stats");
    },

    capturarQuestao(questaoEl) {
      try {
        const sections = questaoEl.querySelectorAll(".q-card__section");
        const sec0 = sections[0]; // header: código, matéria, banca
        const sec1 = sections[1]; // body: enunciado, alternativas, resultado

        if (!sec0 || !sec1) return null;

        // ── Código ──
        const codigo =
          sec0.querySelector(".number > span")?.innerText?.trim() || "";

        // ── Matéria (breadcrumb "A -> B -> C") ──
        const materiaRaw =
          sec0.querySelector(".subject")?.innerText?.trim() || "Geral";
        // Pegar último nível do breadcrumb
        const materiaPartes = materiaRaw.split("->").map((s) => s.trim());
        const materiaLimpa = materiaPartes[materiaPartes.length - 1] || "Geral";
        // Disciplina = primeiro nível
        const disciplina = materiaPartes[0] || materiaLimpa;

        // ── Banca ──
        const qInfo = sec0.querySelector(".question-info");
        let banca = "";
        if (qInfo) {
          const bancaSpan = Array.from(qInfo.querySelectorAll("span")).find(
            (s) => s.innerText?.includes("Banca:")
          );
          if (bancaSpan) {
            banca = bancaSpan.innerText.replace("Banca:", "").trim();
            if (banca === "A definir") banca = "";
          }
        }

        // ── Enunciado ──
        // sec1.children[0] = "Conteúdo de apoio" (expansion item, skip)
        // sec1.children[1] = .content = enunciado
        const contentEl = sec1.querySelector(".content");
        if (!contentEl) return null;
        const enunciado = contentEl.innerHTML.trim();
        if (!enunciado) return null;

        // ── Alternativas ──
        const altsContainer = sec1.querySelector(".question-alternatives");
        const altEls = altsContainer
          ? Array.from(altsContainer.querySelectorAll(".alternative"))
          : [];

        const alternativas = [];
        let idxCorreta = -1;
        let idxErrada = -1;

        altEls.forEach((altEl, i) => {
          const letra = altEl.querySelector(".alternative-letter")?.innerText?.trim();
          const texto = altEl.querySelector(".alternative-content")?.innerText?.trim();
          if (!texto) return;

          alternativas.push(texto);

          const progEl = altEl.querySelector(".q-linear-progress");
          const progCls = (progEl?.className || "").toString();
          if (progCls.includes("bg-correct-2")) idxCorreta = i;
        });

        // ── Resultado ──
        const statusEl = questaoEl.querySelector(".subtitle-stats");
        const statusCls = (statusEl?.className || "").toString();
        const resultado = statusCls.includes("bg-incorrect-2") ? "Erros" : "Revisão";

        // ── Para C/E: inferir alternativa errada ──
        // "Resposta correta: C" → user escolheu E, e vice-versa
        if (resultado === "Erros" && alternativas.length === 2) {
          const statusText = statusEl?.innerText?.trim() || "";
          const match = statusText.match(/Resposta correta:\s*([A-Z])/);
          if (match) {
            const letraCorreta = match[1];
            // alternativa errada = a que NÃO é a correta
            altEls.forEach((altEl, i) => {
              const letra = altEl.querySelector(".alternative-letter")?.innerText?.trim();
              if (letra && letra !== letraCorreta) idxErrada = i;
            });
          }
        }

        // ── Comentário do Professor ──
        // Busca primeiro dentro do card, depois no documento inteiro
        // (o painel da aba pode estar renderizado fora do card no DOM)
        const teacherCommentEl =
          questaoEl.querySelector(".teacher-comment") ||
          document.querySelector(".teacher-comment");
        const explicacao = teacherCommentEl?.innerHTML?.trim() || "";

        return {
          enunciado,
          alternativas,
          idxCorreta,
          idxErrada,
          materia: disciplina,
          materiaLimpa: disciplina.replace(/[:"]/g, "").trim(),
          assunto: materiaLimpa,
          banca,
          explicacao,
          resultado,
          plataforma: this.nomePlataforma,
          url: window.location.href,
          timestamp: new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/ProjetoCaveira] Erro ao capturar questão:", e);
        return null;
      }
    },

    capturarComentarios() {
      return null;
    },
  };
})();
