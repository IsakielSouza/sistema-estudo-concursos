// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("[CaveiraCards] Extensão instalada com sucesso! by @isakielsouza");
});

// ─── Gerenciamento de Alarme para o Timer ───

// Observa mudanças no timerState para sincronizar alarmes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.timerState) {
    const state = changes.timerState.newValue;
    if (state && state.isRunning && state.mode === 'pomodoro' && state.startedAt) {
      // Calcula quanto tempo falta
      const base = state.remainingSeconds ?? state.totalSeconds;
      const delta = Math.floor((Date.now() - state.startedAt) / 1000);
      const remaining = Math.max(0, base - delta);
      
      if (remaining > 0) {
        // Cria alarme para o tempo exato de término
        chrome.alarms.create('timerFinish', { when: Date.now() + (remaining * 1000) });
      } else {
        chrome.alarms.clear('timerFinish');
      }
    } else {
      chrome.alarms.clear('timerFinish');
    }
  }
});

// Quando o alarme dispara
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timerFinish') {
    chrome.storage.local.get(['timerState'], ({ timerState }) => {
      if (timerState && timerState.isRunning) {
        const title = timerState.isBreak ? '☕ Pausa finalizada' : '⏱️ Foco finalizado';
        const message = timerState.isBreak ? 'Hora de voltar aos estudos!' : 'Seu tempo de foco encerrou!';
        showNotification(title, message);
        playBeepOffscreen();
      }
    });
  }
});

async function playBeepOffscreen() {
  // Cria o documento offscreen se necessário
  if (!(await chrome.offscreen.hasDocument?.())) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Tocar som de aviso do timer finalizado'
    });
  }
  // Envia mensagem para tocar o som
  chrome.runtime.sendMessage({ action: 'playBeep' });
}

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'CaveiraCards.png',
    title: title || '⏱️ Timer finalizado',
    message: message || 'Seu tempo de foco encerrou!',
    priority: 2
  });
}
