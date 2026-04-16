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

        // ── Enunciado e Conteúdo de Apoio ──
        let textoAssociado = "";
        const supportingContentEl = sec1.querySelector(".question-supporting-content");
        if (supportingContentEl) {
          const conteudoAssoc = supportingContentEl.innerHTML.trim();
          if (conteudoAssoc) {
            textoAssociado = `
              <div class="cc-texto-associado-wrap">
                <div class="cc-texto-associado-toggle">
                  <span>Conteúdo de apoio</span>
                  <span class="cc-texto-associado-icon">+</span>
                </div>
                <div class="cc-texto-associado-content" style="display: none;">
                  ${conteudoAssoc}
                </div>
              </div>`;
          }
        }

        // sec1.children[0] pode ser o "Conteúdo de apoio" (expansion item)
        // sec1.querySelector(".content") é o enunciado principal
        const contentEl = sec1.querySelector(".content");
        if (!contentEl && !textoAssociado) return null;

        const enuncClone = contentEl ? contentEl.cloneNode(true) : document.createElement("div");
        // Remove o conteúdo de apoio de dentro do enunciado se ele estiver lá duplicado
        enuncClone.querySelectorAll(".question-supporting-content").forEach(el => el.remove());

        const enunciadoPrincipal = enuncClone.innerHTML.trim();
        const enunciado = (textoAssociado + enunciadoPrincipal).trim();
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

    async capturarComentarios(questaoEl) {
      // Encontra o card da questão atual se não foi passado
      const card = questaoEl || (() => {
        const cards = document.querySelectorAll(this.seletorQuestao);
        for (const c of cards) {
          if (c.querySelector(".subtitle-stats")) return c;
        }
        return null;
      })();

      if (!card) return null;

      // ── 1. Comentário do professor ──
      // Clica no botão da aba se .teacher-comment ainda não está no DOM
      if (!card.querySelector(".teacher-comment")) {
        const tabBtn =
          card.querySelector('button[title="Comentário do professor"]') ||
          Array.from(card.querySelectorAll("button")).find(b =>
            b.innerText?.toLowerCase().includes("comentário do professor")
          );
        if (tabBtn) {
          tabBtn.click();
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      const comentarios = [];
      const teacherEl = card.querySelector(".teacher-comment") || document.querySelector(".teacher-comment");
      if (teacherEl && teacherEl.innerHTML.trim()) {
        comentarios.push({ score: 9999, html: teacherEl.innerHTML.trim() });
      }

      // ── 2. Comentários dos alunos ──
      // Clica na aba de comentários se disponível
      const studentTabBtn =
        card.querySelector('button[title="Comentários dos alunos"]') ||
        Array.from(card.querySelectorAll("button")).find(b =>
          b.innerText?.toLowerCase().includes("comentários")
        );
      if (studentTabBtn) {
        studentTabBtn.click();
        await new Promise(r => setTimeout(r, 1000));
      }

      // No Projeto Caveira (Quasar), comentários costumam estar em .q-list ou .comment-item
      const commentItems = Array.from(card.querySelectorAll(".q-item.items-start, .comment-item"));
      commentItems.forEach(item => {
        const textEl = item.querySelector(".q-item__label--caption, .comment-text, .text-body2");
        if (!textEl) return;
        
        // Busca likes (ex: um span com número perto de um ícone de thumb_up)
        const likesEl = item.querySelector(".q-btn .q-badge, .likes-count");
        const score = likesEl ? (parseInt(likesEl.innerText, 10) || 0) : 0;
        
        const html = textEl.innerHTML.trim();
        if (html && html.length > 5) {
          comentarios.push({ score, html });
        }
      });

      if (!comentarios.length) return null;

      // Ordena por score e remove duplicados
      comentarios.sort((a, b) => b.score - a.score);
      const vistos = new Set();
      const final = comentarios.filter(c => {
        const mini = c.html.substring(0, 100);
        if (vistos.has(mini)) return false;
        vistos.add(mini);
        return true;
      });

      return final.slice(0, 5);
    },

    // ── Helper para captura manual via clique no Like ──
    capturarUnicoComentario(btnLike) {
      // Sobe até o container do comentário
      const container = btnLike.closest(".q-item, .comment-item, li");
      if (!container) return null;

      const textEl = container.querySelector(".q-item__label--caption, .comment-text, .text-body2, .discussao-comentario-post-texto");
      if (!textEl) return null;

      const html = textEl.innerHTML.trim();
      return html ? { score: "Manual", html } : null;
    }
  };
})();
