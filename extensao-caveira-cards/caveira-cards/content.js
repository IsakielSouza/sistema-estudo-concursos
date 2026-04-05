// content.js — CaveiraCards dispatcher principal
// Depende de: window.CaveiraCardsAdapter, window.CaveiraAnki, window.CaveiraCardBuilder
// (injetados antes pelo manifest na ordem correta)

(function () {
  "use strict";

  const adapter = window.CaveiraCardsAdapter;
  if (!adapter) return;

  const LOGO_URL = chrome.runtime.getURL("CaveiraCards.png");

  // Rastro de questões já processadas (evita duplicar overlays)
  const processadas = new Set();
  let overlayEl = null;

  // ── Toggle liga/desliga ──
  let extensaoAtiva = true;
  chrome.storage.local.get("caveiraCardsEnabled", ({ caveiraCardsEnabled }) => {
    extensaoAtiva = caveiraCardsEnabled !== false;
  });
  chrome.storage.onChanged.addListener((changes) => {
    if ("caveiraCardsEnabled" in changes) {
      extensaoAtiva = changes.caveiraCardsEnabled.newValue !== false;
      if (!extensaoAtiva && overlayEl) {
        overlayEl.remove();
        overlayEl = null;
      } else if (extensaoAtiva) {
        verificar();
      }
    }
  });

  // ── Setup automático do Anki (só roda até conseguir) ──
  chrome.storage.local.get("ankiSetupDone_v6", async ({ ankiSetupDone_v6 }) => {
    if (ankiSetupDone_v6) return;
    try {
      await window.CaveiraAnki.configurarAnki();
      chrome.storage.local.set({ ankiSetupDone_v6: true });
    } catch (e) {
      console.warn("[CaveiraCards] configurarAnki falhou:", e);
    }
  });

  // ── Observador de mudanças no DOM ──
  const observer = new MutationObserver(() => verificar());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(verificar, 2000);

  function verificar() {
    if (!extensaoAtiva) return;
    // TEC: uma questão por vez na página
    if (adapter.nomePlataforma === "TEC Concursos") {
      if (!adapter.detectarErro() && !adapter.detectarAcerto()) return;
      const questao = adapter.capturarQuestao();
      if (!questao) return;
      const chave = questao.enunciado.substring(0, 80);
      if (processadas.has(chave)) return;
      processadas.add(chave);
      mostrarOverlay(questao);
      return;
    }

    // Gran: múltiplas questões por página
    if (adapter.nomePlataforma === "Gran Questões") {
      const questoesEl = document.querySelectorAll(".ds-question--answered");
      questoesEl.forEach(questaoEl => {
        const enuncEl = questaoEl.querySelector(".ds-question__body__statement");
        if (!enuncEl) return;
        const chave = enuncEl.innerText.trim().substring(0, 80);
        if (!chave || processadas.has(chave)) return;
        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;
        processadas.add(chave);
        mostrarOverlay(questao);
      });
    }

    // QConcursos: múltiplas questões por página (suporta app. e www.)
    if (adapter.nomePlataforma === "QConcursos") {
      const seletor = adapter.seletorQuestao;
      const questoesEl = document.querySelectorAll(seletor);

      // Seletor do enunciado varia conforme interface
      const seletorEnunc = adapter.interface === "www"
        ? ".q-question-enunciation"
        : ".statement-container";

      questoesEl.forEach(questaoEl => {
        if (!adapter.questaoRespondida(questaoEl)) return;
        const enuncEl = questaoEl.querySelector(seletorEnunc);
        if (!enuncEl) return;
        const chave = enuncEl.innerText.trim().substring(0, 80);
        if (!chave || processadas.has(chave)) return;
        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;
        processadas.add(chave);
        mostrarOverlay(questao);
      });
    }

    // Deltinha: múltiplas questões por página
    if (adapter.nomePlataforma === "Deltinha") {
      document.querySelectorAll(adapter.seletorQuestao).forEach(questaoEl => {
        if (!adapter.questaoRespondida(questaoEl)) return;
        const enuncEl = questaoEl.querySelector(".text-base.leading-relaxed");
        if (!enuncEl) return;
        const chave = enuncEl.innerText.trim().substring(0, 80);
        if (!chave || processadas.has(chave)) return;
        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;
        processadas.add(chave);
        mostrarOverlay(questao);
      });
    }
  }

  // ── Overlay ──

  function mostrarOverlay(questao) {
    // Remove overlay anterior se existir
    if (overlayEl) overlayEl.remove();

    const overlay = document.createElement("div");
    overlay.id = "cc-overlay";
    overlay.classList.add(questao.resultado === "Erros" ? "errou" : "acertou");

    overlay.innerHTML = `
      <div class="cc-card">
        <img class="cc-icon" src="${LOGO_URL}" alt="CaveiraCards">
        <div class="cc-text">
          <span class="cc-title">Adicionar ao Anki</span>
          <span class="cc-sub">${questao.resultado} · ${questao.materia}</span>
        </div>
        <button class="cc-close" title="Fechar">✕</button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlayEl = overlay;

    // Clique no card → enviar para Anki (bloqueado após sucesso)
    overlay.querySelector(".cc-card").addEventListener("click", e => {
      if (e.target.classList.contains("cc-close")) return;
      if (overlay.classList.contains("sucesso")) return;
      enviarParaAnki(questao);
    });

    // Clique no X → remove definitivamente
    overlay.querySelector(".cc-close").addEventListener("click", e => {
      e.stopPropagation();
      overlay.remove();
      overlayEl = null;
    });
  }

  function formatarComentarios(comentarios) {
    const items = comentarios.map(c =>
      `<div class="cc-comentario"><span class="cc-score">▲ ${c.score}</span><div>${c.html}</div></div>`
    ).join("");
    return `<hr style="border:1px solid #e5e7eb;margin:12px 0"><div class="cc-comentarios"><strong>💬 Top comentários</strong>${items}</div>`;
  }

  async function enviarParaAnki(questao) {
    const overlay = overlayEl;
    if (!overlay) return;
    const titleEl = overlay.querySelector(".cc-title");
    const subEl = overlay.querySelector(".cc-sub");

    titleEl.textContent = "Enviando...";
    overlay.classList.add("loading");

    try {
      const { frente, verso } = window.CaveiraCardBuilder.montarCard(questao);
      const noteId = await window.CaveiraAnki.enviarQuestao(questao, frente, verso);
      const extraOriginal = [questao.banca, questao.explicacao].filter(Boolean).join("<br><br>");

      overlay.classList.remove("loading", "errou", "acertou");
      overlay.classList.add("sucesso");
      titleEl.textContent = "Adicionado! ✓";
      subEl.textContent = questao.materia;

      // Botão 📎 para capturar comentários
      if (typeof adapter.capturarComentarios === "function") {
        const btnComent = document.createElement("button");
        btnComent.className = "cc-btn-comentarios";
        btnComent.title = "Capturar comentários";
        btnComent.textContent = "📎";
        overlay.querySelector(".cc-card").appendChild(btnComent);

        btnComent.addEventListener("click", async e => {
          e.stopPropagation();
          const comentarios = adapter.capturarComentarios();
          if (!comentarios) {
            btnComent.textContent = "⚠️";
            btnComent.title = "Abra o painel de comentários primeiro";
            setTimeout(() => {
              if (!btnComent.isConnected) return;
              btnComent.textContent = "📎";
              btnComent.title = "Capturar comentários";
            }, 2000);
            return;
          }
          const comentariosHtml = formatarComentarios(comentarios);
          const extraFinal = extraOriginal
            ? extraOriginal + comentariosHtml
            : comentariosHtml.replace(/^<hr[^>]*>/, "");
          btnComent.disabled = true;
          try {
            await window.CaveiraAnki.atualizarExtra(noteId, extraFinal);
            btnComent.textContent = "✓";
            setTimeout(() => { if (btnComent.isConnected) btnComent.remove(); }, 1000);
          } catch (err) {
            btnComent.disabled = false;
            btnComent.textContent = "❌";
            setTimeout(() => {
              if (!btnComent.isConnected) return;
              btnComent.textContent = "📎";
            }, 2000);
          }
        });
      }

    } catch (err) {
      overlay.classList.remove("loading");
      overlay.classList.add("falha");

      if (err.message.includes("Failed to fetch")) {
        titleEl.textContent = "Anki fechado!";
        subEl.textContent = "Abra o Anki e tente de novo";
      } else if (err.message.includes("duplicate")) {
        titleEl.textContent = "Já existe no deck";
        subEl.textContent = "Questão duplicada";
      } else {
        titleEl.textContent = "Erro ao enviar";
        subEl.textContent = err.message.substring(0, 40);
      }

      // Após 4s volta ao estado normal
      setTimeout(() => {
        if (!overlay.isConnected) return;
        overlay.classList.remove("falha");
        titleEl.textContent = "Adicionar ao Anki";
        subEl.textContent = `${questao.resultado} · ${questao.materia}`;
      }, 4000);
    }
  }
})();
