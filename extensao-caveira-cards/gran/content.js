// ============================================================
// Gran Questões → Anki | content.js
// Desenvolvido por @concurseiroti2025
// ============================================================

(function () {
  "use strict";

  const questoesCapturadas = new Set();
  let processando = false;

  const observer = new MutationObserver(() => {
    if (processando) return;
    verificarRespostaErrada();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(verificarRespostaErrada, 2000);

  function verificarRespostaErrada() {
    const questoesErradas = document.querySelectorAll(
      ".ds-question--answered .ds-question__body__options__option--wrong"
    );

    questoesErradas.forEach(el => {
      const questaoEl = el.closest(".ds-question--answered");
      if (!questaoEl) return;

      const enunciadoEl = questaoEl.querySelector(".ds-question__body__statement");
      if (!enunciadoEl) return;

      const chave = enunciadoEl.innerText.trim().substring(0, 60);
      if (!chave || questoesCapturadas.has(chave)) return;

      const questao = capturarQuestao(questaoEl);
      if (questao) {
        questoesCapturadas.add(chave);
        mostrarBotaoEnviar(questao);
      }
    });
  }

  function capturarQuestao(questaoEl) {
    try {
      const enunciadoEl = questaoEl.querySelector(".ds-question__body__statement");
      if (!enunciadoEl) return null;
      const enunciado = enunciadoEl.innerHTML.trim();
      if (!enunciado) return null;

      const opcoesEls = questaoEl.querySelectorAll(".ds-question__body__options__option");
      const alternativas = [];
      let idxCorreta = -1;
      let idxErrada = -1;

      opcoesEls.forEach((el) => {
        const descEl = el.querySelector(".ds-question__body__options__option__description");
        if (!descEl) return;
        const texto = descEl.innerText.trim();
        if (!texto) return;
        const idx = alternativas.length;
        alternativas.push(texto);
        if (el.classList.contains("ds-question__body__options__option--wrong")) idxErrada = idx;
        if (el.classList.contains("ds-question__body__options__option--right")) idxCorreta = idx;
      });

      let materia = "Geral";
      const materiaEls = questaoEl.querySelectorAll(".ds-question__header__top__subject a span");
      if (materiaEls.length > 0) {
        // Usa só a primeira matéria como nome do baralho (evita sub-baralhos duplicados)
        materia = materiaEls[0].innerText.trim();
      }

      let banca = "";
      let prova = "";
      questaoEl.querySelectorAll(".ds-question__header__bottom__info").forEach(el => {
        if (el.innerText.includes("Banca:")) banca = el.innerText.replace("Banca:", "").trim();
        if (el.innerText.includes("Prova:")) prova = el.innerText.replace("Prova:", "").trim();
      });

      const materiaLimpa = materia.replace(/[:"]/g, "").replace(/\s*>\s*/g, " - ").trim();

      return {
        enunciado, alternativas, idxCorreta, idxErrada,
        materia, materiaLimpa, banca, prova,
        url: window.location.href,
        timestamp: new Date().toLocaleDateString("pt-BR"),
      };
    } catch (e) {
      console.error("[Gran→Anki] Erro:", e);
      return null;
    }
  }

  function mostrarBotaoEnviar(questao) {
    processando = true;

    const anterior = document.getElementById("gran-anki-btn");
    if (anterior) anterior.remove();

    const btn = document.createElement("div");
    btn.id = "gran-anki-btn";
    btn.innerHTML = `
      <div class="gran-anki-inner">
        <div class="gran-anki-icon">📚</div>
        <div class="gran-anki-text">
          <span class="gran-anki-title">Adicionar ao Anki</span>
          <span class="gran-anki-sub">${questao.materia}</span>
        </div>
        <button class="gran-anki-close" id="gran-anki-close">✕</button>
      </div>
    `;

    document.body.appendChild(btn);
    setTimeout(() => {
      btn.classList.add("visible");
      processando = false;
    }, 100);

    btn.querySelector(".gran-anki-inner").addEventListener("click", (e) => {
      if (e.target.id === "gran-anki-close") return;
      enviarParaAnki(questao, btn);
    });

    btn.querySelector("#gran-anki-close").addEventListener("click", () => {
      btn.classList.remove("visible");
      setTimeout(() => btn.remove(), 400);
    });

    setTimeout(() => {
      if (document.getElementById("gran-anki-btn")) {
        btn.classList.remove("visible");
        setTimeout(() => btn.remove(), 400);
      }
    }, 15000);
  }

  function montarCard(questao) {
    const letras = ["A", "B", "C", "D", "E", "F"];

    const css = `<style>
.card-wrap{font-family:'Segoe UI',system-ui,sans-serif;max-width:640px;margin:0 auto;padding:4px;background:#fff;color:#1f2937}
.card-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.tag-materia{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:700 !important;text-transform:uppercase;background:#fff3e0 !important;color:#e65100 !important}
.card-banca{font-size:12px !important;color:#6b7280 !important;margin-bottom:10px;font-style:italic}
.card-enunciado{font-size:15px !important;line-height:1.7;color:#1f2937 !important;margin-bottom:14px}
.alts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.alt{display:flex !important;align-items:center;gap:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #e5e7eb !important;background:#f9fafb !important;font-size:13px !important;color:#1f2937 !important}
.alt.correta{background:#f0fdf4 !important;border-color:#22c55e !important;color:#166534 !important}
.alt.errada{background:#fef2f2 !important;border-color:#ef4444 !important;color:#991b1b !important}
.alt-letra{min-width:26px;height:26px;border-radius:50%;background:#e5e7eb !important;color:#374151 !important;display:flex;align-items:center;justify-content:center;font-size:12px !important;font-weight:700 !important;flex-shrink:0}
.alt.correta .alt-letra{background:#22c55e !important;color:white !important}
.alt.errada .alt-letra{background:#ef4444 !important;color:white !important}
.gabarito-label{font-size:12px !important;font-weight:700 !important;text-transform:uppercase;color:#6b7280 !important;margin-bottom:8px}
.card-fonte{margin-top:10px;font-size:11px !important;color:#9ca3af !important}
.card-fonte a{color:#ea580c !important;text-decoration:none}
</style>`;

    const altsFrente = alts => alts.map((a, i) =>
      `<div class="alt"><span class="alt-letra">${letras[i]||i+1}</span><span class="alt-texto">${a.replace(/\s+/g," ").trim()}</span></div>`
    ).join("");

    const altsVerso = (alts, ic, ie) => alts.map((a, i) => {
      const c = i===Number(ic)?"alt correta":i===Number(ie)?"alt errada":"alt";
      return `<div class="${c}"><span class="alt-letra">${letras[i]||i+1}</span><span class="alt-texto">${a.replace(/\s+/g," ").trim()}</span></div>`;
    }).join("");

    const frente = css + `<div class="card-wrap">
      <div class="card-meta"><span class="tag-materia">${questao.materia}</span></div>
      ${questao.banca?`<div class="card-banca">${questao.banca}${questao.prova?" | "+questao.prova:""}</div>`:""}
      <div class="card-enunciado">${questao.enunciado}</div>
      <div class="alts">${altsFrente(questao.alternativas)}</div>
    </div>`;

    const verso = css + `<div class="card-wrap">
      <div class="gabarito-label">Gabarito</div>
      <div class="alts">${altsVerso(questao.alternativas,questao.idxCorreta,questao.idxErrada)}</div>
      <div class="card-fonte"><a href="${questao.url}" target="_blank">🔗 Ver questão no Gran</a> | ${questao.timestamp}</div>
    </div>`;

    return { frente, verso };
  }

  async function enviarParaAnki(questao, btn) {
    const inner = btn.querySelector(".gran-anki-inner");
    inner.classList.add("loading");
    btn.querySelector(".gran-anki-title").textContent = "Enviando...";

    const anki = async (action, params) => {
      const r = await fetch("http://localhost:8765", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, version: 6, params }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      return d.result;
    };

    try {
      const { frente, verso } = montarCard(questao);
      const deckName = `Caderno de Erros::Gran Questões::${questao.materiaLimpa}`;

      await anki("createDeck", { deck: "Caderno de Erros::Gran Questões" });
      await anki("createDeck", { deck: deckName });

      await anki("addNote", {
        note: {
          deckName,
          modelName: "TEC CONCURSOS",
          fields: { Frente: frente, Verso: verso, Extra: questao.banca || "" },
          tags: ["gran-questoes", "caderno-de-erros", questao.materiaLimpa.replace(/\s+/g,"-").toLowerCase()],
          options: { allowDuplicate: false, duplicateScope: "deck" },
        },
      });

      inner.classList.remove("loading");
      inner.classList.add("success");
      btn.querySelector(".gran-anki-title").textContent = "Adicionado! ✓";
      btn.querySelector(".gran-anki-sub").textContent = questao.materia;

      setTimeout(() => {
        btn.classList.remove("visible");
        setTimeout(() => btn.remove(), 400);
      }, 2500);

    } catch (err) {
      inner.classList.remove("loading");
      inner.classList.add("error");

      if (err.message.includes("Failed to fetch")) {
        btn.querySelector(".gran-anki-title").textContent = "Anki fechado!";
        btn.querySelector(".gran-anki-sub").textContent = "Abra o Anki e tente de novo";
      } else if (err.message.includes("duplicate")) {
        btn.querySelector(".gran-anki-title").textContent = "Já existe no deck";
        btn.querySelector(".gran-anki-sub").textContent = "Questão duplicada";
      } else {
        btn.querySelector(".gran-anki-title").textContent = "Erro ao enviar";
        btn.querySelector(".gran-anki-sub").textContent = err.message;
      }

      setTimeout(() => {
        inner.classList.remove("error");
        btn.querySelector(".gran-anki-title").textContent = "Tentar novamente";
        btn.querySelector(".gran-anki-sub").textContent = questao.materia;
      }, 4000);
    }
  }

})();
