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

// ─── Helpers para Histórico ───

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

function finalizarSessao(timerState, callback) {
  chrome.storage.local.get(['sessaoAtiva', 'historicoSessoes'], ({ sessaoAtiva, historicoSessoes = [] }) => {
    if (!sessaoAtiva || !sessaoAtiva.ativa) {
      if (typeof callback === 'function') callback();
      return;
    }
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
    }, () => {
      if (typeof callback === 'function') callback();
    });
  });
}

// Quando o alarme dispara
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timerFinish') {
    chrome.storage.local.get(['timerState'], ({ timerState }) => {
      if (timerState && timerState.isRunning) {
        // Pausa o timer ao finalizar
        const newState = { ...timerState, isRunning: false, startedAt: null };
        if (timerState.mode === 'livre') newState.elapsedSeconds = newState.elapsedSeconds + Math.floor((Date.now() - timerState.startedAt) / 1000);
        else newState.remainingSeconds = 0;

        const title = timerState.isBreak ? '☕ Pausa finalizada' : '⏱️ Foco finalizado';
        const message = timerState.isBreak ? 'Hora de voltar aos estudos!' : 'Seu tempo de foco encerrou!';
        
        const buttons = [];
        if (timerState.mode === 'pomodoro') {
          if (timerState.isBreak) {
            buttons.push({ title: '▶ Iniciar Foco' });
          } else {
            const isLongBreak = (timerState.currentSession % (timerState.config?.sessions || 4) === 0);
            buttons.push({ title: isLongBreak ? '☕ Pausa Longa' : '☕ Iniciar Pausa' });
            buttons.push({ title: '▶ Pular Pausa' });
            
            // Se acabou o FOCO, salva a sessão automaticamente
            finalizarSessao(newState);
          }
        }

        if (!(timerState.mode === 'pomodoro' && !timerState.isBreak)) {
          // Se não for fim de foco (que já salvou via finalizarSessao acima), apenas salva o timerState pausado
          chrome.storage.local.set({ timerState: newState });
        }

        showNotification(title, message, buttons);
        playBeepOffscreen();
      }
    });
  }
});

// Manipula cliques nos botões da notificação
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.storage.local.get(['timerState', 'sessaoAtiva'], ({ timerState, sessaoAtiva }) => {
    if (!timerState) return;

    let newState = { ...timerState };
    let startNewSession = false;

    if (!timerState.isBreak) {
      // Estava em FOCO
      if (buttonIndex === 0) {
        // Iniciar Pausa
        const isLongBreak = (timerState.currentSession % (timerState.config?.sessions || 4) === 0);
        const breakMinutes = isLongBreak ? timerState.config.longBreak : timerState.config.shortBreak;
        newState.isBreak = true;
        newState.totalSeconds = breakMinutes * 60;
        newState.remainingSeconds = newState.totalSeconds;
        newState.isRunning = true;
        newState.startedAt = Date.now();
      } else if (buttonIndex === 1) {
        // Pular Pausa (próximo ciclo de foco)
        newState.currentSession++;
        newState.isBreak = false;
        newState.totalSeconds = timerState.config.focus * 60;
        newState.remainingSeconds = newState.totalSeconds;
        newState.isRunning = true;
        newState.startedAt = Date.now();
        startNewSession = true;
      }
    } else {
      // Estava em PAUSA
      if (buttonIndex === 0) {
        // Iniciar Foco (próximo ciclo)
        newState.currentSession++;
        newState.isBreak = false;
        newState.totalSeconds = timerState.config.focus * 60;
        newState.remainingSeconds = newState.totalSeconds;
        newState.isRunning = true;
        newState.startedAt = Date.now();
        startNewSession = true;
      }
    }

    if (startNewSession) {
      const novaSessao = { 
        inicio: Date.now(), 
        questoes: 0, 
        acertos: 0, 
        ativa: true, 
        caderno: sessaoAtiva?.caderno || null,
        mode: newState.mode,
        ultimaAtividade: Date.now(),
        detalhes: []
      };
      chrome.storage.local.set({ timerState: newState, sessaoAtiva: novaSessao });
    } else {
      chrome.storage.local.set({ timerState: newState });
    }
    
    chrome.notifications.clear(notificationId);
  });
});

// Clique na própria notificação (abre a tela do timer)
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: chrome.runtime.getURL('timer.html') });
  chrome.notifications.clear(notificationId);
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

function showNotification(title, message, buttons = []) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'CaveiraCards.png',
    title: title || '⏱️ Timer finalizado',
    message: message || 'Seu tempo de foco encerrou!',
    buttons: buttons,
    priority: 2
  });
}
