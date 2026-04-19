// Timer state (recebido da aba anterior)
let timerState = {
  mode: 'pomodoro',
  isRunning: false,
  remainingSeconds: 1500,
  totalSeconds: 1500,
  currentSession: 1,
  config: {
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
    sessions: 4
  }
};

// Elements
const displayText = document.getElementById('floating-display');
const labelText = document.getElementById('floating-label');
const statusText = document.getElementById('floating-status');
const playBtn = document.getElementById('floating-play-btn');
const backBtn = document.getElementById('floating-back-btn');
const progressFill = document.getElementById('floating-progress-fill');
const progressDot = document.getElementById('floating-progress-dot');

let timerInterval = null;

// Receber estado da aba anterior
chrome.storage.local.get('timerState', (result) => {
  if (result.timerState) {
    timerState = result.timerState;
    updateDisplay();
  }
});

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
  statusText.textContent = 'Executando';

  timerInterval = setInterval(() => {
    timerState.remainingSeconds--;
    if (timerState.remainingSeconds < 0) {
      pauseTimer();
      timerState.remainingSeconds = 0;
    }
    updateDisplay();
    saveState();
  }, 1000);
}

function pauseTimer() {
  timerState.isRunning = false;
  playBtn.innerHTML = '▶';
  statusText.textContent = 'Pausado';
  if (timerInterval) clearInterval(timerInterval);
  saveState();
}

// Voltar para timer normal
backBtn.addEventListener('click', () => {
  pauseTimer();
  saveState();
  window.close();
});

// Atualizar display
function updateDisplay() {
  const minutes = Math.floor(timerState.remainingSeconds / 60);
  const seconds = timerState.remainingSeconds % 60;
  displayText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Atualizar barra de progresso
  const progress = (timerState.totalSeconds - timerState.remainingSeconds) / timerState.totalSeconds;
  const progressPercent = Math.max(0, Math.min(100, progress * 100));
  progressFill.style.width = `${progressPercent}%`;
  progressDot.style.left = `${progressPercent}%`;

  // Atualizar label
  if (timerState.mode === 'pomodoro') {
    labelText.textContent = 'Foco';
  } else {
    labelText.textContent = 'Tempo Livre';
  }
}

// Salvar estado
function saveState() {
  chrome.storage.local.set({ timerState: timerState });
}

// Inicializar
updateDisplay();
