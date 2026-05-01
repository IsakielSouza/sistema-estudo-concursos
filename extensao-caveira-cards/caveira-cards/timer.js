// Versão (lida do manifest.json)
try {
  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    const { version } = chrome.runtime.getManifest();
    versionEl.textContent = `v${version}`;
  }
} catch (e) { /* silencioso */ }

// ═══════════════════════════════════════════════════
// Estado unificado: sessão de estudo = timer
// (Pomodoro countdown OU Livre contando para cima)
// startedAt = timestamp quando a contagem atual começou;
// baseline = remainingSeconds (pomodoro) / elapsedSeconds (livre)
// valor atual = baseline ± (Date.now() - startedAt)/1000
// ═══════════════════════════════════════════════════
let timerState = {
  mode: 'pomodoro',
  isRunning: false,
  isBreak: false,
  startedAt: null,
  remainingSeconds: 1500,
  totalSeconds: 1500,
  elapsedSeconds: 0,
  currentSession: 1,
  config: { focus: 25, shortBreak: 5, longBreak: 15, sessions: 4 }
};

let sessaoAtivaLocal = null;
let tickInterval = null;
let avisoTimeout = null;

// ─── Elements ───
const configBtn = document.getElementById('timer-config-btn');
const configContainer = document.getElementById('timer-config');
const resetBtn = document.getElementById('timer-reset-btn');
const modeToggle = document.getElementById('mode-toggle');
const modeToggleLabel = document.getElementById('mode-toggle-label');
const displayText = document.getElementById('timer-display');
const statusText = document.getElementById('timer-status-text');
const playBtn = document.getElementById('timer-play-btn');
const fullscreenBtn = document.getElementById('timer-fullscreen-btn');
const floatingBtn = document.getElementById('timer-floating-btn');
const progressCircle = document.getElementById('timer-progress-circle');
const indicators = document.getElementById('timer-indicators');

const configInputs = {
  focus: document.getElementById('timer-config-focus'),
  shortBreak: document.getElementById('timer-config-shortbreak'),
  longBreak: document.getElementById('timer-config-longbreak'),
  sessions: document.getElementById('timer-config-sessions')
};

const sessionIdle = document.getElementById('session-idle');
const sessionActive = document.getElementById('session-active');
const sessionSummary = document.getElementById('session-summary');
const inputCaderno = document.getElementById('input-caderno');
const sessionTimerEl = document.getElementById('session-timer');
const questoesEl = document.getElementById('session-questoes');
const acertosEl = document.getElementById('session-acertos');
const summaryValEl = document.getElementById('summary-val');

// ─── Finish Pomodoro UI ───
const finishActions = document.getElementById('pomodoro-finish-actions');
const btnContinuarLivre = document.getElementById('btn-continuar-estudo');
const btnIniciarPausa = document.getElementById('btn-iniciar-pausa');
const btnProximoCiclo = document.getElementById('btn-proximo-ciclo');
const btnEncerrarTimer = document.getElementById('btn-encerrar-timer');

// ─── Notificações e som ───
function playBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) { /* silencioso */ }
}

function showTimerFinishNotification() {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('CaveiraCards.png'),
      title: '⏱️ Timer finalizado',
      message: timerState.mode === 'pomodoro' ? 'Tempo de foco encerrado!' : 'Cronômetro parado',
      priority: 2
    });
  } catch (e) { /* silencioso */ }
}

