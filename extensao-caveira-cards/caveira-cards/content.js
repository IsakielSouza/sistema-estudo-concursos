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
  let timerMinimizar = null;

  // ── Setup automático do Anki (só roda até conseguir) ──
  chrome.storage.local.get("ankiSetupDone_v2", async ({ ankiSetupDone_v2 }) => {
    if (ankiSetupDone_v2) return;
    try {
      await window.CaveiraAnki.configurarAnki();
      chrome.storage.local.set({ ankiSetupDone_v2: true });
    } catch (e) {
      // Anki fechado — tenta na próxima visita
    }
  });

  // ── Observador de mudanças no DOM ──
  const observer = new MutationObserver(() => verificar());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(verificar, 2000);

  function verificar() {
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
  }

  // ── Overlay ──

  function mostrarOverlay(questao) {
    // Remove overlay anterior se existir
    if (overlayEl) overlayEl.remove();
    clearTimeout(timerMinimizar);

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
      <img class="cc-mini" src="${LOGO_URL}" alt="CaveiraCards" title="CaveiraCards — clique para expandir">
    `;

    document.body.appendChild(overlay);
    overlayEl = overlay;

    // Clique no card → enviar para Anki
    overlay.querySelector(".cc-card").addEventListener("click", e => {
      if (e.target.classList.contains("cc-close")) return;
      enviarParaAnki(questao);
    });

    // Clique no X → remove definitivamente
    overlay.querySelector(".cc-close").addEventListener("click", e => {
      e.stopPropagation();
      overlay.remove();
      overlayEl = null;
      clearTimeout(timerMinimizar);
    });

    // Clique no ícone minimizado → expande de volta
    overlay.querySelector(".cc-mini").addEventListener("click", () => {
      overlay.classList.remove("minimizado");
      clearTimeout(timerMinimizar);
      timerMinimizar = setTimeout(() => minimizar(overlay), 5000);
    });

    // Minimiza automaticamente após 5s
    timerMinimizar = setTimeout(() => minimizar(overlay), 5000);
  }

  function minimizar(overlay) {
    if (!overlay.isConnected) return;
    overlay.classList.add("minimizado");
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
      await window.CaveiraAnki.enviarQuestao(questao, frente, verso);

      overlay.classList.remove("loading", "errou", "acertou");
      overlay.classList.add("sucesso");
      titleEl.textContent = "Adicionado! ✓";
      subEl.textContent = questao.materia;

      // Após 2.5s minimiza (não remove — fica como ícone)
      clearTimeout(timerMinimizar);
      timerMinimizar = setTimeout(() => minimizar(overlay), 2500);

    } catch (err) {
      overlay.classList.remove("loading");
      overlay.classList.add("falha");

      if (err.message.includes("Failed to fetch")) {
        titleEl.textContent = "Anki fechado!";
        subEl.textContent = "Abra o Anki e tente de novo";
      } else if (err.message.includes("duplicate")) {
        titleEl.textContent = "Já existe no deck";
        subEl.textContent = "Questão duplicada";
        setTimeout(() => {
          if (!overlay.isConnected) return;
          overlay.remove();
          overlayEl = null;
        }, 1000);
        return;
      } else {
        titleEl.textContent = "Erro ao enviar";
        subEl.textContent = err.message.substring(0, 40);
      }

      // Após 4s volta ao estado normal e minimiza
      setTimeout(() => {
        if (!overlay.isConnected) return;
        overlay.classList.remove("falha");
        titleEl.textContent = "Adicionar ao Anki";
        subEl.textContent = `${questao.resultado} · ${questao.materia}`;
        minimizar(overlay);
      }, 4000);
    }
  }
})();
