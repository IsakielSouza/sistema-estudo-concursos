// Timer state
let timerState = {
  mode: 'pomodoro', // 'pomodoro' ou 'livre'
  isRunning: false,
  remainingSeconds: 1500, // 25 minutos
  totalSeconds: 1500,
  currentSession: 1, // qual sessão pomodoro
  config: {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    sessions: 4
  }
};

// Elements
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
const backBtn = document.getElementById('timer-back-btn');
const progressCircle = document.getElementById('timer-progress-circle');
const indicators = document.getElementById('timer-indicators');

let timerInterval = null;

// Toggle configurações
configBtn.addEventListener('click', () => {
  configContainer.classList.toggle('show');
  resetBtn.style.display = configContainer.classList.contains('show') ? 'block' : 'none';
});

// Abas
pomodoroTab.addEventListener('click', () => switchMode('pomodoro'));
livreTab.addEventListener('click', () => switchMode('livre'));

function switchMode(mode) {
  timerState.mode = mode;
  pomodoroTab.classList.toggle('active', mode === 'pomodoro');
  livreTab.classList.toggle('active', mode === 'livre');

  configContainer.classList.remove('show');
  resetBtn.style.display = 'none';

  if (timerState.isRunning) {
    pauseTimer();
  }

  updateDisplay();
}

// Play/Pause
playBtn.addEventListener('click', () => {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

function startTimer() {
  timerState.isRunning = true;
  playBtn.innerHTML = '⏸';
  playBtn.style.backgroundColor = '#ef4444';
  statusText.textContent = 'Executando';

  timerInterval = setInterval(() => {
    timerState.remainingSeconds--;
    if (timerState.remainingSeconds < 0) {
      pauseTimer();
      timerState.remainingSeconds = 0;
    }
    updateDisplay();
  }, 1000);
}

function pauseTimer() {
  timerState.isRunning = false;
  playBtn.innerHTML = '▶';
  playBtn.style.backgroundColor = '#22c55e';
  statusText.textContent = 'Pausado';
  if (timerInterval) clearInterval(timerInterval);
}

// Configuração
document.querySelectorAll('.timer-config-input button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const field = e.target.dataset.field;

    if (action === 'increase') {
      timerState.config[field]++;
    } else if (action === 'decrease' && timerState.config[field] > 1) {
      timerState.config[field]--;
    }

    updateConfigDisplay();
  });
});

function updateConfigDisplay() {
  document.getElementById('timer-config-focus').textContent = timerState.config.focus;
  document.getElementById('timer-config-shortbreak').textContent = timerState.config.shortBreak;
  document.getElementById('timer-config-longbreak').textContent = timerState.config.longBreak;
  document.getElementById('timer-config-sessions').textContent = timerState.config.sessions;
}

// Reset
resetBtn.addEventListener('click', () => {
  timerState.currentSession = 1;
  updateIndicators();
  pauseTimer();
});

// Fullscreen
fullscreenBtn.addEventListener('click', () => {
  pauseTimer();
  saveState();
  chrome.windows.create({
    url: chrome.runtime.getURL('timer-fullscreen.html'),
    type: 'popup',
    width: 800,
    height: 600
  });
});

// Floating
floatingBtn.addEventListener('click', () => {
  pauseTimer();
  saveState();
  chrome.windows.create({
    url: chrome.runtime.getURL('timer-floating.html'),
    type: 'popup',
    width: 320,
    height: 380
  });
});

// Atualizar display
function updateDisplay() {
  const minutes = Math.floor(timerState.remainingSeconds / 60);
  const seconds = timerState.remainingSeconds % 60;
  displayText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Atualizar círculo progressivo
  const circumference = 2 * Math.PI * 62;
  const progress = (timerState.totalSeconds - timerState.remainingSeconds) / timerState.totalSeconds;
  const dashoffset = circumference * (1 - progress);
  progressCircle.style.strokeDasharray = `${circumference * progress} ${circumference}`;
}

// Atualizar indicadores
function updateIndicators() {
  const indicators_list = indicators.querySelectorAll('.timer-indicator');
  indicators_list.forEach((ind, idx) => {
    ind.classList.toggle('active', idx === timerState.currentSession - 1);
  });
}

// Salvar estado
function saveState() {
  chrome.storage.local.set({ timerState: timerState });
}

// Listener para atualizações do estado
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.timerState) {
    timerState = changes.timerState.newValue;
    updateDisplay();
    updateIndicators();
  }
});

// Inicializar
updateDisplay();
updateConfigDisplay();
updateIndicators();
