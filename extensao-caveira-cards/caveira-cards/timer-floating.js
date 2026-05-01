// timer-floating.js — lógica do timer flutuante minimalista (estilo Deltinha)

// Estado unificado (espelhado de timer.html)
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

// Elements
const displayText = document.getElementById('floating-display');
const modeDisplay = document.getElementById('mode-display');
const questoesCount = document.getElementById('questoes-count');
const playBtn = document.getElementById('floating-play-btn');
const closeBtn = document.getElementById('floating-close-btn');
const eyeBtn = document.getElementById('floating-eye-btn');
const resetBtn = document.getElementById('floating-reset-btn');
const checkBtn = document.getElementById('floating-check-btn');

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

  // Atualiza Modo
  if (timerState.mode === 'livre') {
    modeDisplay.textContent = 'LIVRE ⇅';
    modeDisplay.className = 'mode-indicator mode-livre';
  } else if (timerState.isBreak) {
    modeDisplay.textContent = 'PAUSA ⇅';
    modeDisplay.className = 'mode-indicator mode-pausa';
  } else {
    modeDisplay.textContent = 'FOCO ⇅';
    modeDisplay.className = 'mode-indicator mode-foco';
  }

  // Atualiza Questões
  const q = sessaoAtivaLocal?.questoes || 0;
  const plural = q !== 1 ? 'QUESTÕES' : 'QUESTÃO';
  questoesCount.textContent = `${q} ${plural}`;

  // Botão Play/Pause
  playBtn.innerHTML = timerState.isRunning ? '⏸' : '▶';
  playBtn.className = timerState.isRunning ? 'control-btn active' : 'control-btn';

  if (timerState.mode !== 'livre' && timerState.isRunning && secs === 0) {
    pauseTimer();
  }
}

function startTimer() {
  // Se não houver sessão ativa, inicia uma básica
  if (!sessaoEstaAtiva()) {
    const inicio = Date.now();
    const sessao = { 
      inicio, 
      questoes: 0, 
      acertos: 0, 
      ativa: true, 
      caderno: null, 
      mode: timerState.mode,
      ultimaAtividade: inicio,
      detalhes: []
    };
    
    timerState.startedAt = inicio;
    timerState.isRunning = true;
    
    if (timerState.mode === 'pomodoro') {
      timerState.totalSeconds = timerState.config.focus * 60;
      timerState.remainingSeconds = timerState.totalSeconds;
      timerState.isBreak = false;
    } else {
      timerState.elapsedSeconds = 0;
    }
    
    chrome.storage.local.set({ sessaoAtiva: sessao, timerState });
    return;
  }

  timerState.isRunning = true;
  timerState.startedAt = Date.now();
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
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  chrome.storage.local.set({ timerState });
}

// Event Listeners
playBtn.addEventListener('click', () => {
  if (timerState.isRunning) pauseTimer();
  else startTimer();
});

closeBtn.addEventListener('click', () => {
  window.close();
});

eyeBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('sessoes.html') });
});

resetBtn.addEventListener('click', () => {
  if (confirm('Deseja resetar o ciclo atual?')) {
    timerState.isRunning = false;
    timerState.startedAt = null;
    if (timerState.mode === 'pomodoro') {
      timerState.remainingSeconds = timerState.config.focus * 60;
    } else {
      timerState.elapsedSeconds = 0;
    }
    chrome.storage.local.set({ timerState });
  }
});

checkBtn.addEventListener('click', () => {
  // Abre o timer principal para encerrar a sessão com calma
  chrome.tabs.create({ url: chrome.runtime.getURL('timer.html') });
});

modeDisplay.addEventListener('click', () => {
  if (sessaoEstaAtiva()) return;

  const newMode = timerState.mode === 'pomodoro' ? 'livre' : 'pomodoro';
  timerState.mode = newMode;
  
  if (newMode === 'livre') {
    timerState.elapsedSeconds = 0;
  } else {
    timerState.totalSeconds = timerState.config.focus * 60;
    timerState.remainingSeconds = timerState.totalSeconds;
  }
  
  updateDisplay();
  chrome.storage.local.set({ timerState });
});

function sincronizarUI() {
  updateDisplay();
  if (timerState.isRunning) {
    if (!tickInterval) tickInterval = setInterval(updateDisplay, 1000);
  } else {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  }
}

// Initial Load
chrome.storage.local.get(['timerState', 'sessaoAtiva'], ({ timerState: stored, sessaoAtiva }) => {
  if (stored) timerState = { ...timerState, ...stored };
  sessaoAtivaLocal = sessaoAtiva || null;
  sincronizarUI();
});

// Sync from storage
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
