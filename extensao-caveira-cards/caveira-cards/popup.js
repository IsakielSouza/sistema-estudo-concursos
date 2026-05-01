// popup.js — lógica do popup CaveiraCards

// ── Versão (lida do manifest.json) ──
try {
  const versionEl = document.getElementById("app-version");
  if (versionEl) {
    const { version } = chrome.runtime.getManifest();
    versionEl.textContent = `v${version}`;
  }
} catch (e) {
  /* silencioso — fallback mostra "v—" */
}


// ── Sessão de Estudo ──
const sessionIdle     = document.getElementById("session-idle");
const sessionActive   = document.getElementById("session-active");
const sessionSummary  = document.getElementById("session-summary");
const inputCaderno    = document.getElementById("input-caderno");
const timerEl        = document.getElementById("session-timer");
const questoesEl     = document.getElementById("session-questoes");
const acertosEl      = document.getElementById("session-acertos");
const summaryValEl   = document.getElementById("summary-val");

// ─── Elements Fim de Pomodoro ───
const finishActions = document.getElementById('pomodoro-finish-actions');
const btnPopupContinuar = document.getElementById('btn-popup-continuar');
const btnPopupPausa = document.getElementById('btn-popup-pausa');
const btnPopupProximo = document.getElementById('btn-popup-proximo');
const btnPopupEncerrarTimer = document.getElementById('btn-popup-encerrar-timer');
const btnEncerrarSessao = document.getElementById('btn-encerrar');

// Estado local compartilhado com timer.html (mesmo relogio em todos os lugares)
let timerState = {
  mode: "pomodoro",
  isRunning: false,
  isBreak: false,
  startedAt: null,
  remainingSeconds: 1500,
  totalSeconds: 1500,
  elapsedSeconds: 0,
  currentSession: 1,
  config: { focus: 25, shortBreak: 5, longBreak: 15, sessions: 4 }
};
let popupTickInterval = null;

function computeCurrentSeconds(state) {
  const base = state.mode === "livre"
    ? (state.elapsedSeconds || 0)
    : (state.remainingSeconds ?? state.totalSeconds);
  if (!state.isRunning || !state.startedAt) return base;
  const delta = Math.floor((Date.now() - state.startedAt) / 1000);
  if (state.mode === "livre") return base + delta;
  return Math.max(0, base - delta);
}

