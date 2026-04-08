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

    // ── Capturar comentários do professor e top alunos via Vue instance ──────
    async capturarComentarios() {
      try {
        // ── 1. Encontrar o Vue instance do componente de comentários ──────────
        let vm = null;
        for (const el of document.querySelectorAll("*")) {
          const vk = Object.keys(el).find(k => k.startsWith("__vue"));
          if (!vk) continue;
          const inst = el[vk];
          if (inst?.$data?.comments !== undefined && inst?.$props?.questionId) {
            vm = inst;
            break;
          }
        }
        if (!vm) return null;

        // ── Helper: esperar chip aparecer e clicar nele ────────────────────────
        function clickChip(label) {
          const chip = Array.from(document.querySelectorAll(".ds-chip-toggle__chips__chip"))
            .find(c => c.innerText?.trim() === label);
          chip?.click();
          return !!chip;
        }

        // ── Helper: sanitizar HTML ─────────────────────────────────────────────
        function sanitizarHtml(html) {
          return (html || "")
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/\s+on\w+="[^"]*"/gi, "")
            .replace(/\s+on\w+='[^']*'/gi, "")
            .trim();
        }

        const comentarios = [];

        // ── 2. Ativar aba Comentários e carregar professor ─────────────────────
        document.querySelector("a[href*='#comentarios']")?.click();
        await new Promise(r => setTimeout(r, 400));

        clickChip("Professor");
        await new Promise(r => setTimeout(r, 2000));

        const tc = vm.$data?.teacherComment;
        if (tc) {
          const html = sanitizarHtml(tc.texto || tc.conteudo || tc.content || "");
          if (html.length > 20) {
            comentarios.push({ score: 999, html });
          }
        }

        // ── 3. Carregar comentários dos alunos ────────────────────────────────
        clickChip("Alunos");
        await new Promise(r => setTimeout(r, 2000));

        const displayed = vm.$data?.comments?.displayed || [];
        const items = displayed.map(c => {
          const score = c.curtidas || c.likes || c.total_curtidas || 0;
          const html = sanitizarHtml(c.texto || c.conteudo || c.content || "");
          if (!html || html.length < 10) return null;
          return { score, html };
        }).filter(Boolean);

        // Top 3 por relevância (curtidas)
        items.sort((a, b) => b.score - a.score);
        comentarios.push(...items.slice(0, 3));

        return comentarios.length ? comentarios : null;
      } catch (e) {
        console.error("[CaveiraCards/Gran] capturarComentarios erro:", e);
        return null;
      }
    },
  };
})();
