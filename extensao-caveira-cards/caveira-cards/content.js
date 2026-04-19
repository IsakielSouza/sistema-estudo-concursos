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
  let alunosCommentCaptureEnabled = true;      // default: ativo (alunos)
  let professorCommentCaptureEnabled = true;   // default: ativo (professor)

  chrome.storage.local.get(
    ["caveiraCardsEnabled", "alunosCommentCaptureEnabled", "manualCommentCaptureEnabled", "professorCommentCaptureEnabled"],
    ({ caveiraCardsEnabled, alunosCommentCaptureEnabled: alunosEnabled, manualCommentCaptureEnabled: legacyManual, professorCommentCaptureEnabled: profEnabled }) => {
      extensaoAtiva = caveiraCardsEnabled !== false;
      professorCommentCaptureEnabled = profEnabled !== false;
      if (legacyManual !== undefined) {
        chrome.storage.local.set({ alunosCommentCaptureEnabled: legacyManual });
        chrome.storage.local.remove("manualCommentCaptureEnabled");
        alunosCommentCaptureEnabled = legacyManual !== false;
      } else {
        alunosCommentCaptureEnabled = alunosEnabled !== false; // undefined → true
      }
    }
  );

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
    if ("alunosCommentCaptureEnabled" in changes) {
      alunosCommentCaptureEnabled = changes.alunosCommentCaptureEnabled.newValue !== false;
    }
    if ("professorCommentCaptureEnabled" in changes) {
      professorCommentCaptureEnabled = changes.professorCommentCaptureEnabled.newValue !== false;
    }
  });

  // ── Monitorar cliques para Captura Manual (Like) ──
  // Semântica do toggle `alunosCommentCaptureEnabled`:
  //   • Professor é SEMPRE enviado automaticamente (obrigatório).
  //   • ALUNOS são enviados automaticamente quando o toggle está ATIVO (default: ativo).
  //   • O clique no 👍 permite ao usuário adicionar 1 comentário avulso
  //     de aluno ao card existente (respeita o mesmo toggle).
  document.addEventListener("click", async (e) => {
    if (!extensaoAtiva || !alunosCommentCaptureEnabled) return;
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

      // Marca o <li> como salvo (sem re-clicar no 👍 — o usuário já clicou)
      if (typeof adapter.marcarComentarioComoSalvo === "function") {
        try { await adapter.marcarComentarioComoSalvo(comentario, { click: false }); }
        catch (e) { console.warn("[CaveiraCards] marcarComentarioComoSalvo (manual):", e); }
      }

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
      // TEC: a captura de comentários (professor + alunos) é feita
      // automaticamente em `enviarParaAnki` via `autoCapturarComentarios`,
      // respeitando o toggle `alunosCommentCaptureEnabled` (alunos).
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

    // Registra questão respondida e atualiza atividade
    if (contextoValido()) {
      try {
        chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
          if (sessaoAtiva && sessaoAtiva.ativa) {
            const agora = Date.now();
            const ultimaAtividade = sessaoAtiva.ultimaAtividade || sessaoAtiva.inicio;

            sessaoAtiva.questoes = (sessaoAtiva.questoes || 0) + 1;
            if (questao.resultado !== "Erros") {
              sessaoAtiva.acertos = (sessaoAtiva.acertos || 0) + 1;
            }
            if (!sessaoAtiva.detalhes) sessaoAtiva.detalhes = [];
            sessaoAtiva.detalhes.push({
              materia: questao.materia,
              resultado: questao.resultado,
              tempoGastoMs: agora - ultimaAtividade,
              timestamp: agora
            });
            sessaoAtiva.ultimaAtividade = agora;
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

    const htmlAlunos = alunos.map(c => {
      const dataPart = c.dataPublicacao ? ' · ' + window.CaveiraCardBuilder.sanitizar(c.dataPublicacao) : '';
      return `<div class="cc-comentario"><span class="cc-score">▲ ${c.score}${dataPart}</span><div>${window.CaveiraCardBuilder.sanitizar(c.html)}</div></div>`;
    }).join("");

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

  /* ══════════════════════════════════════════════════════════════
     API GLOBAL DE COMENTÁRIOS — reaproveitável por qualquer adapter
     ──────────────────────────────────────────────────────────────
     Toggles (controlados pelo popup, persistidos em chrome.storage.local):
       • professorCommentCaptureEnabled  → default TRUE
         ON  = captura comentário do professor automaticamente
         OFF = pula o professor
       • alunosCommentCaptureEnabled     → default TRUE
         ON  = captura top N comentários dos alunos automaticamente
         OFF = pula os alunos (usuário ainda pode clicar 👍 p/ salvar avulso)

     Hooks opcionais que o adapter pode expor:
       adapter.abrirPaineisComentarios(tipo)    → "comentario" | "discussao"
       adapter.capturarComentarioProfessor()    → { html, type:"professor" } | null
       adapter.capturarComentariosAlunos(max)   → [{ html, score, type:"aluno" }]

     Fallback para adapters antigos:
       adapter.capturarComentarios(el)          → array concatenado (prof+alunos)
  ══════════════════════════════════════════════════════════════ */

  function coletarComentarioDoProfessor() {
    return professorCommentCaptureEnabled === true;
  }

  function coletarComentariosDeAlunos() {
    return alunosCommentCaptureEnabled;
  }

  /* Marca comentários de ALUNOS como salvos no site de origem
     (clicando no "Gostei" via adapter) para:
       1. Deixar claro visualmente o que foi enviado ao Anki
       2. Permitir nova captura de N comentários ADICIONAIS sem duplicar,
          já que a próxima coleta pula li[data-caveira-liked=true]. */
  async function marcarComentariosSalvos(adapter, comentarios) {
    if (!Array.isArray(comentarios) || !comentarios.length) return;
    if (typeof adapter.marcarComentarioComoSalvo !== "function") return;
    const alvos = comentarios.filter(c => c && c.type !== "professor");
    for (const item of alvos) {
      try { await adapter.marcarComentarioComoSalvo(item); }
      catch (e) { console.warn("[CaveiraCards] marcarComentarioComoSalvo:", e); }
    }
  }

  async function capturarComentariosDoAdapter(adapter, questaoEl = null) {
    const capturados = [];

    // 1. PROFESSOR (apenas se toggle ativo)
    if (coletarComentarioDoProfessor()) {
      if (typeof adapter.abrirPaineisComentarios === "function") {
        try {
          const ok = await adapter.abrirPaineisComentarios("comentario");
          console.log("[CaveiraCards] abrirPaineis(comentario) →", ok);
          // pequeno delay de cortesia, o adapter já aguarda o conteúdo internamente
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.warn("[CaveiraCards] abrirPaineisComentarios(comentario):", e);
        }
      }
      if (typeof adapter.capturarComentarioProfessor === "function") {
        try {
          const prof = await adapter.capturarComentarioProfessor();
          console.log("[CaveiraCards] capturarComentarioProfessor →", prof ? "OK" : "nulo");
          if (prof) capturados.push(prof);
        } catch (e) {
          console.warn("[CaveiraCards] capturarComentarioProfessor:", e);
        }
      }
    } else {
      console.log("[CaveiraCards] professor DESATIVADO no toggle — pulando");
    }

    // 2. ALUNOS (apenas se toggle ativo)
    if (coletarComentariosDeAlunos()) {
      if (typeof adapter.abrirPaineisComentarios === "function") {
        try {
          const ok = await adapter.abrirPaineisComentarios("discussao");
          console.log("[CaveiraCards] abrirPaineis(discussao) →", ok);
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.warn("[CaveiraCards] abrirPaineisComentarios(discussao):", e);
        }
      }
      if (typeof adapter.capturarComentariosAlunos === "function") {
        try {
          const alunos = await adapter.capturarComentariosAlunos(5);
          console.log("[CaveiraCards] capturarComentariosAlunos →", alunos.length);
          if (alunos && alunos.length) capturados.push(...alunos);
        } catch (e) {
          console.warn("[CaveiraCards] capturarComentariosAlunos:", e);
        }
      }
    }

    // 3. Fallback para adapters antigos (sem hooks separados)
    const semHooksNovos =
      typeof adapter.capturarComentarioProfessor !== "function" &&
      typeof adapter.capturarComentariosAlunos !== "function";

    if (capturados.length === 0 && semHooksNovos &&
        typeof adapter.capturarComentarios === "function") {
      try {
        const todos = await adapter.capturarComentarios(questaoEl);
        if (Array.isArray(todos)) {
          const filtrados = todos.filter(c => {
            if (c.type === "professor") return coletarComentarioDoProfessor();
            return coletarComentariosDeAlunos();
          });
          capturados.push(...filtrados);
        }
      } catch (e) {
        console.warn("[CaveiraCards] capturarComentarios (compat):", e);
      }
    }

    return capturados;
  }

  // ── Auto-captura de comentários após envio ao Anki (qualquer adapter) ──
  async function autoCapturarComentarios(adapter, questao, noteId, questaoEl = null) {
    if (!noteId) return;
    const overlay = overlayEl;
    if (!overlay) return;

    const subEl = overlay.querySelector(".cc-sub");
    const titleEl = overlay.querySelector(".cc-title");

    const temHooksNovos =
      typeof adapter.capturarComentarioProfessor === "function" ||
      typeof adapter.capturarComentariosAlunos === "function";
    const temCapturaCompat = typeof adapter.capturarComentarios === "function";
    if (!temHooksNovos && !temCapturaCompat) return;

    // Se o usuário desativou AMBOS os toggles, não tem nada pra capturar
    if (!coletarComentarioDoProfessor() && !coletarComentariosDeAlunos()) {
      console.log("[CaveiraCards] nenhum toggle de comentário ativo — pulando captura");
      return;
    }

    try {
      if (subEl) subEl.textContent = "Capturando comentários...";

      const comentarios = await capturarComentariosDoAdapter(adapter, questaoEl);

      if (!comentarios || !comentarios.length) {
        if (subEl) subEl.textContent = `${questao.resultado} · ${questao.materia}`;
        return;
      }

      const html = formatarComentarios(comentarios).replace(/^<hr[^>]*>/, "");
      await window.CaveiraAnki.atualizarExtra(noteId, html);

      // Marca cada comentário de aluno com "Gostei" na plataforma de origem
      // → sinaliza visualmente o que foi salvo e evita duplicar no próximo ciclo
      await marcarComentariosSalvos(adapter, comentarios);

      comentariosAutoCapturados = true;

      const temProf = comentarios.some(c => c.type === "professor");
      const nAlunos = comentarios.filter(c => c.type !== "professor").length;
      let desc = "";
      if (temProf && nAlunos > 0) desc = `💬 Professor + ${nAlunos} aluno${nAlunos > 1 ? "s" : ""}`;
      else if (temProf)           desc = "💬 Comentário do professor";
      else if (nAlunos > 0)       desc = `💬 ${nAlunos} comentário${nAlunos > 1 ? "s" : ""} de alunos`;

      if (titleEl) titleEl.textContent = "Adicionado! ✓";
      if (subEl)   subEl.textContent   = desc || `${questao.resultado} · ${questao.materia}`;
    } catch (err) {
      console.warn("[CaveiraCards] autoCapturarComentarios falhou:", err);
      if (subEl) subEl.textContent = `${questao.resultado} · ${questao.materia}`;
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

      // Build caderno tag if active session has a caderno name
      const extraTags = [];
      try {
        const { sessaoAtiva } = await chrome.storage.local.get("sessaoAtiva");
        if (sessaoAtiva?.ativa && sessaoAtiva?.caderno) {
          const slug = sessaoAtiva.caderno
            .toLowerCase()
            .replace(/[|.\s/\\]+/g, "-")
            .replace(/-{2,}/g, "-")
            .replace(/^-|-$/g, "");
          const res = questao.resultado === "Erros" ? "erros" : "revisao";
          extraTags.push(`caderno::${slug}::${res}`);
        }
      } catch (e) { console.warn("[CaveiraCards] caderno tag skipped:", e); }

      const noteId = await window.CaveiraAnki.enviarQuestao(questao, frente, verso, extraTags);

      noteIdAtual = noteId;
      overlay.classList.remove("loading", "errou", "acertou");
      overlay.classList.add("sucesso");
      titleEl.textContent = "Adicionado! ✓";

      // ── Auto-captura de comentários (TEC) ──
      if (adapter.nomePlataforma === "TEC Concursos") {
        autoCapturarComentarios(adapter, questao, noteId);
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
