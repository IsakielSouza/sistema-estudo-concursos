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
const displayText = document.getElementById('fullscreen-display');
const statusMain = document.getElementById('fullscreen-status-main');
const statusSub = document.getElementById('fullscreen-status-sub');
const playBtn = document.getElementById('fullscreen-play-btn');
const backBtn = document.getElementById('fullscreen-back-btn');
const finishBtn = document.getElementById('fullscreen-finish-btn');
const closeBtn = document.getElementById('fullscreen-close-btn');
const progressCircle = document.getElementById('fullscreen-progress-circle');
const indicators = document.getElementById('fullscreen-indicators');

let timerInterval = null;

// Receber estado da aba anterior
chrome.storage.local.get('timerState', (result) => {
  if (result.timerState) {
    timerState = result.timerState;
    updateDisplay();
    updateIndicators();
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
  statusMain.textContent = 'Executando';

  timerInterval = setInterval(() => {
    timerState.remainingSeconds--;
    if (timerState.remainingSeconds < 0) {
      pauseTimer();
      timerState.remainingSeconds = 0;
      // Aqui pode adicionar notificação de conclusão
    }
    updateDisplay();
    saveState();
  }, 1000);
}

function pauseTimer() {
  timerState.isRunning = false;
  playBtn.innerHTML = '▶';
  statusMain.textContent = 'Pausado';
  if (timerInterval) clearInterval(timerInterval);
  saveState();
}

// Voltar para timer normal
backBtn.addEventListener('click', () => {
  pauseTimer();
  saveState();
  window.close();
});

// Finalizar sessão
finishBtn.addEventListener('click', () => {
  pauseTimer();
  saveState();
  // Aqui pode adicionar lógica para marcar sessão como finalizada
  window.close();
});

// Fechar
closeBtn.addEventListener('click', () => {
  pauseTimer();
  saveState();
  window.close();
});

// ESC para fechar
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    pauseTimer();
    saveState();
    window.close();
  }
});

// Atualizar display
function updateDisplay() {
  const minutes = Math.floor(timerState.remainingSeconds / 60);
  const seconds = timerState.remainingSeconds % 60;
  displayText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Atualizar círculo
  const circumference = 2 * Math.PI * 128;
  const progress = (timerState.totalSeconds - timerState.remainingSeconds) / timerState.totalSeconds;
  progressCircle.style.strokeDasharray = `${circumference * progress} ${circumference}`;

  // Atualizar status
  if (timerState.mode === 'pomodoro') {
    statusSub.textContent = 'Foco';
  } else {
    statusSub.textContent = 'Tempo Livre';
  }
}

// Atualizar indicadores
function updateIndicators() {
  const indicators_list = indicators.querySelectorAll('.fullscreen-indicator');
  indicators_list.forEach((ind, idx) => {
    ind.classList.toggle('active', idx === timerState.currentSession - 1);
  });
}

// Salvar estado
function saveState() {
  chrome.storage.local.set({ timerState: timerState });
}

// Inicializar
updateDisplay();
updateIndicators();