// ─── Helpers ───
function computeCurrentSeconds(state) {
  const base = state.mode === 'livre'
    ? (state.elapsedSeconds || 0)
    : (state.remainingSeconds ?? state.totalSeconds);
  if (!state.isRunning || !state.startedAt) return base;
  const delta = Math.floor((Date.now() - state.startedAt) / 1000);
  if (state.mode === 'livre') return base + delta;
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
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatarResumo(ms, questoes, acertos) {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  let tempoStr = '';
  if (h > 0 && m > 0)      tempoStr = `${h}h${String(m).padStart(2, '0')}min`;
  else if (h > 0)           tempoStr = `${h}h`;
  else if (totalMin === 0)  tempoStr = '< 1min';
  else                      tempoStr = `${m}min`;
  const plural = questoes !== 1 ? 'questões' : 'questão';
  return `⏱ ${tempoStr}  |  📚 ${questoes} ${plural}  |  ✅ ${acertos} acertos`;
}

function agruparPorMateria(detalhes) {
  const grupos = {};
  detalhes.forEach(d => {
    if (!grupos[d.materia]) grupos[d.materia] = { questoes: 0, acertos: 0 };
    grupos[d.materia].questoes++;
    if (d.resultado !== 'Erros') grupos[d.materia].acertos++;
  });
  return grupos;
}

function sessaoEstaAtiva() {
  return !!(sessaoAtivaLocal && sessaoAtivaLocal.ativa);
}

// ─── UI Updaters ───
function atualizarModeToggle(mode) {
  if (!modeToggle) return;
  const isPomodoro = mode === 'pomodoro';
  modeToggle.checked = isPomodoro;
  modeToggleLabel.textContent = isPomodoro ? 'Modo: Pomodoro' : 'Modo: Livre';
  modeToggleLabel.style.color = isPomodoro ? '#22c55e' : '#3b6ff5';
  
  // Mostrar/ocultar config e indicadores baseado no modo
  if (configBtn) configBtn.style.display = isPomodoro ? 'flex' : 'none';
  if (indicators) indicators.style.display = isPomodoro ? 'flex' : 'none';
}

function updateDisplay() {
  const secs = computeCurrentSeconds(timerState);
  displayText.textContent = formatMMSS(secs);
  const circumference = 2 * Math.PI * 75;
  let progress = 0;
  if (timerState.mode !== 'livre' && timerState.totalSeconds > 0) {
    progress = (timerState.totalSeconds - secs) / timerState.totalSeconds;
  }
  progressCircle.style.strokeDasharray = `${circumference * progress} ${circumference}`;
  if (sessionTimerEl) sessionTimerEl.textContent = formatMMSS(secs);

  if (timerState.mode !== 'livre' && timerState.isRunning && secs === 0) {
    playBeep();
    showTimerFinishNotification();
    pauseTimer();

    // Se acabou o FOCO, mostra as opções de PAUSA ou CONTINUAR
    if (!timerState.isBreak) {
      // Registrar sessão concluída automaticamente ao fim do foco
      finalizarSessao(() => {
        const isLongBreak = (timerState.currentSession % timerState.config.sessions === 0);
        const breakMinutes = isLongBreak ? timerState.config.longBreak : timerState.config.shortBreak;
        
        // Prepara visualmente o tempo da pausa
        timerState.isBreak = true;
        timerState.remainingSeconds = breakMinutes * 60;
        timerState.totalSeconds = breakMinutes * 60;
        
        if (finishActions) {
          finishActions.style.display = 'flex';
          if (btnIniciarPausa) {
            btnIniciarPausa.textContent = isLongBreak ? '☕ Pausa Longa' : '☕ Iniciar Pausa';
            btnIniciarPausa.style.display = 'block';
          }
          if (btnProximoCiclo) btnProximoCiclo.style.display = 'none';
          if (btnContinuarLivre) btnContinuarLivre.style.display = 'block';
        }
        updateIndicators();
        updateDisplay();
        saveState();
      });
    } else {
      // Se acabou a PAUSA, volta pro foco ou próximo ciclo
      timerState.isBreak = false;
      timerState.remainingSeconds = timerState.config.focus * 60;
      timerState.totalSeconds = timerState.config.focus * 60;
      
      if (timerState.currentSession < timerState.config.sessions) {
        if (finishActions) {
          finishActions.style.display = 'flex';
          if (btnProximoCiclo) btnProximoCiclo.style.display = 'block';
          if (btnIniciarPausa) btnIniciarPausa.style.display = 'none';
          if (btnContinuarLivre) btnContinuarLivre.style.display = 'block';
        }
      } else {
        mostrarAviso('🎉 Bloco de Pomodoro concluído!');
        timerState.currentSession = 1; 
      }
    }
    updateIndicators();
    updateDisplay(); // Atualiza o display com o novo tempo preparado
    saveState();
  }
}

// ─── Listeners para Ações de Fim de Pomodoro ───
if (btnContinuarLivre) {
  btnContinuarLivre.addEventListener('click', () => {
    if (finishActions) finishActions.style.display = 'none';
    switchMode('livre');
    startTimer();
  });
}

if (btnIniciarPausa) {
  btnIniciarPausa.addEventListener('click', () => {
    if (finishActions) finishActions.style.display = 'none';
    const isLongBreak = (timerState.currentSession % timerState.config.sessions === 0);
    const breakMinutes = isLongBreak ? timerState.config.longBreak : timerState.config.shortBreak;
    
    timerState.mode = 'pomodoro';
    timerState.isBreak = true;
    timerState.totalSeconds = breakMinutes * 60;
    timerState.remainingSeconds = timerState.totalSeconds;
    
    atualizarModeToggle('pomodoro');
    updateIndicators();
    updateDisplay();
    startTimer();
    saveState();
  });
}

if (btnProximoCiclo) {
  btnProximoCiclo.addEventListener('click', () => {
    if (finishActions) finishActions.style.display = 'none';
    if (btnIniciarPausa) btnIniciarPausa.style.display = 'block'; // Garante que volta o botão de pausa

    timerState.currentSession++;
    timerState.isBreak = false;
    timerState.totalSeconds = timerState.config.focus * 60;
    timerState.remainingSeconds = timerState.totalSeconds;
    updateIndicators();
    updateDisplay();
    iniciarSessao(); // Inicia nova sessão para o novo ciclo de foco
    saveState();
  });
}

if (btnEncerrarTimer) {
  btnEncerrarTimer.addEventListener('click', () => {
    if (finishActions) finishActions.style.display = 'none';
    finalizarSessao();
  });
}

function updateIndicators() {
  const inds = indicators.querySelectorAll('.timer-indicator');
  inds.forEach((ind, idx) => {
    ind.classList.remove('active', 'completed', 'break');
    if (idx < timerState.currentSession - 1) {
      ind.classList.add('completed');
    } else if (idx === timerState.currentSession - 1) {
      if (timerState.isBreak) ind.classList.add('break');
      else ind.classList.add('active');
    }
  });
}

function updateConfigDisplay() {
  configInputs.focus.value = timerState.config.focus;
  configInputs.shortBreak.value = timerState.config.shortBreak;
  configInputs.longBreak.value = timerState.config.longBreak;
  configInputs.sessions.value = timerState.config.sessions;
}

// ─── Listeners para Edição Direta ───
Object.entries(configInputs).forEach(([field, input]) => {
  if (!input) return;
  input.addEventListener('change', () => {
    let val = parseInt(input.value);
    if (isNaN(val) || val < 1) val = 1;
    if (field === 'sessions' && val > 99) val = 99;
    else if (val > 999) val = 999;
    
    timerState.config[field] = val;
    input.value = val;

    if (field === 'focus' && timerState.mode === 'pomodoro' && !timerState.isRunning && !sessaoEstaAtiva()) {
      timerState.totalSeconds = timerState.config.focus * 60;
      timerState.remainingSeconds = timerState.totalSeconds;
      updateDisplay();
    }
    saveState();
  });
});

function mostrarEstadoSessao(estado) {
  sessionIdle.style.display    = estado === 'idle'    ? 'flex'  : 'none';
  sessionActive.style.display  = estado === 'active'  ? 'block' : 'none';
  sessionSummary.style.display = estado === 'summary' ? 'block' : 'none';
}

function mostrarAviso(msg) {
  statusText.textContent = msg;
  statusText.style.color = '#ef4444';
  if (avisoTimeout) clearTimeout(avisoTimeout);
  avisoTimeout = setTimeout(() => {
    statusText.style.color = '';
    statusText.textContent = timerState.isRunning ? 'Executando' : 'Pausado';
  }, 2500);
}

function setPlayUIRunning() {
  playBtn.innerHTML = '⏸';
  playBtn.style.backgroundColor = '#ef4444';
  statusText.style.color = '';
  statusText.textContent = 'Executando';
}

function setPlayUIPaused() {
  playBtn.innerHTML = '▶';
  playBtn.style.backgroundColor = '#22c55e';
  statusText.style.color = '';
  statusText.textContent = 'Pausado';
}

// ─── Timer controls ───
function startTimer() {
  if (finishActions) finishActions.style.display = 'none';
  timerState.isRunning = true;
  timerState.startedAt = Date.now();
  setPlayUIRunning();
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(updateDisplay, 1000);
  saveState();
}

function pauseTimer() {
  if (timerState.isRunning) {
    const secs = computeCurrentSeconds(timerState);
    if (timerState.mode === 'livre') timerState.elapsedSeconds = secs;
    else timerState.remainingSeconds = secs;
  }
  timerState.isRunning = false;
  timerState.startedAt = null;
  setPlayUIPaused();
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  saveState();
}

function saveState() {
  chrome.storage.local.set({ timerState });
}

// ─── Tab/Mode ───
modeToggle.addEventListener('change', () => {
  const isPomodoro = modeToggle.checked;
  const mode = isPomodoro ? 'pomodoro' : 'livre';
  switchMode(mode);
});

function switchMode(mode) {
  if (timerState.mode === mode) return;
  const currentSecs = computeCurrentSeconds(timerState);
  // Permite trocar se o timer estiver em 0 (mesmo com sessão ativa) ou se não houver sessão ativa
  if (sessaoEstaAtiva() && currentSecs > 0 && !timerState.isRunning) {
    mostrarAviso('⚠ Termine o tempo atual ou encerre a sessão para trocar');
    atualizarModeToggle(timerState.mode);
    return;
  }
  if (timerState.isRunning) {
    mostrarAviso('⚠ Pause o timer para trocar de modo');
    atualizarModeToggle(timerState.mode);
    return;
  }
  timerState.mode = mode;
  if (finishActions) finishActions.style.display = 'none';
  if (mode === 'livre') {
    timerState.elapsedSeconds = 0;
  } else {
    timerState.totalSeconds = timerState.config.focus * 60;
    timerState.remainingSeconds = timerState.totalSeconds;
  }
  atualizarModeToggle(mode);
  configContainer.classList.remove('show');
  resetBtn.style.display = 'none';
  updateDisplay();
  saveState();
}

// ─── Config ───
configBtn.addEventListener('click', () => {
  if (sessaoEstaAtiva()) {
    mostrarAviso('⚠ Sessão em andamento — encerre para configurar');
    return;
  }
  configContainer.classList.toggle('show');
  resetBtn.style.display = configContainer.classList.contains('show') ? 'block' : 'none';
});

document.querySelectorAll('.timer-config-input button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (sessaoEstaAtiva()) return;
    const action = e.target.dataset.action;
    const field = e.target.dataset.field;
    if (action === 'increase') timerState.config[field]++;
    else if (action === 'decrease' && timerState.config[field] > 1) timerState.config[field]--;
    
    // Sincroniza o input
    if (configInputs[field]) configInputs[field].value = timerState.config[field];

    if (field === 'focus' && timerState.mode === 'pomodoro' && !timerState.isRunning) {
      timerState.totalSeconds = timerState.config.focus * 60;
      timerState.remainingSeconds = timerState.totalSeconds;
      updateDisplay();
    }
    updateConfigDisplay();
    saveState();
  });
});