function formatMMSS(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatarTimer(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function formatarResumo(ms, questoes, acertos) {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  let tempoStr = "";
  if (h > 0 && m > 0)      tempoStr = `${h}h${String(m).padStart(2,"0")}min`;
  else if (h > 0)           tempoStr = `${h}h`;
  else if (totalMin === 0)  tempoStr = "< 1min";
  else                      tempoStr = `${m}min`;
  const plural = questoes !== 1 ? "questões" : "questão";
  return `⏱ ${tempoStr}  |  📚 ${questoes} ${plural}  |  ✅ ${acertos} acertos`;
}

function mostrarEstado(estado) {
  sessionIdle.style.display   = estado === "idle"   ? "flex"  : "none";
  sessionActive.style.display = estado === "active" ? "block" : "none";
  sessionSummary.style.display = estado === "summary" ? "block" : "none";
}

function atualizarDisplayTempo() {
  if (!timerEl) return;
  const secs = computeCurrentSeconds(timerState);
  timerEl.textContent = formatMMSS(secs);

  // Lógica de ações ao finalizar Pomodoro
  if (timerState.mode !== 'livre' && !timerState.isRunning && secs === 0 && (timerState.startedAt || timerState.remainingSeconds === 0)) {
    if (finishActions) {
      finishActions.style.display = 'flex';
      btnEncerrarSessao.style.display = 'none';

      if (!timerState.isBreak) {
        // Acabou o FOCO
        const isLongBreak = (timerState.currentSession % (timerState.config?.sessions ?? 4) === 0);
        if (btnPopupPausa) {
          btnPopupPausa.textContent = isLongBreak ? "☕ L.Pausa" : "☕ Pausa";
          btnPopupPausa.style.display = 'block';
        }
        if (btnPopupProximo) btnPopupProximo.style.display = 'none';
      } else {
        // Acabou a PAUSA
        if (btnPopupPausa) btnPopupPausa.style.display = 'none';
        if (timerState.currentSession < (timerState.config?.sessions ?? 4)) {
          if (btnPopupProximo) btnPopupProximo.style.display = 'block';
        }
      }
    }
  } else {
    if (finishActions) {
      finishActions.style.display = 'none';
      btnEncerrarSessao.style.display = 'block';
    }
  }
}

// ─── Listeners para Ações de Fim de Pomodoro (Popup) ───
if (btnPopupContinuar) {
  btnPopupContinuar.addEventListener('click', () => {
    chrome.storage.local.get(["timerState", "sessaoAtiva"], ({ timerState: current, sessaoAtiva }) => {
      const state = current || timerState;
      const newState = { ...state, mode: 'livre', isBreak: false, isRunning: true, startedAt: Date.now(), elapsedSeconds: 0 };
      
      const novaSessao = { 
        inicio: Date.now(), 
        questoes: 0, 
        acertos: 0, 
        ativa: true, 
        caderno: sessaoAtiva?.caderno || null,
        mode: 'livre',
        ultimaAtividade: Date.now(),
        detalhes: []
      };
      chrome.storage.local.set({ timerState: newState, sessaoAtiva: novaSessao });
    });
  });
}

if (btnPopupPausa) {
  btnPopupPausa.addEventListener('click', () => {
    chrome.storage.local.get(["timerState"], ({ timerState: current }) => {
      const state = current || timerState;
      const isLongBreak = (state.currentSession % (state.config?.sessions ?? 4) === 0);
      const breakMinutes = isLongBreak ? (state.config?.longBreak ?? 15) : (state.config?.shortBreak ?? 5);
      const newState = { ...state, mode: 'pomodoro', isBreak: true, isRunning: true, startedAt: Date.now(), remainingSeconds: breakMinutes * 60, totalSeconds: breakMinutes * 60 };
      chrome.storage.local.set({ timerState: newState });
    });
  });
}

if (btnPopupProximo) {
  btnPopupProximo.addEventListener('click', () => {
    chrome.storage.local.get(["timerState", "sessaoAtiva"], ({ timerState: current, sessaoAtiva }) => {
      const state = current || timerState;
      const focusSecs = (state.config?.focus ?? 25) * 60;
      const newState = { ...state, currentSession: state.currentSession + 1, isBreak: false, isRunning: true, startedAt: Date.now(), remainingSeconds: focusSecs, totalSeconds: focusSecs };
      
      const novaSessao = { 
        inicio: Date.now(), 
        questoes: 0, 
        acertos: 0, 
        ativa: true, 
        caderno: sessaoAtiva?.caderno || null,
        mode: 'pomodoro',
        ultimaAtividade: Date.now(),
        detalhes: []
      };
      chrome.storage.local.set({ timerState: newState, sessaoAtiva: novaSessao });
    });
  });
}

if (btnPopupEncerrarTimer) {
  btnPopupEncerrarTimer.addEventListener('click', () => {
    btnEncerrarSessao.click();
  });
}

function iniciarTickPopup() {
  if (popupTickInterval) clearInterval(popupTickInterval);
  atualizarDisplayTempo();
  popupTickInterval = setInterval(atualizarDisplayTempo, 1000);
}

function pararTickPopup() {
  if (popupTickInterval) clearInterval(popupTickInterval);
  popupTickInterval = null;
}

// Ler estado ao abrir popup
chrome.storage.local.get(["sessaoAtiva", "timerState"], ({ sessaoAtiva, timerState: storedTimer }) => {
  if (storedTimer) timerState = { ...timerState, ...storedTimer };
  if (sessaoAtiva && sessaoAtiva.ativa) {
    mostrarEstado("active");
    questoesEl.textContent = sessaoAtiva.questoes || 0;
    acertosEl.textContent  = sessaoAtiva.acertos  || 0;
    const cadernoEl = document.getElementById("session-caderno");
    if (cadernoEl) cadernoEl.textContent = sessaoAtiva.caderno ? `📓 ${sessaoAtiva.caderno}` : "";
    atualizarDisplayTempo();
    if (timerState.isRunning) iniciarTickPopup();
  } else if (sessaoAtiva && !sessaoAtiva.ativa && sessaoAtiva.resumo) {
    summaryValEl.textContent = sessaoAtiva.resumo;
    const summaryC = document.getElementById("summary-caderno");
    if (summaryC) summaryC.textContent = sessaoAtiva.caderno ? `📓 ${sessaoAtiva.caderno}` : "";
    mostrarEstado("summary");
  } else {
    mostrarEstado("idle");
    preencherCadernoSeVazio();
  }
});

// Auto-detect caderno ao carregar popup (se idle)
async function preencherCadernoSeVazio() {
  if (!inputCaderno || inputCaderno.value.trim()) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes("tecconcursos.com.br")) {
      const resp = await chrome.tabs.sendMessage(tab.id, { action: "getCadernoName" });
      const detectado = resp?.caderno || "";
      if (detectado && !inputCaderno.value.trim()) inputCaderno.value = detectado;
    }
  } catch { /* silencioso */ }
}

