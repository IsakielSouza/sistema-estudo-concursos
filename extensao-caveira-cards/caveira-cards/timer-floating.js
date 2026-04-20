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
const displayText = document.getElementById('floating-display');
const labelText = document.getElementById('floating-label');
const statusText = document.getElementById('floating-status');
const playBtn = document.getElementById('floating-play-btn');
const backBtn = document.getElementById('floating-back-btn');
const progressFill = document.getElementById('floating-progress-fill');
const progressDot = document.getElementById('floating-progress-dot');

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

function sessaoEstaAtiva() {
  return !!(sessaoAtivaLocal && sessaoAtivaLocal.ativa);
}

function updateDisplay() {
  const secs = computeCurrentSeconds(timerState);
  displayText.textContent = formatMMSS(secs);

  let progress = 0;
  if (timerState.mode !== 'livre' && timerState.totalSeconds > 0) {
    progress = (timerState.totalSeconds - secs) / timerState.totalSeconds;
  }
  const progressPercent = Math.max(0, Math.min(100, progress * 100));
  progressFill.style.width = `${progressPercent}%`;
  progressDot.style.left = `${progressPercent}%`;

  labelText.textContent = timerState.mode === 'pomodoro' ? 'Foco' : 'Livre';
  statusText.textContent = sessaoEstaAtiva()
    ? (timerState.isRunning ? 'Executando' : 'Pausado')
    : 'Sem sessão';

  if (timerState.mode !== 'livre' && timerState.isRunning && secs === 0) {
    pauseTimer();
  }
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

playBtn.addEventListener('click', () => {
  if (!sessaoEstaAtiva()) return;
  if (timerState.isRunning) pauseTimer();
  else startTimer();
});

backBtn.addEventListener('click', () => {
  window.close();
});

function sincronizarUI() {
  setPlayUI();
  updateDisplay();
  if (timerState.isRunning) {
    if (!tickInterval) tickInterval = setInterval(updateDisplay, 1000);
  } else {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  }
}

chrome.storage.local.get(['timerState', 'sessaoAtiva'], ({ timerState: stored, sessaoAtiva }) => {
  if (stored) timerState = { ...timerState, ...stored };
  sessaoAtivaLocal = sessaoAtiva || null;
  sincronizarUI();
});

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
