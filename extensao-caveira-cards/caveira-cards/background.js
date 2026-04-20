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
        // Notifica o usuário
        showNotification();
        // Toca o som (via offscreen)
        playBeepOffscreen();
        
        // Opcional: pausar o timer no storage (embora o timer.js já faça isso ao detectar 0)
        // Mas o background garante se as páginas estiverem fechadas
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

function showNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'CaveiraCards.png',
    title: '⏱️ Timer finalizado',
    message: 'Seu tempo de foco encerrou!',
    priority: 2
  });
}
