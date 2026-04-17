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
  let mostrandoOverlay = false; // Evita overlay simultâneo durante await do dialog
  let comentariosAutoCapturados = false; // Evita botão manual após auto-captura TEC

  // ── Toggle liga/desliga ──
  let extensaoAtiva = true;
  let manualCommentCaptureEnabled = false;

  chrome.storage.local.get(["caveiraCardsEnabled", "manualCommentCaptureEnabled"], ({ caveiraCardsEnabled, manualCommentCaptureEnabled: manualEnabled }) => {
    extensaoAtiva = caveiraCardsEnabled !== false;
    manualCommentCaptureEnabled = manualEnabled === true;
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
    if ("manualCommentCaptureEnabled" in changes) {
      manualCommentCaptureEnabled = changes.manualCommentCaptureEnabled.newValue === true;
    }
  });

  // ── Monitorar cliques para Captura Manual (Like) ──
  document.addEventListener("click", async (e) => {
    if (!extensaoAtiva || !manualCommentCaptureEnabled) return;
    if (typeof adapter.capturarUnicoComentario !== "function") return;

    // Identificar se o alvo é um botão de "Gostei" / "Like"
    let btnLike = null;
    
    if (adapter.nomePlataforma === "TEC Concursos") {
      btnLike = e.target.closest("button.discussao-comentario-nota-seta.nota-positiva");
    } else if (adapter.nomePlataforma === "QConcursos") {
      btnLike = e.target.closest(".js-question-comment-like, .js-like-comment, .q-icon.material-icons:contains('thumb_up')");
      // QConcursos usa muitos elementos diferentes, busca simplificada:
      if (!btnLike && (e.target.innerText === "thumb_up" || e.target.classList.contains("q-icon"))) {
         btnLike = e.target.closest("button, a");
      }
    } else if (adapter.nomePlataforma === "ProjetoCaveira") {
      btnLike = e.target.closest("button[title*='Gostei'], .q-btn");
      // Verifica se o botão clicado parece ser um like (ícone thumb_up)
      if (btnLike && !btnLike.querySelector(".i-thumb-up, .thumb_up, [class*='thumb']")) {
        // Se não tem ícone de like, talvez não seja o botão certo
        if (!e.target.innerHTML.includes("thumb_up")) btnLike = null;
      }
    }

    if (!btnLike) return;

    // Captura o comentário
    const comentario = adapter.capturarUnicoComentario(btnLike);
    if (!comentario) return;

    console.log("[CaveiraCards] Captura manual detectada:", comentario);

    // Feedback visual temporário no botão
    const originalText = btnLike.innerText;
    
    try {
      // Tenta encontrar a nota do Anki para a questão atual
      let noteId = noteIdAtual;
      if (!noteId && questaoAtual) {
        const query = `deck:"CaveiraCards" "Frente:${questaoAtual.enunciado.substring(0, 30)}*"`;
        const notes = await window.CaveiraAnki.buscarNotas(query);
        if (notes && notes.length > 0) noteId = notes[0];
      }

      if (!noteId) {
        console.warn("[CaveiraCards] Nota não encontrada para captura manual.");
        return;
      }

      const html = formatarComentarios([comentario]);
      // Remove o <hr> inicial se for apenas um comentário manual sendo adicionado sozinho
      const cleanHtml = html.replace(/^<hr[^>]*>/, "");
      
      const status = await window.CaveiraAnki.atualizarExtra(noteId, cleanHtml);
      
      // Feedback de sucesso ou duplicidade
      const badge = document.createElement("span");
      badge.innerText = status === "exists" ? "Já enviado" : "✓ Anki";
      badge.style = `position:absolute; background:${status === "exists" ? "#1e2d4d" : "#22c55e"}; color:white; font-size:10px; padding:2px 4px; border-radius:4px; z-index:9999; pointer-events:none;`;
      btnLike.style.position = "relative";
      btnLike.appendChild(badge);
      setTimeout(() => badge.remove(), 2500);

    } catch (err) {
      console.error("[CaveiraCards] Erro na captura manual:", err);
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


  // ── Guarda de contexto: para tudo se a extensão for recarregada ──
  function contextoValido() {
    try { return !!chrome.runtime?.id; } catch { return false; }
  }

  function pararExtensao() {
    observer.disconnect();
    clearInterval(intervalId);
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
  }

  // ── Observador de mudanças no DOM ──
  const observer = new MutationObserver(() => {
    if (!contextoValido()) { pararExtensao(); return; }
    verificar();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const intervalId = setInterval(() => {
    if (!contextoValido()) { pararExtensao(); return; }
    verificar();
  }, 1000);

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
        comentariosAutoCapturados = false; // Reset ao mudar de questão
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
      if (!overlayEl && !mostrandoOverlay && questao) {
        mostrarOverlay(questao);
      }

      // ── Lógica Dinâmica do Botão de Comentários (TEC) ──
      // O botão manual só aparece se a auto-captura não capturou (fallback)
      if (overlayEl && overlayEl.classList.contains("sucesso") && !comentariosAutoCapturados) {
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
        if (mostrandoOverlay) return; // aguarda dialog de sessão fechar (retenta no próximo ciclo)
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
        if (mostrandoOverlay) return; // aguarda dialog de sessão fechar
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
        if (mostrandoOverlay) return; // aguarda dialog de sessão fechar
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
        if (mostrandoOverlay) return; // aguarda dialog de sessão fechar

        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;
        processadas.add(chave);
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
        if (mostrandoOverlay) return; // aguarda dialog de sessão fechar

        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;

        processadas.add(chave);
        mostrarOverlay(questao);
      });
    }
  }

  // ── Sessão: verificação de inatividade (> 1h sem responder questão) ──

  function mostrarDialogSessaoInativa(sessao) {
    return new Promise((resolve) => {
      const antigo = document.getElementById("cc-sessao-dialog");
      if (antigo) antigo.remove();

      const duracao = Date.now() - sessao.inicio;
      const totalMin = Math.floor(duracao / 60000);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const duracaoStr = h > 0
        ? `${h}h${String(m).padStart(2, "0")}min`
        : `${m}min`;
      const q = sessao.questoes || 0;
      const a = sessao.acertos  || 0;
      const plural = q !== 1 ? "questões" : "questão";

      const dialog = document.createElement("div");
      dialog.id = "cc-sessao-dialog";
      dialog.innerHTML = `
        <div class="cc-sessao-card">
          <div class="cc-sessao-header">
            <img class="cc-sessao-icon" src="${LOGO_URL}" alt="CaveiraCards">
            <div class="cc-sessao-info">
              <span class="cc-sessao-title">⏸ Sessão pausada</span>
              <span class="cc-sessao-sub">${q} ${plural} · ✅ ${a} acertos · ${duracaoStr}</span>
            </div>
          </div>
          <div class="cc-sessao-pergunta">Você ficou mais de 1h sem atividade. O que fazer?</div>
          <div class="cc-sessao-acoes">
            <button class="cc-sessao-btn cc-sessao-nova" id="cc-btn-sessao-nova">🆕 Nova sessão</button>
            <button class="cc-sessao-btn cc-sessao-continuar" id="cc-btn-sessao-continuar">▶ Continuar</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      document.getElementById("cc-btn-sessao-nova").addEventListener("click", () => {
        dialog.remove();
        resolve("nova");
      });
      document.getElementById("cc-btn-sessao-continuar").addEventListener("click", () => {
        dialog.remove();
        resolve("continuar");
      });
    });
  }

  async function verificarInatividade() {
    if (!contextoValido()) return;
    return new Promise((resolve) => {
      try { chrome.storage.local.get("sessaoAtiva", async ({ sessaoAtiva }) => {
        if (!sessaoAtiva || !sessaoAtiva.ativa) { resolve(); return; }

        const ultima = sessaoAtiva.ultimaAtividade || sessaoAtiva.inicio;
        const inativo = Date.now() - ultima;

        if (inativo < 3_600_000) { resolve(); return; } // menos de 1h → ok

        // Mais de 1h inativo — perguntar ao usuário
        const escolha = await mostrarDialogSessaoInativa(sessaoAtiva);

        if (escolha === "nova") {
          const nova = { inicio: Date.now(), questoes: 0, acertos: 0, ativa: true, ultimaAtividade: Date.now() };
          chrome.storage.local.set({ sessaoAtiva: nova }, resolve);
        } else {
          // Continuar: só atualiza o timestamp de atividade
          sessaoAtiva.ultimaAtividade = Date.now();
          chrome.storage.local.set({ sessaoAtiva }, resolve);
        }
      }); } catch { resolve(); }
    });
  }

  // ── Overlay ──

  async function mostrarOverlay(questao) {
    if (mostrandoOverlay) return;
    mostrandoOverlay = true;

    // Verifica inatividade antes de mostrar — exibe dialog se > 1h parado
    await verificarInatividade();

    const antigo = document.getElementById("cc-overlay");
    if (antigo) antigo.remove();

    const overlay = document.createElement("div");
    overlay.id = "cc-overlay";
    overlay.classList.add(questao.resultado === "Erros" ? "errou" : "acertou");

    const doacaoUrl = chrome.runtime.getURL("doacao.html");

    overlay.innerHTML = `
      <div class="cc-card">
        <img class="cc-icon" src="${LOGO_URL}" alt="CaveiraCards">
        <div class="cc-text">
          <span class="cc-title">Adicionar ao Anki</span>
          <span class="cc-sub">${questao.resultado} · ${questao.materia}</span>
        </div>
        <a href="${doacaoUrl}" target="_blank" class="cc-btn-apoio" title="Apoie o projeto ❤️">☕</a>
        <button class="cc-close" title="Fechar">✕</button>
      </div>
    `;

    document.body.appendChild(overlay);
    overlayEl = overlay;
    mostrandoOverlay = false; // overlay criado — libera para próxima questão

    // Registra que houve atividade agora
    if (contextoValido()) {
      try {
        chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
          if (sessaoAtiva && sessaoAtiva.ativa) {
            sessaoAtiva.ultimaAtividade = Date.now();
            chrome.storage.local.set({ sessaoAtiva });
          }
        });
      } catch { /* contexto inválido — ignora */ }
    }

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
    if (!comentarios || !comentarios.length) return "";

    const professor = comentarios.filter(c => c.type === "professor");
    const alunos = comentarios.filter(c => c.type !== "professor");

    const htmlProf = professor.map(c => 
      `<div class="cc-comentario-prof"><div>${window.CaveiraCardBuilder.sanitizar(c.html)}</div></div>`
    ).join("");

    const htmlAlunos = alunos.map(c =>
      `<div class="cc-comentario"><span class="cc-score">▲ ${c.score}</span><div>${window.CaveiraCardBuilder.sanitizar(c.html)}</div></div>`
    ).join("");

    const hasProf = !!htmlProf;
    const hasAlunos = !!htmlAlunos;

    if (!hasProf && !hasAlunos) return "";

    return `
      <div class="cc-tabs">
        <div class="cc-tabs-header">
          ${hasProf ? `<button class="cc-tab-btn active" onclick="ccOpenTab(event, 'tab-prof')">Professor</button>` : ""}
          ${hasAlunos ? `<button class="cc-tab-btn ${!hasProf ? "active" : ""}" onclick="ccOpenTab(event, 'tab-alunos')">Alunos</button>` : ""}
        </div>
        ${hasProf ? `<div id="tab-prof" class="cc-tab-content active">${htmlProf}</div>` : ""}
        ${hasAlunos ? `<div id="tab-alunos" class="cc-tab-content ${!hasProf ? "active" : ""}">${htmlAlunos}</div>` : ""}
      </div>
    `.trim();
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

        const comentariosHtml = formatarComentarios(comentarios).replace(/^<hr[^>]*>/, "");
        
        const status = await window.CaveiraAnki.atualizarExtra(noteId, comentariosHtml);
        
        if (status === "exists") {
          btnComent.textContent = "✓"; // Já estava lá
        } else {
          btnComent.textContent = "✓";
        }
        
        setTimeout(() => { if (btnComent.isConnected) btnComent.remove(); }, 1500);
      } catch (err) {
        btnComent.disabled = false;
        btnComent.textContent = "❌";
        setTimeout(() => { if (btnComent.isConnected) btnComent.textContent = "📎"; }, 2000);
      }
    });
  }

  // ── Simulação de tecla (TEC usa atalhos de teclado) ──
  function simularTecla(key, keyCode) {
    ["keydown", "keypress", "keyup"].forEach(tipo => {
      document.dispatchEvent(new KeyboardEvent(tipo, {
        key, keyCode, which: keyCode, bubbles: true, cancelable: true
      }));
    });
  }

  // ── Auto-abertura do painel de comentários (TEC) ──
  async function abrirPainelComentariosTEC(tipo = "discussao") {
    // Verifica se o painel solicitado já está aberto
    const painelAberto = document.querySelector(`.questao-complementos-${tipo}`);
    if (painelAberto) return true;

    // Seletor do botão: comentario ou discussao
    const selector = `button[ng-click="vm.abrirComplemento('${tipo}')"]`;
    const botao = document.querySelector(selector);

    if (botao) {
      botao.click();
    } else {
      // Atalhos nativos: O para comentário, F para discussão
      const char = tipo === "comentario" ? "o" : "f";
      const code = tipo === "comentario" ? 79 : 70;
      simularTecla(char, code);
    }

    // Aguarda até 3s para o painel aparecer
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (document.querySelector(`.questao-complementos-${tipo}`)) return true;
      if (tipo === "discussao") {
        const ul = document.querySelector("ul.discussao-comentarios, .discussao ul");
        if (ul && ul.offsetParent !== null) return true;
      }
    }
    return false;
  }

  // ── Auto-captura de comentários após envio ao Anki (TEC) ──
  async function autoCapturarComentariosTEC(questao, noteId) {
    if (typeof adapter.capturarComentarios !== "function") return;
    const overlay = overlayEl;
    if (!overlay) return;

    const subEl   = overlay.querySelector(".cc-sub");
    const titleEl = overlay.querySelector(".cc-title");

    try {
      subEl.textContent = "Abrindo comentários...";
      
      // 1. Tenta abrir e capturar comentário do Professor
      await abrirPainelComentariosTEC("comentario");
      await new Promise(r => setTimeout(r, 800)); // Espera render

      // 2. Tenta abrir e capturar Fórum (Alunos)
      await abrirPainelComentariosTEC("discussao");
      await new Promise(r => setTimeout(r, 800));

      subEl.textContent = "Capturando comentários...";

      const comentarios = await adapter.capturarComentarios();

      if (!comentarios || !comentarios.length) {
        subEl.textContent = `${questao.resultado} · ${questao.materia}`;
        return;
      }

      const comentariosHtml = formatarComentarios(comentarios).replace(/^<hr[^>]*>/, "");
      await window.CaveiraAnki.atualizarExtra(noteId, comentariosHtml);

      comentariosAutoCapturados = true;
      titleEl.textContent = "Adicionado! ✓";
      subEl.textContent = "💬 Próxima questão...";

      // Aguarda um instante para o usuário ver o feedback e avança com N
      await new Promise(r => setTimeout(r, 900));
      if (overlay.isConnected) {
        overlay.remove();
        overlayEl = null;
      }
      simularTecla("n", 78); // Tecla N = próxima questão no TEC

    } catch (err) {
      console.warn("[CaveiraCards] Auto-comentários falhou:", err);
      subEl.textContent = `${questao.resultado} · ${questao.materia}`;
    }
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

      // ── Auto-captura de comentários (TEC) ──
      // Roda em segundo plano: abre o painel e captura os top comentários automaticamente.
      if (adapter.nomePlataforma === "TEC Concursos") {
        autoCapturarComentariosTEC(questao, noteId);
      }

      // ── Incrementar contadores da sessão ativa ──
      if (contextoValido()) {
        try {
          chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
            if (sessaoAtiva && sessaoAtiva.ativa) {
              const agora = Date.now();
              const ultimaAtividade = sessaoAtiva.ultimaAtividade || sessaoAtiva.inicio;
              
              // Dados da questão atual
              const detalheQuestao = {
                materia: questao.materia,
                resultado: questao.resultado,
                tempoGastoMs: agora - ultimaAtividade,
                timestamp: agora
              };

              sessaoAtiva.questoes = (sessaoAtiva.questoes || 0) + 1;
              if (questao.resultado !== "Erros") {
                sessaoAtiva.acertos = (sessaoAtiva.acertos || 0) + 1;
              }
              
              if (!sessaoAtiva.detalhes) sessaoAtiva.detalhes = [];
              sessaoAtiva.detalhes.push(detalheQuestao);
              
              sessaoAtiva.ultimaAtividade = agora;
              chrome.storage.local.set({ sessaoAtiva });
            }
          });
        } catch { /* contexto inválido — ignora */ }
      }

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
