/* shared/timer-component.js — CaveiraCards Floating Timer Logic */

(function() {
  "use strict";

  let container = null;
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
  let sessaoAtiva = null;
  let tickInterval = null;
  let isDragging = false;
  let startX, startY, initialX, initialY;

  function init() {
    chrome.storage.local.get(["timerFloatingVisible", "timerFloatingMinimized", "timerFloatingPos", "timerState", "sessaoAtiva"], (data) => {
      if (data.timerState) timerState = data.timerState;
      if (data.sessaoAtiva) sessaoAtiva = data.sessaoAtiva;
      
      if (data.timerFloatingVisible) {
        createTimerUI(data.timerFloatingMinimized, data.timerFloatingPos);
      }
      
      updateUI();
      if (timerState.isRunning) startLocalTick();
    });
  }

  // Use a small delay for content scripts to ensure body is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 100);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  }

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    
    if (changes.timerFloatingVisible) {
      if (changes.timerFloatingVisible.newValue === true) {
        chrome.storage.local.get(["timerFloatingMinimized", "timerFloatingPos"], (data) => {
          createTimerUI(data.timerFloatingMinimized, data.timerFloatingPos);
        });
      } else if (changes.timerFloatingVisible.newValue === false) {
        removeTimerUI();
      }
    }

    if (container) {
      if (changes.timerFloatingMinimized) {
        const isMin = changes.timerFloatingMinimized.newValue;
        if (isMin) container.classList.add('cc-minimized');
        else container.classList.remove('cc-minimized');
        
        const minBtn = container.querySelector('.cc-timer-minimize-btn');
        if (minBtn) minBtn.textContent = isMin ? '+' : '−';
      }

      if (changes.timerState) {
        timerState = changes.timerState.newValue;
        updateUI();
        if (timerState.isRunning) startLocalTick();
        else stopLocalTick();
      }

      if (changes.sessaoAtiva) {
        sessaoAtiva = changes.sessaoAtiva.newValue;
        updateUI();
      }
    }
  });

  function createTimerUI(minimized, pos) {
    if (container) return;
    if (!document.body) return; // Guard clause

    container = document.createElement('div');
    container.id = 'cc-timer-floating-container';
    if (minimized) container.classList.add('cc-minimized');
    
    if (pos) {
      container.style.top = pos.y + 'px';
      container.style.right = 'auto';
      container.style.left = pos.x + 'px';
    }

    container.innerHTML = `
      <div class="cc-timer-minimize-btn" title="Minimizar/Maximizar">${minimized ? '+' : '−'}</div>
      <div class="cc-timer-drag-handle" title="Fechar">✕</div>
      <div class="cc-timer-card">
        <div class="cc-timer-row">
          <div class="cc-timer-display" id="cc-timer-display">00:00</div>
          <div class="cc-timer-controls">
            <button class="cc-timer-btn" id="cc-timer-play-btn">▶</button>
            <button class="cc-timer-btn" id="cc-timer-open-btn" title="Abrir Timer Principal">🕒</button>
            <button class="cc-timer-btn" id="cc-timer-reset-btn">↻</button>
          </div>
        </div>
        <div class="cc-timer-info-row">
          <div class="cc-timer-mode" id="cc-timer-mode">FOCO</div>
          <div class="cc-timer-stats" id="cc-timer-stats">0 QUESTÕES</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Event Listeners
    const card = container.querySelector('.cc-timer-card');
    const playBtn = container.querySelector('#cc-timer-play-btn');
    const resetBtn = container.querySelector('#cc-timer-reset-btn');
    const openBtn = container.querySelector('#cc-timer-open-btn');
    const modeLabel = container.querySelector('#cc-timer-mode');
    const closeBtn = container.querySelector('.cc-timer-drag-handle');
    const minBtn = container.querySelector('.cc-timer-minimize-btn');

    // Draggable
    card.addEventListener('mousedown', startDrag);
    
    playBtn.addEventListener('mousedown', e => e.stopPropagation());
    playBtn.addEventListener('click', toggleTimer);
    
    resetBtn.addEventListener('mousedown', e => e.stopPropagation());
    resetBtn.addEventListener('click', resetTimer);

    openBtn.addEventListener('mousedown', e => e.stopPropagation());
    openBtn.addEventListener('click', () => {
      window.open(chrome.runtime.getURL('timer.html'), '_blank');
    });
    
    modeLabel.addEventListener('mousedown', e => e.stopPropagation());
    modeLabel.addEventListener('click', toggleMode);
    
    closeBtn.addEventListener('click', () => {
      chrome.storage.local.set({ timerFloatingVisible: false });
    });

    minBtn.addEventListener('click', () => {
      const isMin = container.classList.toggle('cc-minimized');
      minBtn.textContent = isMin ? '+' : '−';
      chrome.storage.local.set({ timerFloatingMinimized: isMin });
    });

    updateUI();
  }

  function removeTimerUI() {
    if (container) {
      container.remove();
      container = null;
      stopLocalTick();
    }
  }

  function startDrag(e) {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = container.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    container.style.left = (initialX + dx) + 'px';
    container.style.top = (initialY + dy) + 'px';
    container.style.right = 'auto';
  }

  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    
    const rect = container.getBoundingClientRect();
    chrome.storage.local.set({ timerFloatingPos: { x: rect.left, y: rect.top } });
  }

  function computeSeconds() {
    const base = timerState.mode === 'livre' 
      ? (timerState.elapsedSeconds || 0)
      : (timerState.remainingSeconds ?? timerState.totalSeconds);
    if (!timerState.isRunning || !timerState.startedAt) return base;
    const delta = Math.floor((Date.now() - timerState.startedAt) / 1000);
    if (timerState.mode === 'livre') return base + delta;
    return Math.max(0, base - delta);
  }

  function formatTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateUI() {
    if (!container) return;
    const secs = computeSeconds();
    const display = container.querySelector('#cc-timer-display');
    const playBtn = container.querySelector('#cc-timer-play-btn');
    const modeLabel = container.querySelector('#cc-timer-mode');
    const statsLabel = container.querySelector('#cc-timer-stats');

    if (display) display.textContent = formatTime(secs);
    if (playBtn) {
      playBtn.textContent = timerState.isRunning ? '⏸' : '▶';
      playBtn.classList.toggle('active', timerState.isRunning);
    }

    if (modeLabel) {
      if (timerState.mode === 'livre') {
        modeLabel.textContent = 'LIVRE';
        modeLabel.className = 'cc-timer-mode mode-livre';
      } else if (timerState.isBreak) {
        modeLabel.textContent = 'PAUSA';
        modeLabel.className = 'cc-timer-mode mode-pausa';
      } else {
        modeLabel.textContent = 'FOCO';
        modeLabel.className = 'cc-timer-mode mode-foco';
      }
    }

    if (statsLabel) {
      const q = sessaoAtiva?.questoes || 0;
      statsLabel.textContent = `${q} QUESTÃO${q !== 1 ? 'S' : ''}`;
    }
  }

  function startLocalTick() {
    if (tickInterval) return;
    tickInterval = setInterval(updateUI, 1000);
  }

  function stopLocalTick() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  function toggleTimer() {
    if (timerState.isRunning) {
      const secs = computeSeconds();
      if (timerState.mode === 'livre') timerState.elapsedSeconds = secs;
      else timerState.remainingSeconds = secs;
      timerState.isRunning = false;
      timerState.startedAt = null;
    } else {
      // Inicia sessão se necessário
      if (!sessaoAtiva || !sessaoAtiva.ativa) {
         const inicio = Date.now();
         const novaSessao = { 
           inicio, 
           questoes: 0, 
           acertos: 0, 
           ativa: true, 
           caderno: null, 
           mode: timerState.mode,
           ultimaAtividade: inicio,
           detalhes: []
         };
         if (timerState.mode === 'pomodoro') {
           timerState.totalSeconds = timerState.config.focus * 60;
           timerState.remainingSeconds = timerState.totalSeconds;
           timerState.isBreak = false;
         } else {
           timerState.elapsedSeconds = 0;
         }
         chrome.storage.local.set({ sessaoAtiva: novaSessao });
      }
      timerState.isRunning = true;
      timerState.startedAt = Date.now();
    }
    chrome.storage.local.set({ timerState });
  }

  function resetTimer() {
    if (confirm('Deseja resetar o cronômetro?')) {
      timerState.isRunning = false;
      timerState.startedAt = null;
      if (timerState.mode === 'pomodoro') {
        timerState.remainingSeconds = timerState.config.focus * 60;
      } else {
        timerState.elapsedSeconds = 0;
      }
      chrome.storage.local.set({ timerState });
    }
  }

  function toggleMode() {
    if (sessaoAtiva && sessaoAtiva.ativa) return;
    const newMode = timerState.mode === 'pomodoro' ? 'livre' : 'pomodoro';
    timerState.mode = newMode;
    if (newMode === 'livre') {
      timerState.elapsedSeconds = 0;
    } else {
      timerState.totalSeconds = timerState.config.focus * 60;
      timerState.remainingSeconds = timerState.totalSeconds;
    }
    chrome.storage.local.set({ timerState });
  }

})();
