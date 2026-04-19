// sites/tec.js — CaveiraCards adapter para TEC Concursos
// Expõe: window.CaveiraCardsAdapter
//
// Convenções (API GLOBAL, reaproveitada por content.js):
//   detectarErro()  / detectarAcerto()          → bool
//   capturarQuestao()                            → objeto questão
//   capturarComentarioProfessor()                → { html, type:"professor" } | null
//   capturarComentariosAlunos(max=5)             → [{ html, score, type:"aluno", _liEl, _btnLike }]
//   abrirPaineisComentarios(tipo)                → bool  ("comentario" | "discussao")
//   capturarComentarios(el?)                     → compat (prof + alunos concatenados, até 5+1)
//   capturarUnicoComentario(btnLike)             → captura avulsa via clique no 👍
//   marcarComentarioComoSalvo(item)              → clica no 👍 (se não ativo) e marca dedup
//
(function () {
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     HELPERS LOCAIS
  ══════════════════════════════════════════════════════════════ */
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

  function limparInline(node) {
    node.querySelectorAll("*").forEach(el => {
      el.removeAttribute("style");
      el.removeAttribute("color");
      el.removeAttribute("face");
      el.removeAttribute("size");
    });
  }

  function sanitizarHtml(html) {
    return String(html || "")
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\s+on\w+="[^"]*"/gi, "")
      .replace(/\s+on\w+='[^']*'/gi, "")
      .trim();
  }

  // Simula atalhos nativos (O = comentário do professor, F = fórum)
  function simularTecla(key, keyCode) {
    ["keydown", "keypress", "keyup"].forEach(tipo => {
      document.dispatchEvent(new KeyboardEvent(tipo, {
        key, keyCode, which: keyCode, bubbles: true, cancelable: true
      }));
    });
  }

  async function esperarPainel(seletor, timeoutMs = 3000, passoMs = 100) {
    const passos = Math.ceil(timeoutMs / passoMs);
    for (let i = 0; i < passos; i++) {
      if (document.querySelector(seletor)) return true;
      await new Promise(r => setTimeout(r, passoMs));
    }
    return false;
  }

  /* ══════════════════════════════════════════════════════════════
     ADAPTER
  ══════════════════════════════════════════════════════════════ */
  window.CaveiraCardsAdapter = {
    nomePlataforma: "TEC Concursos",

    /* ── Detecta resultado ─────────────────────────────────────── */
    detectarErro() {
      return !!document.querySelector(
        "li.erro, .questao-enunciado-resolucao-errou, .questao-resultado-errou"
      );
    },

    detectarAcerto() {
      return !!document.querySelector(
        "li.acerto, .questao-enunciado-resolucao-acertou, .questao-resultado-acertou"
      );
    },

    /* ── Captura da questão ────────────────────────────────────── */
    capturarQuestao() {
      try {
        /* 1. Texto Associado (se houver) */
        let textoAssociado = "";
        const textoAssocEl = document.querySelector(".questao-enunciado-texto");
        if (textoAssocEl) {
          const clone = textoAssocEl.cloneNode(true);
          limparInline(clone);
          const conteudo = clone.innerHTML.trim();
          if (conteudo) {
            textoAssociado = `
              <div class="cc-texto-associado-wrap">
                <div class="cc-texto-associado-toggle">
                  <span>Texto associado</span>
                  <span class="cc-texto-associado-icon">+</span>
                </div>
                <div class="cc-texto-associado-content" style="display: none;">
                  ${conteudo}
                </div>
              </div>`;
          }
        }

        /* 2. Enunciado (comando) */
        const enunciadoEl = primeiroCSSQuery(
          ".questao-enunciado-comando",
          ".questao-enunciado"
        );
        if (!enunciadoEl && !textoAssociado) return null;

        const enuncClone = enunciadoEl
          ? enunciadoEl.cloneNode(true)
          : document.createElement("div");
        limparInline(enuncClone);

        // Evita duplicar texto associado (pode vir dentro do enunciado)
        enuncClone
          .querySelectorAll(".questao-enunciado-texto")
          .forEach(el => el.remove());
        // Remove listas de alternativas embutidas
        enuncClone.querySelectorAll("ul, ol, li").forEach(el => el.remove());
        // Remove blocos de resolução/feedback embutidos
        enuncClone
          .querySelectorAll(
            ".questao-enunciado-resolucao, " +
            ".questao-resultado, " +
            ".questao-enunciado-alternativa-correta-marcada, " +
            ".questao-enunciado-resolucao-errou, " +
            ".questao-enunciado-resolucao-acertou"
          )
          .forEach(el => el.remove());

        let enunciadoPrincipal = enuncClone.innerHTML.trim();

        // Corta marcadores de feedback que possam ter sobrado como texto puro
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
        for (const corte of cortes) {
          const regex = new RegExp(
            corte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ".*",
            "gi"
          );
          enunciadoPrincipal = enunciadoPrincipal.replace(regex, "").trim();
        }

        const enunciado = (textoAssociado + enunciadoPrincipal).trim();
        if (!enunciado || enunciado.length < 5) return null;

        /* 3. Alternativas */
        const todosLis = Array.from(
          document.querySelectorAll("li[ng-repeat*='alternativa']")
        );

        const alternativas = [];
        let idxCorreta = -1;
        let idxErrada = -1;
        const vistos = new Set();

        todosLis.forEach(el => {
          const divTexto = el.querySelector(".questao-enunciado-alternativa-texto");
          if (!divTexto) return;

          const clone = divTexto.cloneNode(true);
          clone.querySelectorAll("p.elemento-vazio, p[size]").forEach(p => p.remove());
          const texto = clone.innerText.replace(/\s+/g, " ").trim();
          if (!texto || vistos.has(texto)) return;

          const arrIdx = alternativas.length;
          vistos.add(texto);
          alternativas.push(texto);

          const isCorreta =
            el.classList.contains("correcao") ||
            el.classList.contains("acerto") ||
            el.classList.contains("correta");
          const isErrada =
            el.classList.contains("erro") ||
            el.classList.contains("errada");

          if (isCorreta && idxCorreta === -1) idxCorreta = arrIdx;
          if (isErrada && idxErrada === -1) idxErrada = arrIdx;
        });

        if (alternativas.length === 0) return null;

        /* 4. Matéria e assunto */
        let materia = "Geral";
        const materiaEl = primeiroCSSQuery(
          ".questao-cabecalho-informacoes-materia a",
          ".questao-cabecalho-informacoes-materia"
        );
        if (materiaEl) materia = textoLimpo(materiaEl);

        let assunto = "";
        const assuntoEl = primeiroCSSQuery(
          ".questao-cabecalho-informacoes-assunto a",
          ".questao-cabecalho-informacoes-assunto"
        );
        if (assuntoEl) assunto = textoLimpo(assuntoEl);

        /* 5. Banca */
        let banca = "";
        const bancaEl = document.querySelector(".questao-titulo");
        if (bancaEl) banca = textoLimpo(bancaEl);

        /* 6. ID da questão */
        let idQuestao = "";
        const idEl = document.querySelector(".id-questao");
        if (idEl) idQuestao = textoLimpo(idEl).replace(/^#/, "");

        /* 7. Resolução / explicação */
        let explicacao = "";
        const resEl = primeiroCSSQuery(
          ".questao-enunciado-resolucao-texto",
          ".questao-enunciado-resolucao"
        );
        if (resEl) {
          const resClone = resEl.cloneNode(true);
          resClone
            .querySelectorAll(
              ".resolucao-cabecalho, h4, h5, " +
              ".questao-enunciado-resolucao-errou, " +
              ".questao-enunciado-resolucao-acertou"
            )
            .forEach(h => h.remove());
          explicacao = resClone.innerHTML.trim();
        }

        const materiaLimpa =
          materia.replace(/[:"\/\\\[\]]/g, "").trim() || "Geral";
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
          url: window.location.href,
          timestamp: new Date().toLocaleDateString("pt-BR"),
        };
      } catch (e) {
        console.error("[CaveiraCards/TEC] Erro ao capturar questão:", e);
        return null;
      }
    },

    /* ── Abre painel de comentários ──
       tipo: "comentario" (Professor) | "discussao" (Alunos)
       Retorna true se o painel ficou disponível COM conteúdo.
    */
    async abrirPaineisComentarios(tipo) {
      const wrapperSel = `.questao-complementos-${tipo}`;

      // Seletores de conteúdo (não apenas wrapper) — garante que o Angular
      // terminou de renderizar de fato antes de tentar capturar.
      const contentSel = tipo === "comentario"
        ? [
            ".questao-complementos-comentario-conteudo-texto",
            ".questao-complementos-comentario-conteudo",
            ".questao-complementos-comentario-texto",
            ".questao-complementos-comentario .conteudo-texto",
          ].join(", ")
        : [
            "ul.discussao-comentarios li",
            ".discussao ul li",
            ".discussao-comentarios li",
          ].join(", ");

      // Se já está aberto, ainda assim esperamos pelo conteúdo real
      const jaAberto = document.querySelector(wrapperSel);
      if (jaAberto) {
        const conteudoJa = await esperarPainel(contentSel, 2000);
        console.log(
          `[CaveiraCards/TEC] painel(${tipo}) já aberto · conteúdo=${conteudoJa}`
        );
        if (conteudoJa) return true;
        // Se não tem conteúdo, tenta reabrir para forçar render
      }

      // Tenta botão Angular primeiro, depois atalho de teclado
      const botao = document.querySelector(
        `button[ng-click="vm.abrirComplemento('${tipo}')"]`
      );
      if (botao) {
        console.log(`[CaveiraCards/TEC] painel(${tipo}) → click() no botão`);
        botao.click();
      } else {
        // Atalhos nativos: O = comentário do professor, F = fórum
        const isProf = tipo === "comentario";
        console.log(
          `[CaveiraCards/TEC] painel(${tipo}) → botão não achado, usando atalho ` +
          (isProf ? "'O'" : "'F'")
        );
        simularTecla(isProf ? "o" : "f", isProf ? 79 : 70);
      }

      // Espera primeiro o wrapper aparecer
      const wrapperOk = await esperarPainel(wrapperSel, 3000);
      if (!wrapperOk) {
        console.warn(
          `[CaveiraCards/TEC] wrapper "${wrapperSel}" NÃO apareceu em 3s`
        );
        // Fallback para "discussao": a UL pode aparecer sem o wrapper esperado
        if (tipo === "discussao") {
          const ul = document.querySelector(
            "ul.discussao-comentarios, .discussao ul"
          );
          if (ul && ul.offsetParent !== null) return true;
        }
        return false;
      }

      // Agora espera o conteúdo real (Angular pode levar +500ms pra popular)
      const conteudoOk = await esperarPainel(contentSel, 3000);
      if (!conteudoOk) {
        console.warn(
          `[CaveiraCards/TEC] wrapper apareceu mas conteúdo "${contentSel}" não`
        );
      } else {
        console.log(`[CaveiraCards/TEC] painel(${tipo}) pronto`);
      }
      return conteudoOk || wrapperOk; // retorna true se pelo menos wrapper existe
    },

    /* ── Captura SÓ o comentário do professor (obrigatório) ── */
    async capturarComentarioProfessor() {
      try {
        // Lista defensiva de seletores — TEC muda DOM de tempos em tempos
        const candidatos = [
          ".questao-complementos-comentario-conteudo-texto",
          ".questao-complementos-comentario-conteudo",
          ".questao-complementos-comentario-texto",
          ".questao-complementos-comentario .conteudo-texto",
          ".questao-complementos-comentario",
        ];

        // Pequeno retry (até 2s) caso o Angular ainda esteja hidratando
        let el = null;
        let seletorUsado = "";
        for (let tentativa = 0; tentativa < 8 && !el; tentativa++) {
          for (const sel of candidatos) {
            const candidato = document.querySelector(sel);
            const txt = candidato ? (candidato.innerText || "").trim() : "";
            if (candidato && txt.length >= 10) {
              el = candidato;
              seletorUsado = sel;
              break;
            }
          }
          if (!el) await new Promise(r => setTimeout(r, 250));
        }

        if (!el) {
          console.warn(
            "[CaveiraCards/TEC] comentário do professor: nenhum seletor casou"
          );
          return null;
        }

        // Remove botões/controles internos antes de serializar
        const clone = el.cloneNode(true);
        clone
          .querySelectorAll(
            "button, .questao-complementos-comentario-botoes, " +
            ".questao-complementos-comentario-cabecalho"
          )
          .forEach(x => x.remove());
        limparInline(clone);

        const html = sanitizarHtml(clone.innerHTML);
        if (!html) {
          console.warn("[CaveiraCards/TEC] professor: HTML vazio após sanitizar");
          return null;
        }

        console.log(
          `[CaveiraCards/TEC] professor capturado via "${seletorUsado}" ` +
          `(${html.length} chars)`
        );
        return { score: 9999, html, type: "professor" };
      } catch (e) {
        console.error("[CaveiraCards/TEC] capturarComentarioProfessor:", e);
        return null;
      }
    },

    /* ── Captura top N comentários dos alunos (fórum) ── */
    async capturarComentariosAlunos(max = 5) {
      try {
        // Retry curto pra aguardar Angular popular a UL
        let ul = null;
        for (let i = 0; i < 8 && !ul; i++) {
          ul = primeiroCSSQuery(
            "ul.discussao-comentarios",
            ".discussao ul"
          );
          if (ul && ul.offsetParent !== null && ul.querySelector("li")) break;
          ul = null;
          await new Promise(r => setTimeout(r, 250));
        }
        if (!ul) {
          console.warn("[CaveiraCards/TEC] alunos: ul não encontrada/vazia");
          return [];
        }

        const items = Array.from(ul.querySelectorAll("li"))
          .map(li => {
            // Pula comentários já marcados como salvos pelo CaveiraCards
            if (li.dataset && li.dataset.caveiraLiked === "true") return null;

            const scoreEl = li.querySelector(
              ".discussao-comentario-nota-numero .ng-binding, .nota-numero"
            );
            const textoEl = li.querySelector(
              ".discussao-comentario-post-texto"
            );
            if (!textoEl) return null;

            const score = scoreEl
              ? parseInt(scoreEl.textContent.trim(), 10) || 0
              : 0;
            const html = sanitizarHtml(textoEl.innerHTML);
            if (!html) return null;

            const btnLike = li.querySelector(
              "button.discussao-comentario-nota-seta.nota-positiva"
            );

            // Props com _ são ignoradas pela serialização (anki.js usa só html/score/type)
            return { score, html, type: "aluno", _liEl: li, _btnLike: btnLike };
          })
          .filter(Boolean);

        items.sort((a, b) => b.score - a.score);
        return items.slice(0, max);
      } catch (e) {
        console.error("[CaveiraCards/TEC] capturarComentariosAlunos:", e);
        return [];
      }
    },

    /* ── Compat: retorna prof + alunos concatenados
       (usada por outros sites/fluxos que ainda esperam array único) */
    async capturarComentarios() {
      const out = [];
      const prof = await this.capturarComentarioProfessor();
      if (prof) out.push(prof);
      const alunos = await this.capturarComentariosAlunos(5);
      out.push(...alunos);
      return out.length ? out : null;
    },

    /* ── Captura avulsa via clique no 👍 (Gostei) ── */
    capturarUnicoComentario(btnLike) {
      const li = btnLike.closest("li");
      if (!li) return null;
      const textoEl = li.querySelector(".discussao-comentario-post-texto");
      if (!textoEl) return null;
      const html = sanitizarHtml(textoEl.innerHTML);
      if (!html) return null;

      const scoreEl = li.querySelector(
        ".discussao-comentario-nota-numero .ng-binding, .nota-numero"
      );
      const score = scoreEl
        ? parseInt(scoreEl.textContent.trim(), 10) || 0
        : 0;

      return { score, html, type: "aluno", _liEl: li, _btnLike: btnLike };
    },

    /* ── Marca o comentário como salvo ────────────────────────────
       options.click (default true):
         true  → clica no 👍 se ainda não estiver ativo (evita desmarcar)
         false → só seta data-caveira-liked (usado no fluxo manual,
                 onde o próprio clique do usuário já disparou o like)
       Marca data-caveira-liked="true" no <li> para servir de dedup
       no próximo ciclo de captura.
       Retorna: true se foi marcado agora (ou já estava); false se falhou.
    */
    async marcarComentarioComoSalvo(item, options) {
      try {
        if (!item || !item._liEl) return false;
        const li = item._liEl;
        const click = !options || options.click !== false;

        if (li.dataset.caveiraLiked === "true") return true;

        if (click) {
          const btn = item._btnLike ||
            li.querySelector("button.discussao-comentario-nota-seta.nota-positiva");
          if (btn) {
            // Heurística: classes que indicam like já ativo
            const jaAtivo =
              btn.classList.contains("ativo") ||
              btn.classList.contains("active") ||
              btn.classList.contains("selecionado") ||
              btn.getAttribute("aria-pressed") === "true";

            if (!jaAtivo) {
              btn.click();
              // pequeno respiro pro Angular atualizar a UI
              await new Promise(r => setTimeout(r, 150));
            }
          }
        }

        li.dataset.caveiraLiked = "true";
        return true;
      } catch (e) {
        console.warn("[CaveiraCards/TEC] marcarComentarioComoSalvo:", e);
        return false;
      }
    },
  };
})();