resetBtn.addEventListener('click', () => {
  timerState.currentSession = 1;
  updateIndicators();
  saveState();
});

// ─── Play button ───
playBtn.addEventListener('click', () => {
  if (!sessaoEstaAtiva()) {
    iniciarSessao();
    return;
  }
  if (timerState.isRunning) pauseTimer();
  else startTimer();
});

// ─── Fullscreen / Floating nav ───
fullscreenBtn.addEventListener('click', () => {
  window.location.href = 'timer-fullscreen.html';
});
floatingBtn.addEventListener('click', () => {
  chrome.storage.local.get("timerFloatingVisible", (data) => {
    chrome.storage.local.set({ timerFloatingVisible: !data.timerFloatingVisible });
  });
});

// ─── Session flow ───
async function autoDetectCaderno() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('tecconcursos.com.br')) {
      const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getCadernoName' });
      return resp?.caderno || '';
    }
  } catch { /* silencioso */ }
  return '';
}

async function preencherCadernoSeVazio() {
  if (!inputCaderno || inputCaderno.value.trim()) return;
  const detectado = await autoDetectCaderno();
  if (detectado && !inputCaderno.value.trim()) inputCaderno.value = detectado;
}

async function iniciarSessao() {
  let caderno = inputCaderno?.value.trim() || '';
  if (!caderno) caderno = await autoDetectCaderno();
  const inicio = Date.now();
  const sessao = { inicio, questoes: 0, acertos: 0, ativa: true, caderno: caderno || null, mode: timerState.mode };

  if (timerState.mode === 'livre') {
    timerState.elapsedSeconds = 0;
  } else {
    timerState.totalSeconds = timerState.config.focus * 60;
    timerState.remainingSeconds = timerState.totalSeconds;
    timerState.isBreak = false; // Garante que não está em pausa ao iniciar sessão
  }
  timerState.isRunning = true;
  timerState.startedAt = inicio;

  chrome.storage.local.set({ sessaoAtiva: sessao, timerState });
}

