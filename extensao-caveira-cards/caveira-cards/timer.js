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
const pomodoroTab = document.getElementById('timer-tab-pomodoro');
const livreTab = document.getElementById('timer-tab-livre');
const displayText = document.getElementById('timer-display');
const statusText = document.getElementById('timer-status-text');
const playBtn = document.getElementById('timer-play-btn');
const fullscreenBtn = document.getElementById('timer-fullscreen-btn');
const floatingBtn = document.getElementById('timer-floating-btn');
const progressCircle = document.getElementById('timer-progress-circle');
const indicators = document.getElementById('timer-indicators');

const sessionIdle = document.getElementById('session-idle');
const sessionActive = document.getElementById('session-active');
const sessionSummary = document.getElementById('session-summary');
const inputCaderno = document.getElementById('input-caderno');
const sessionTimerEl = document.getElementById('session-timer');
const questoesEl = document.getElementById('session-questoes');
const acertosEl = document.getElementById('session-acertos');
const summaryValEl = document.getElementById('summary-val');

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
  const m = Math.floor(secs / 60);
  const s = secs % 60;
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
function setActiveTab(mode) {
  pomodoroTab.classList.toggle('active', mode === 'pomodoro');
  livreTab.classList.toggle('active', mode === 'livre');
}

function updateDisplay() {
  const secs = computeCurrentSeconds(timerState);
  displayText.textContent = formatMMSS(secs);
  const circumference = 2 * Math.PI * 62;
  let progress = 0;
  if (timerState.mode !== 'livre' && timerState.totalSeconds > 0) {
    progress = (timerState.totalSeconds - secs) / timerState.totalSeconds;
  }
  progressCircle.style.strokeDasharray = `${circumference * progress} ${circumference}`;
  if (sessionTimerEl) sessionTimerEl.textContent = formatMMSS(secs);

  if (timerState.mode !== 'livre' && timerState.isRunning && secs === 0) {
    pauseTimer();
  }
}

function updateIndicators() {
  const inds = indicators.querySelectorAll('.timer-indicator');
  inds.forEach((ind, idx) => {
    ind.classList.toggle('active', idx === timerState.currentSession - 1);
  });
}

function updateConfigDisplay() {
  document.getElementById('timer-config-focus').textContent = timerState.config.focus;
  document.getElementById('timer-config-shortbreak').textContent = timerState.config.shortBreak;
  document.getElementById('timer-config-longbreak').textContent = timerState.config.longBreak;
  document.getElementById('timer-config-sessions').textContent = timerState.config.sessions;
}

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
pomodoroTab.addEventListener('click', () => switchMode('pomodoro'));
livreTab.addEventListener('click', () => switchMode('livre'));

function switchMode(mode) {
  if (timerState.mode === mode) return;
  if (sessaoEstaAtiva()) {
    mostrarAviso('⚠ Sessão em andamento — encerre para trocar');
    return;
  }
  timerState.mode = mode;
  if (mode === 'livre') {
    timerState.elapsedSeconds = 0;
  } else {
    timerState.totalSeconds = timerState.config.focus * 60;
    timerState.remainingSeconds = timerState.totalSeconds;
  }
  setActiveTab(mode);
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
    if (field === 'focus' && timerState.mode === 'pomodoro') {
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
  chrome.windows.create({
    url: chrome.runtime.getURL('timer-floating.html'),
    type: 'popup',
    width: 320,
    height: 380
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
  }
  timerState.isRunning = true;
  timerState.startedAt = inicio;

  chrome.storage.local.set({ sessaoAtiva: sessao, timerState });
}

document.getElementById('btn-encerrar').addEventListener('click', () => {
  if (timerState.isRunning) {
    const secs = computeCurrentSeconds(timerState);
    if (timerState.mode === 'livre') timerState.elapsedSeconds = secs;
    else timerState.remainingSeconds = secs;
  }
  timerState.isRunning = false;
  timerState.startedAt = null;
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }

  chrome.storage.local.get(['sessaoAtiva', 'historicoSessoes'], ({ sessaoAtiva, historicoSessoes = [] }) => {
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
    });
  });
});

document.getElementById('btn-copiar').addEventListener('click', () => {
  const btn = document.getElementById('btn-copiar');
  navigator.clipboard.writeText(summaryValEl.textContent).then(() => {
    btn.textContent = '✓ Copiado!';
    setTimeout(() => { btn.textContent = '📋 Copiar resumo'; }, 1800);
  });
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
  setActiveTab(timerState.mode);
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
