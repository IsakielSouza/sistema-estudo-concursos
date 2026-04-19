// Estado unificado (espelhado de timer.html)
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

// Elements
const displayText = document.getElementById('fullscreen-display');
const statusMain = document.getElementById('fullscreen-status-main');
const statusSub = document.getElementById('fullscreen-status-sub');
const playBtn = document.getElementById('fullscreen-play-btn');
const backBtn = document.getElementById('fullscreen-back-btn');
const finishBtn = document.getElementById('fullscreen-finish-btn');
const closeBtn = document.getElementById('fullscreen-close-btn');
const progressCircle = document.getElementById('fullscreen-progress-circle');
const indicators = document.getElementById('fullscreen-indicators');

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
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function sessaoEstaAtiva() {
  return !!(sessaoAtivaLocal && sessaoAtivaLocal.ativa);
}

function updateDisplay() {
  const secs = computeCurrentSeconds(timerState);
  displayText.textContent = formatMMSS(secs);

  const circumference = 2 * Math.PI * 128;
  let progress = 0;
  if (timerState.mode !== 'livre' && timerState.totalSeconds > 0) {
    progress = (timerState.totalSeconds - secs) / timerState.totalSeconds;
  }
  progressCircle.style.strokeDasharray = `${circumference * progress} ${circumference}`;

  statusSub.textContent = timerState.mode === 'pomodoro' ? 'Foco' : 'Livre';
  statusMain.textContent = sessaoEstaAtiva()
    ? (timerState.isRunning ? 'Executando' : 'Pausado')
    : 'Sem sessão ativa';

  if (timerState.mode !== 'livre' && timerState.isRunning && secs === 0) {
    pauseTimer();
  }
}

function updateIndicators() {
  const inds = indicators.querySelectorAll('.fullscreen-indicator');
  inds.forEach((ind, idx) => {
    ind.classList.toggle('active', idx === timerState.currentSession - 1);
  });
}

function setPlayUI() {
  playBtn.innerHTML = timerState.isRunning ? '⏸' : '▶';
}

function startTimer() {
  timerState.isRunning = true;
  timerState.startedAt = Date.now();
  setPlayUI();
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(updateDisplay, 1000);
  chrome.storage.local.set({ timerState });
}

function pauseTimer() {
  if (timerState.isRunning) {
    const secs = computeCurrentSeconds(timerState);
    if (timerState.mode === 'livre') timerState.elapsedSeconds = secs;
    else timerState.remainingSeconds = secs;
  }
  timerState.isRunning = false;
  timerState.startedAt = null;
  setPlayUI();
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  chrome.storage.local.set({ timerState });
}

// Play/Pause — só funciona com sessão ativa
playBtn.addEventListener('click', () => {
  if (!sessaoEstaAtiva()) {
    window.location.href = 'timer.html';
    return;
  }
  if (timerState.isRunning) pauseTimer();
  else startTimer();
});

// Voltar para timer normal
backBtn.addEventListener('click', () => {
  window.location.href = 'timer.html';
});

// Finalizar sessão → volta para timer.html (onde o resumo é mostrado)
finishBtn.addEventListener('click', () => {
  window.location.href = 'timer.html';
});

closeBtn.addEventListener('click', () => {
  window.location.href = 'timer.html';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.location.href = 'timer.html';
});

function sincronizarUI() {
  setPlayUI();
  updateDisplay();
  updateIndicators();
  if (timerState.isRunning) {
    if (!tickInterval) tickInterval = setInterval(updateDisplay, 1000);
  } else {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  }
}

// Carrega estado ao abrir
chrome.storage.local.get(['timerState', 'sessaoAtiva'], ({ timerState: stored, sessaoAtiva }) => {
  if (stored) timerState = { ...timerState, ...stored };
  sessaoAtivaLocal = sessaoAtiva || null;
  sincronizarUI();
});

// Sincroniza com outras páginas
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.timerState && changes.timerState.newValue) {
    timerState = { ...timerState, ...changes.timerState.newValue };
    sincronizarUI();
  }
  if ('sessaoAtiva' in changes) {
    sessaoAtivaLocal = changes.sessaoAtiva.newValue || null;
    updateDisplay();
  }
});