// Iniciar sessão — direto, usa o que estiver no input
async function iniciarSessao() {
  chrome.storage.local.get(["timerState", "sessaoAtiva"], async ({ timerState: storedTimer, sessaoAtiva }) => {
    let state = storedTimer || timerState;
    let caderno = inputCaderno?.value.trim() || "";
    
    if (!caderno) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes("tecconcursos.com.br")) {
          const resp = await chrome.tabs.sendMessage(tab.id, { action: "getCadernoName" });
          caderno = resp?.caderno || "";
        }
      } catch { /* silencioso */ }
    }
    
    const inicio = Date.now();
    const sessao = { 
      inicio, 
      questoes: 0, 
      acertos: 0, 
      ativa: true, 
      caderno: caderno || null, 
      mode: state.mode, 
      ultimaAtividade: inicio, 
      detalhes: [] 
    };

    if (state.mode === "livre") {
      state.elapsedSeconds = 0;
    } else {
      state.totalSeconds = (state.config?.focus ?? 25) * 60;
      state.remainingSeconds = state.totalSeconds;
      state.isBreak = false;
    }
    state.isRunning = true;
    state.startedAt = inicio;

    chrome.storage.local.set({ sessaoAtiva: sessao, timerState: state });
  });
}

document.getElementById("btn-iniciar").addEventListener("click", iniciarSessao);

// Encerrar sessão
document.getElementById("btn-encerrar").addEventListener("click", () => {
  pararTickPopup();
  if (finishActions) finishActions.style.display = 'none';
  btnEncerrarSessao.style.display = 'block';
  if (timerState.isRunning) {
    const secs = computeCurrentSeconds(timerState);
    if (timerState.mode === "livre") timerState.elapsedSeconds = secs;
    else timerState.remainingSeconds = secs;
  }
  timerState.isRunning = false;
  timerState.startedAt = null;

  chrome.storage.local.get(["sessaoAtiva", "historicoSessoes"], ({ sessaoAtiva, historicoSessoes = [] }) => {
    const agora = Date.now();
    const duracaoMs = agora - (sessaoAtiva?.inicio || agora);
    const questoes = sessaoAtiva?.questoes || 0;
    const acertos  = sessaoAtiva?.acertos  || 0;
    const resumo = formatarResumo(duracaoMs, questoes, acertos);

    const detalhes = sessaoAtiva?.detalhes || [];
    const materiasSet = new Set(detalhes.map(d => d.materia));
    const listaMaterias = Array.from(materiasSet).join(", ");

    const tempoTotalMs = detalhes.reduce((acc, d) => acc + d.tempoGastoMs, 0);
    const mediaTempoMs = questoes > 0 ? Math.round(tempoTotalMs / questoes) : 0;

    const novaSessao = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-BR"),
      inicio: sessaoAtiva.inicio,
      fim: agora,
      duracaoMs,
      duracaoStr: formatarTimer(duracaoMs),
      questoes,
      acertos,
      aproveitamento: questoes > 0 ? Math.round((acertos / questoes) * 100) + "%" : "0%",
      mediaTempoMs,
      mediaTempoStr: mediaTempoMs > 0 ? formatarTimer(mediaTempoMs) : "-",
      materias: listaMaterias,
      caderno: sessaoAtiva.caderno || null,
      detalhesPorMateria: agruparPorMateria(detalhes),
      detalhes
    };

    chrome.storage.local.set({
      sessaoAtiva: { ativa: false, resumo, inicio: sessaoAtiva.inicio, fim: agora, questoes, acertos, caderno: sessaoAtiva.caderno || null },
      historicoSessoes: [novaSessao, ...historicoSessoes],
      timerState
    });

    summaryValEl.textContent = resumo;
    const summaryC = document.getElementById("summary-caderno");
    if (summaryC) summaryC.textContent = sessaoAtiva.caderno ? `📓 ${sessaoAtiva.caderno}` : "";
    mostrarEstado("summary");
  });
});