function finalizarSessao(callback) {
  if (timerState.isRunning) {
    const secs = computeCurrentSeconds(timerState);
    if (timerState.mode === 'livre') timerState.elapsedSeconds = secs;
    else timerState.remainingSeconds = secs;
  }
  timerState.isRunning = false;
  timerState.startedAt = null;
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }

  chrome.storage.local.get(['sessaoAtiva', 'historicoSessoes'], ({ sessaoAtiva, historicoSessoes = [] }) => {
    if (!sessaoAtiva || !sessaoAtiva.ativa) {
      if (typeof callback === 'function') callback();
      return;
    }
    const agora = Date.now();
    const duracaoMs = agora - (sessaoAtiva?.inicio || agora);
    const questoes = sessaoAtiva?.questoes || 0;
    const acertos = sessaoAtiva?.acertos || 0;
    const resumo = formatarResumo(duracaoMs, questoes, acertos);

    const detalhes = sessaoAtiva?.detalhes || [];
    const materiasSet = new Set(detalhes.map(d => d.materia));
    const listaMaterias = Array.from(materiasSet).join(', ');
    const tempoTotalMs = detalhes.reduce((acc, d) => acc + d.tempoGastoMs, 0);
    const mediaTempoMs = questoes > 0 ? Math.round(tempoTotalMs / questoes) : 0;

    const novaSessao = {
      id: Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
      inicio: sessaoAtiva.inicio,
      fim: agora,
      duracaoMs,
      duracaoStr: formatarTimer(duracaoMs),
      questoes,
      acertos,
      aproveitamento: questoes > 0 ? Math.round((acertos / questoes) * 100) + '%' : '0%',
      mediaTempoMs,
      mediaTempoStr: mediaTempoMs > 0 ? formatarTimer(mediaTempoMs) : '-',
      materias: listaMaterias,
      caderno: sessaoAtiva.caderno || null,
      detalhesPorMateria: agruparPorMateria(detalhes),
      detalhes
    };

    chrome.storage.local.set({
      sessaoAtiva: { ativa: false, resumo, inicio: sessaoAtiva.inicio, fim: agora, questoes, acertos, caderno: sessaoAtiva.caderno || null },
      historicoSessoes: [novaSessao, ...historicoSessoes],
      timerState
    }, () => {
      if (typeof callback === 'function') callback();
    });
  });
}

