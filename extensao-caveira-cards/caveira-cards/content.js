// content.js — CaveiraCards dispatcher principal
// Depende de: window.CaveiraCardsAdapter, window.CaveiraAnki, window.CaveiraCardBuilder
// (injetados antes pelo manifest na ordem correta)

(function () {
  "use strict";

  const adapter = window.CaveiraCardsAdapter;
  if (!adapter) return;

  const LOGO_URL = chrome.runtime.getURL("CaveiraCards.png");

  // Controle de estado
  const processadas = new Set();
  let overlayEl = null;
  let ultimaChaveTEC = null;
  let noteIdAtual = null; // Guarda o ID da nota da questão atual
  let questaoElAtual = null; // Guarda o elemento DOM da questão atual (ProjetoCaveira)
  let questaoAtual = null;  // Guarda o objeto questão atual

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
  setInterval(verificar, 1000); 

  function verificar() {
    if (!extensaoAtiva) return;
    
    if (adapter.nomePlataforma === "TEC Concursos") {
      const idEl = document.querySelector(".id-questao");
      const idAtual = idEl ? idEl.innerText.replace("#", "").trim() : null;

      if (idAtual !== ultimaChaveTEC) {
        if (overlayEl) {
          overlayEl.remove();
          overlayEl = null;
        }
        ultimaChaveTEC = idAtual;
        noteIdAtual = null; // Reset do ID da nota ao mudar de questão
      }

      if (!idAtual) return;

      const errou = adapter.detectarErro();
      const acertou = adapter.detectarAcerto();
      
      if (!errou && !acertou) {
        if (overlayEl) {
          overlayEl.remove();
          overlayEl = null;
        }
        return;
      }
      
      const questao = adapter.capturarQuestao();
      if (!overlayEl && questao) {
        mostrarOverlay(questao);
      }

      // ── Lógica Dinâmica do Botão de Comentários (TEC) ──
      if (overlayEl && overlayEl.classList.contains("sucesso")) {
        const painelAberto = !!document.querySelector(".questao-complementos-cabecalho");
        const btnExistente = overlayEl.querySelector(".cc-btn-comentarios");

        if (painelAberto && !btnExistente) {
          injetarBotaoComentarios(overlayEl, questao, noteIdAtual);
        } else if (!painelAberto && btnExistente) {
          btnExistente.remove();
        }
      }
      return;
    }

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
        questaoElAtual = questaoEl;
        questaoAtual   = questao;
        mostrarOverlay(questao);
      });

      // Botão 📎 de comentários para Gran Questões
      if (overlayEl && overlayEl.classList.contains("sucesso")) {
        const btnExistente = overlayEl.querySelector(".cc-btn-comentarios");
        if (!btnExistente && questaoElAtual) {
          injetarBotaoComentarios(overlayEl, questaoAtual || {}, noteIdAtual, questaoElAtual);
        }
      }
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
        questaoElAtual = questaoEl;
        questaoAtual   = questao;
        mostrarOverlay(questao);
      });

      // Botão 📎 de comentários para QConcursos (professor + aulas)
      if (overlayEl && overlayEl.classList.contains("sucesso")) {
        const btnExistente = overlayEl.querySelector(".cc-btn-comentarios");
        if (!btnExistente && questaoElAtual) {
          injetarBotaoComentarios(overlayEl, questaoAtual || {}, noteIdAtual, questaoElAtual);
        }
      }
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

    // Projeto Caveira: múltiplas questões por página (Vue + Quasar)
    if (adapter.nomePlataforma === "ProjetoCaveira") {
      document.querySelectorAll(adapter.seletorQuestao).forEach(questaoEl => {
        if (!adapter.questaoRespondida(questaoEl)) return;
        const sections = questaoEl.querySelectorAll(".q-card__section");
        const enuncEl = sections[1]?.querySelector(".content");
        if (!enuncEl) return;
        const chave = enuncEl.innerText.trim().substring(0, 80);
        if (!chave || processadas.has(chave)) return;
        processadas.add(chave);

        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;
        questaoElAtual = questaoEl;
        questaoAtual = questao;
        mostrarOverlay(questao);
      });
    }

    // Botão 📎 de comentários para ProjetoCaveira (igual ao TEC)
    if (adapter.nomePlataforma === "ProjetoCaveira") {
      if (overlayEl && overlayEl.classList.contains("sucesso")) {
        const btnExistente = overlayEl.querySelector(".cc-btn-comentarios");
        if (!btnExistente && questaoElAtual) {
          injetarBotaoComentarios(overlayEl, questaoAtual || {}, noteIdAtual, questaoElAtual);
        }
      }
    }

    // Focus Concursos: múltiplas questões por página (Vue SPA / Vuetify)
    // Suporta Certo/Errado e Múltipla Escolha; texto associado incluído no enunciado.
    if (adapter.nomePlataforma === "Focus Concursos") {
      document.querySelectorAll(adapter.seletorQuestao).forEach(questaoEl => {
        if (!adapter.questaoRespondida(questaoEl)) return;

        // Chave de deduplicação: name do radiogroup (ex: "v-radio-472")
        const radioInput = questaoEl.querySelector(
          ".v-input--radio-group__input input[type='radio']"
        );
        const chave = radioInput ? radioInput.name : null;
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
    const antigo = document.getElementById("cc-overlay");
    if (antigo) antigo.remove();

    const overlay = document.createElement("div");
    overlay.id = "cc-overlay";
    overlay.classList.add(questao.resultado === "Erros" ? "errou" : "acertou");

    overlay.innerHTML = `<div class="cc-card"><img class="cc-icon" src="${LOGO_URL}" alt="CaveiraCards"><div class="cc-text"><span class="cc-title">Adicionar ao Anki</span><span class="cc-sub">${questao.resultado} · ${questao.materia}</span></div><button class="cc-close" title="Fechar">✕</button></div>`;

    document.body.appendChild(overlay);
    overlayEl = overlay;

    overlay.querySelector(".cc-card").addEventListener("click", e => {
      if (e.target.classList.contains("cc-close") || e.target.classList.contains("cc-btn-comentarios")) return;
      if (overlay.classList.contains("sucesso")) return;
      enviarParaAnki(questao);
    });

    overlay.querySelector(".cc-close").addEventListener("click", e => {
      e.stopPropagation();
      overlay.remove();
      overlayEl = null;
      processadas.add(questao.idQuestao || questao.enunciado.substring(0, 100));
    });
  }

  function formatarComentarios(comentarios) {
    const items = comentarios.map(c =>
      `<div class="cc-comentario"><span class="cc-score">▲ ${c.score}</span><div>${window.CaveiraCardBuilder.sanitizar(c.html)}</div></div>`
    ).join("");
    return `<hr style="border:1px solid #e5e7eb;margin:12px 0"><div class="cc-comentarios"><strong>💬 Top comentários</strong>${items}</div>`;
  }

  function injetarBotaoComentarios(overlay, questao, noteIdPredefinido = null, questaoEl = null) {
    if (typeof adapter.capturarComentarios !== "function") return;
    if (overlay.querySelector(".cc-btn-comentarios")) return;

    const btnComent = document.createElement("button");
    btnComent.className = "cc-btn-comentarios";
    btnComent.title = "Capturar comentários";
    btnComent.textContent = "📎";
    overlay.querySelector(".cc-card").appendChild(btnComent);

    btnComent.addEventListener("click", async e => {
      e.stopPropagation();
      btnComent.disabled = true;
      btnComent.textContent = "...";

      const comentarios = await adapter.capturarComentarios(questaoEl);

      if (!comentarios) {
        btnComent.disabled = false;
        btnComent.textContent = "⚠️";
        setTimeout(() => { if (btnComent.isConnected) btnComent.textContent = "📎"; }, 2000);
        return;
      }

      try {
        let noteId = noteIdPredefinido;
        if (!noteId) {
          const query = `deck:"CaveiraCards" "Frente:${questao.enunciado.substring(0, 30)}*"`;
          const notes = await window.CaveiraAnki.buscarNotas(query);
          if (notes && notes.length > 0) noteId = notes[0];
        }

        if (!noteId) throw new Error("Nota não encontrada");

        const extraOriginal = [questao.banca, questao.explicacao].filter(Boolean).join("<br><br>");
        const comentariosHtml = formatarComentarios(comentarios);
        const extraFinal = extraOriginal ? extraOriginal + comentariosHtml : comentariosHtml.replace(/^<hr[^>]*>/, "");
        
        await window.CaveiraAnki.atualizarExtra(noteId, extraFinal);
        btnComent.textContent = "✓";
        setTimeout(() => { if (btnComent.isConnected) btnComent.remove(); }, 1500);
      } catch (err) {
        btnComent.disabled = false;
        btnComent.textContent = "❌";
        setTimeout(() => { if (btnComent.isConnected) btnComent.textContent = "📎"; }, 2000);
      }
    });
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
      
      noteIdAtual = noteId;
      overlay.classList.remove("loading", "errou", "acertou");
      overlay.classList.add("sucesso");
      titleEl.textContent = "Adicionado! ✓";

    } catch (err) {
      overlay.classList.remove("loading");
      
      if (err.message.includes("duplicate")) {
        overlay.classList.remove("errou", "acertou");
        overlay.classList.add("sucesso");
        titleEl.textContent = "Já está no Anki ✓";
        subEl.textContent = "Questão duplicada";
      } else {
        overlay.classList.add("falha");
        if (err.message.includes("Failed to fetch")) {
          titleEl.textContent = "Anki Fechado";
          subEl.textContent = "Abra o Anki e tente novamente";
        } else {
          titleEl.textContent = "Erro ao enviar";
          subEl.textContent = err.message.substring(0, 40);
        }

        setTimeout(() => {
          if (!overlay.isConnected) return;
          overlay.classList.remove("falha");
          titleEl.textContent = "Adicionar ao Anki";
          subEl.textContent = `${questao.resultado} · ${questao.materia}`;
        }, 4000);
      }
    }
  }
})();