// Nova sessão
document.getElementById("btn-nova-sessao").addEventListener("click", () => {
  if (timerState.mode === "livre") timerState.elapsedSeconds = 0;
  else timerState.remainingSeconds = timerState.totalSeconds;
  chrome.storage.local.remove("sessaoAtiva");
  chrome.storage.local.set({ timerState });
  mostrarEstado("idle");
});

// Sincronização em tempo real com timer.html/fullscreen/floating
chrome.storage.onChanged.addListener((changes) => {
  if ("timerState" in changes) {
    const nova = changes.timerState.newValue;
    if (nova) {
      timerState = { ...timerState, ...nova };
      atualizarDisplayTempo();
      if (timerState.isRunning) iniciarTickPopup();
      else pararTickPopup();
      atualizarModeToggle(timerState.mode);
    }
  }
  if ("sessaoAtiva" in changes) {
    const nova = changes.sessaoAtiva.newValue;
    if (nova && nova.ativa) {
      questoesEl.textContent = nova.questoes || 0;
      acertosEl.textContent  = nova.acertos  || 0;
      const cadernoEl = document.getElementById("session-caderno");
      if (cadernoEl) cadernoEl.textContent = nova.caderno ? `📓 ${nova.caderno}` : "";
      mostrarEstado("active");
      atualizarDisplayTempo();
    } else if (nova && !nova.ativa && nova.resumo) {
      pararTickPopup();
      summaryValEl.textContent = nova.resumo;
      const summaryC = document.getElementById("summary-caderno");
      if (summaryC) summaryC.textContent = nova.caderno ? `📓 ${nova.caderno}` : "";
      mostrarEstado("summary");
    } else if (!nova) {
      pararTickPopup();
      if (inputCaderno) inputCaderno.value = "";
      mostrarEstado("idle");
    }
  }
});

// ── Toggle liga/desliga ──
const toggle = document.getElementById("toggle-enabled");
const toggleLabel = document.getElementById("toggle-label");
const toggleManual = document.getElementById("toggle-manual");
const toggleManualLabel = document.getElementById("toggle-manual-label");
const toggleProfessor = document.getElementById("toggle-professor");
const toggleProfessorLabel = document.getElementById("toggle-professor-label");
const modeToggle = document.getElementById("mode-toggle");
const modeToggleLabel = document.getElementById("mode-toggle-label");

function atualizarToggle(ativo) {
  toggle.checked = ativo;
  toggleLabel.textContent = ativo ? "Extensão ativa" : "Extensão pausada";
  toggleLabel.style.color = ativo ? "#4ade80" : "#f87171";
}

function atualizarToggleManual(ativo) {
  toggleManual.checked = ativo;
  toggleManualLabel.style.color = ativo ? "#93c5fd" : "#64748b";
}

function atualizarToggleProfessor(ativo) {
  toggleProfessor.checked = ativo;
  toggleProfessorLabel.style.color = ativo ? "#93c5fd" : "#64748b";
}

function atualizarModeToggle(mode) {
  if (!modeToggle) return;
  const isPomodoro = mode === "pomodoro";
  modeToggle.checked = isPomodoro;
  modeToggleLabel.textContent = isPomodoro ? "Modo: Pomodoro" : "Modo: Livre";
  modeToggleLabel.style.color = isPomodoro ? "#22c55e" : "#3b6ff5";
}

chrome.storage.local.get(
  ["caveiraCardsEnabled", "alunosCommentCaptureEnabled", "manualCommentCaptureEnabled", "professorCommentCaptureEnabled", "timerState"],
  ({ caveiraCardsEnabled, alunosCommentCaptureEnabled: alunosEnabled, manualCommentCaptureEnabled: legacyManual, professorCommentCaptureEnabled, timerState: storedTimer }) => {
    atualizarToggle(caveiraCardsEnabled !== false);
    atualizarToggleProfessor(professorCommentCaptureEnabled !== false);
    if (storedTimer) {
      atualizarModeToggle(storedTimer.mode);
    }
    if (legacyManual !== undefined) {
      chrome.storage.local.set({ alunosCommentCaptureEnabled: legacyManual });
      chrome.storage.local.remove("manualCommentCaptureEnabled");
      atualizarToggleManual(legacyManual !== false);
    } else {
      atualizarToggleManual(alunosEnabled !== false); // default: ativo
    }
  }
);

toggle.addEventListener("change", () => {
  const ativo = toggle.checked;
  chrome.storage.local.set({ caveiraCardsEnabled: ativo });
  atualizarToggle(ativo);
});