document.getElementById('btn-encerrar').addEventListener('click', () => {
  finalizarSessao();
});

document.getElementById('btn-nova-sessao').addEventListener('click', () => {
  if (timerState.mode === 'livre') timerState.elapsedSeconds = 0;
  else timerState.remainingSeconds = timerState.totalSeconds;
  chrome.storage.local.remove('sessaoAtiva');
  chrome.storage.local.set({ timerState });
});

function abrirHistorico() {
  chrome.tabs.create({ url: chrome.runtime.getURL('sessoes.html') });
}
document.getElementById('btn-historico-idle').addEventListener('click', abrirHistorico);
document.getElementById('btn-historico-active').addEventListener('click', abrirHistorico);
document.getElementById('btn-historico-summary').addEventListener('click', abrirHistorico);

// ─── Sync UI from state ───
function sincronizarSessaoUI(sessao) {
  sessaoAtivaLocal = sessao || null;
  if (sessao && sessao.ativa) {
    questoesEl.textContent = sessao.questoes || 0;
    acertosEl.textContent  = sessao.acertos  || 0;
    const cadernoEl = document.getElementById('session-caderno');
    if (cadernoEl) cadernoEl.textContent = sessao.caderno ? `📓 ${sessao.caderno}` : '';
    mostrarEstadoSessao('active');
  } else if (sessao && !sessao.ativa && sessao.resumo) {
    summaryValEl.textContent = sessao.resumo;
    const summaryC = document.getElementById('summary-caderno');
    if (summaryC) summaryC.textContent = sessao.caderno ? `📓 ${sessao.caderno}` : '';
    mostrarEstadoSessao('summary');
  } else {
    mostrarEstadoSessao('idle');
  }
}

function sincronizarTimerUI() {
  atualizarModeToggle(timerState.mode);
  if (timerState.isRunning) {
    if (!tickInterval) tickInterval = setInterval(updateDisplay, 1000);
    setPlayUIRunning();
  } else {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    setPlayUIPaused();
  }
  updateDisplay();
  updateIndicators();
  updateConfigDisplay();
}

// ─── Initial load ───
chrome.storage.local.get(['timerState', 'sessaoAtiva'], ({ timerState: stored, sessaoAtiva }) => {
  if (stored) timerState = { ...timerState, ...stored };
  sincronizarTimerUI();
  sincronizarSessaoUI(sessaoAtiva);
  if (!sessaoEstaAtiva()) preencherCadernoSeVazio();
});

// ─── Storage listeners ───
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.timerState) {
    const nova = changes.timerState.newValue;
    if (nova) {
      timerState = { ...timerState, ...nova };
      sincronizarTimerUI();
    }
  }
  if ('sessaoAtiva' in changes) {
    const nova = changes.sessaoAtiva.newValue;
    sincronizarSessaoUI(nova);
    if (!(nova && nova.ativa) && inputCaderno) inputCaderno.value = '';
  }
});