toggleManual.addEventListener("change", () => {
  const ativo = toggleManual.checked;
  chrome.storage.local.set({ alunosCommentCaptureEnabled: ativo });
  atualizarToggleManual(ativo);
});

toggleProfessor.addEventListener("change", () => {
  const ativo = toggleProfessor.checked;
  chrome.storage.local.set({ professorCommentCaptureEnabled: ativo });
  atualizarToggleProfessor(ativo);
});

modeToggle.addEventListener("change", () => {
  const isPomodoro = modeToggle.checked;
  const mode = isPomodoro ? "pomodoro" : "livre";

  chrome.storage.local.get(["sessaoAtiva", "timerState"], ({ sessaoAtiva, timerState: current }) => {
    const state = current || timerState;
    const currentSecs = computeCurrentSeconds(state);
    
    // Bloqueia se estiver rodando ou se tiver tempo sobrando em uma sessão ativa
    if (state.isRunning) {
      atualizarModeToggle(state.mode);
      return;
    }
    if (sessaoAtiva?.ativa && currentSecs > 0) {
      atualizarModeToggle(state.mode);
      return;
    }

    const newState = { ...state, mode };
    
    // Se não estiver rodando, reseta os segundos baseado no modo
    if (!newState.isRunning) {
      if (mode === "livre") {
        newState.elapsedSeconds = 0;
      } else {
        newState.totalSeconds = (newState.config?.focus ?? 25) * 60;
        newState.remainingSeconds = newState.totalSeconds;
      }
    }
    
    chrome.storage.local.set({ timerState: newState });
    atualizarModeToggle(mode);
  });
});

// ── Toggle Anki ──
const ankiToggle = document.getElementById("anki-toggle");
const ankiLabel  = document.getElementById("anki-toggle-label");

async function verificarAnki() {
  try {
    const resp = await fetch("http://localhost:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "modelNames", version: 6, params: {} }),
    });
    const data = await resp.json();
    return !!data.result;
  } catch (e) {
    return false;
  }
}

function atualizarAnkiStatus(ativo) {
  ankiToggle.checked = ativo;
  ankiLabel.style.color = ativo ? "#4ade80" : "#f87171";
  ankiLabel.textContent = ativo ? "Anki: Ativo" : "Anki: Desconectado";
}

chrome.storage.local.get("ankiSetupDone_v6", async ({ ankiSetupDone_v6 }) => {
  const isOnline = await verificarAnki();
  atualizarAnkiStatus(isOnline);
  if (isOnline && !ankiSetupDone_v6) {
    chrome.storage.local.set({ ankiSetupDone_v6: true });
  }
});

ankiToggle.addEventListener("change", async () => {
  if (ankiToggle.checked) {
    ankiLabel.textContent = "Conectando...";
    const isOnline = await verificarAnki();
    if (isOnline) {
      atualizarAnkiStatus(true);
      chrome.storage.local.set({ ankiSetupDone_v6: true });
    } else {
      setTimeout(() => {
        atualizarAnkiStatus(false);
      }, 500);
    }
  } else {
    atualizarAnkiStatus(false);
  }
});

// ── Eventos de Navegação ──
function abrirPagina(path) {
  chrome.tabs.create({ url: chrome.runtime.getURL(path) });
}

document.getElementById("btn-doacao").addEventListener("click", () => abrirPagina("doacao.html"));
document.getElementById("btn-plataformas").addEventListener("click", () => abrirPagina("plataformas.html"));

const btnHistIdle = document.getElementById("btn-historico-idle");
if (btnHistIdle) btnHistIdle.addEventListener("click", () => abrirPagina("sessoes.html"));

const btnHistActive = document.getElementById("btn-historico-active");
if (btnHistActive) btnHistActive.addEventListener("click", () => abrirPagina("sessoes.html"));

const btnHistSummary = document.getElementById("btn-historico-summary");
if (btnHistSummary) btnHistSummary.addEventListener("click", () => abrirPagina("sessoes.html"));

function agruparPorMateria(detalhes) {
  const grupos = {};
  detalhes.forEach(d => {
    if (!grupos[d.materia]) {
      grupos[d.materia] = { questoes: 0, acertos: 0 };
    }
    grupos[d.materia].questoes++;
    if (d.resultado !== "Erros") grupos[d.materia].acertos++;
  });
  return grupos;
}

// ── Timer ──
const btnTimer = document.getElementById('btn-timer');
if (btnTimer) {
  btnTimer.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('timer.html')
    });
  });
}
