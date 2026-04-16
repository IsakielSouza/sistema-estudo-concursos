// popup.js — lógica do popup CaveiraCards

// ── Sessão de Estudo ──
const sessionIdle    = document.getElementById("session-idle");
const sessionActive  = document.getElementById("session-active");
const sessionSummary = document.getElementById("session-summary");
const timerEl        = document.getElementById("session-timer");
const questoesEl     = document.getElementById("session-questoes");
const acertosEl      = document.getElementById("session-acertos");
const summaryValEl   = document.getElementById("summary-val");

let timerInterval = null;

function formatarTimer(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function formatarResumo(ms, questoes, acertos) {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  let tempoStr = "";
  if (h > 0 && m > 0)      tempoStr = `${h}h${String(m).padStart(2,"0")}min`;
  else if (h > 0)           tempoStr = `${h}h`;
  else if (totalMin === 0)  tempoStr = "< 1min";
  else                      tempoStr = `${m}min`;
  const plural = questoes !== 1 ? "questões" : "questão";
  return `⏱ ${tempoStr}  |  📚 ${questoes} ${plural}  |  ✅ ${acertos} acertos`;
}

function mostrarEstado(estado) {
  sessionIdle.style.display    = estado === "idle"    ? "flex"  : "none";
  sessionActive.style.display  = estado === "active"  ? "block" : "none";
  sessionSummary.style.display = estado === "summary" ? "block" : "none";
}

function iniciarTimer(inicio) {
  if (timerInterval) clearInterval(timerInterval);
  const atualizar = () => { timerEl.textContent = formatarTimer(Date.now() - inicio); };
  atualizar();
  timerInterval = setInterval(atualizar, 1000);
}

// Ler estado ao abrir popup
chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
  if (sessaoAtiva && sessaoAtiva.ativa) {
    mostrarEstado("active");
    questoesEl.textContent = sessaoAtiva.questoes || 0;
    acertosEl.textContent  = sessaoAtiva.acertos  || 0;
    iniciarTimer(sessaoAtiva.inicio);
  } else if (sessaoAtiva && !sessaoAtiva.ativa && sessaoAtiva.resumo) {
    summaryValEl.textContent = sessaoAtiva.resumo;
    mostrarEstado("summary");
  } else {
    mostrarEstado("idle");
  }
});

// Iniciar sessão
document.getElementById("btn-iniciar").addEventListener("click", () => {
  const sessao = { inicio: Date.now(), questoes: 0, acertos: 0, ativa: true };
  chrome.storage.local.set({ sessaoAtiva: sessao });
  questoesEl.textContent = 0;
  acertosEl.textContent  = 0;
  iniciarTimer(sessao.inicio);
  mostrarEstado("active");
});

// Encerrar sessão
document.getElementById("btn-encerrar").addEventListener("click", () => {
  if (timerInterval) clearInterval(timerInterval);
  chrome.storage.local.get(["sessaoAtiva", "historicoSessoes"], ({ sessaoAtiva, historicoSessoes = [] }) => {
    const agora = Date.now();
    const duracaoMs = agora - (sessaoAtiva?.inicio || agora);
    const questoes = sessaoAtiva?.questoes || 0;
    const acertos  = sessaoAtiva?.acertos  || 0;
    const resumo = formatarResumo(duracaoMs, questoes, acertos);
    
    // Processar detalhes
    const detalhes = sessaoAtiva.detalhes || [];
    const materiasSet = new Set(detalhes.map(d => d.materia));
    const listaMaterias = Array.from(materiasSet).join(", ");
    
    // Calcular média de tempo por questão
    const tempoTotalMs = detalhes.reduce((acc, d) => acc + d.tempoGastoMs, 0);
    const mediaTempoMs = questoes > 0 ? Math.round(tempoTotalMs / questoes) : 0;
    
    // Nova entrada para o histórico
    const novaSessao = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-BR"),
      inicio: sessaoAtiva.inicio,
      fim: agora,
      duracaoMs,
      duracaoStr: formatarTimer(duracaoMs),
      questoes,
      acertos,
      aproveitamento: questoes > 0 ? Math.round((acertos / questoes) * 100) + "%" : "0%",
      mediaTempoMs,
      mediaTempoStr: mediaTempoMs > 0 ? formatarTimer(mediaTempoMs) : "-",
      materias: listaMaterias,
      detalhesPorMateria: agruparPorMateria(detalhes)
    };

    const novoHistorico = [novaSessao, ...historicoSessoes];
    
    chrome.storage.local.set({
      sessaoAtiva: { ativa: false, resumo, inicio: sessaoAtiva.inicio, fim: agora, questoes, acertos },
      historicoSessoes: novoHistorico
    });

    summaryValEl.textContent = resumo;
    mostrarEstado("summary");
  });
});

// Copiar resumo
document.getElementById("btn-copiar").addEventListener("click", () => {
  const btn = document.getElementById("btn-copiar");
  navigator.clipboard.writeText(summaryValEl.textContent).then(() => {
    btn.textContent = "✓ Copiado!";
    setTimeout(() => { btn.textContent = "📋 Copiar resumo"; }, 1800);
  });
});

// Nova sessão
document.getElementById("btn-nova-sessao").addEventListener("click", () => {
  chrome.storage.local.remove("sessaoAtiva");
  mostrarEstado("idle");
});

// Atualizar contadores em tempo real se o popup ficar aberto
chrome.storage.onChanged.addListener((changes) => {
  if ("sessaoAtiva" in changes) {
    const nova = changes.sessaoAtiva.newValue;
    if (nova && nova.ativa) {
      questoesEl.textContent = nova.questoes || 0;
      acertosEl.textContent  = nova.acertos  || 0;
    }
  }
});

// ── Toggle liga/desliga ──
const toggle = document.getElementById("toggle-enabled");
const toggleLabel = document.getElementById("toggle-label");
const toggleManual = document.getElementById("toggle-manual");
const toggleManualLabel = document.getElementById("toggle-manual-label");

function atualizarToggle(ativo) {
  toggle.checked = ativo;
  toggleLabel.textContent = ativo ? "Extensão ativa" : "Extensão pausada";
  toggleLabel.style.color = ativo ? "#4ade80" : "#f87171";
}

function atualizarToggleManual(ativo) {
  toggleManual.checked = ativo;
  toggleManualLabel.style.color = ativo ? "#93c5fd" : "#64748b";
}

chrome.storage.local.get(["caveiraCardsEnabled", "manualCommentCaptureEnabled"], ({ caveiraCardsEnabled, manualCommentCaptureEnabled }) => {
  atualizarToggle(caveiraCardsEnabled !== false); // default: ativo
  atualizarToggleManual(manualCommentCaptureEnabled === true); // default: inativo
});

toggle.addEventListener("change", () => {
  const ativo = toggle.checked;
  chrome.storage.local.set({ caveiraCardsEnabled: ativo });
  atualizarToggle(ativo);
});

toggleManual.addEventListener("change", () => {
  const ativo = toggleManual.checked;
  chrome.storage.local.set({ manualCommentCaptureEnabled: ativo });
  atualizarToggleManual(ativo);
});

// ── Toggle Anki ──
const ankiToggle = document.getElementById("anki-toggle");
const ankiLabel  = document.getElementById("anki-toggle-label");

async function verificarAnki() {
  try {
    const resp = await fetch("http://localhost:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "modelNames", version: 6, params: {} }),
    });
    const data = await resp.json();
    return !!data.result;
  } catch (e) {
    return false;
  }
}

function atualizarAnkiStatus(ativo) {
  ankiToggle.checked = ativo;
  ankiLabel.style.color = ativo ? "#4ade80" : "#f87171";
  ankiLabel.textContent = ativo ? "Anki: Ativo" : "Anki: Desconectado";
}

chrome.storage.local.get("ankiSetupDone_v6", async ({ ankiSetupDone_v6 }) => {
  const isOnline = await verificarAnki();
  atualizarAnkiStatus(isOnline);
  if (isOnline && !ankiSetupDone_v6) {
    chrome.storage.local.set({ ankiSetupDone_v6: true });
  }
});

ankiToggle.addEventListener("change", async () => {
  if (ankiToggle.checked) {
    ankiLabel.textContent = "Conectando...";
    const isOnline = await verificarAnki();
    if (isOnline) {
      atualizarAnkiStatus(true);
      chrome.storage.local.set({ ankiSetupDone_v6: true });
    } else {
      setTimeout(() => {
        atualizarAnkiStatus(false);
      }, 500);
    }
  } else {
    atualizarAnkiStatus(false);
  }
});

function agruparPorMateria(detalhes) {
  const grupos = {};
  detalhes.forEach(d => {
    if (!grupos[d.materia]) {
      grupos[d.materia] = { questoes: 0, acertos: 0 };
    }
    grupos[d.materia].questoes++;
    if (d.resultado !== "Erros") grupos[d.materia].acertos++;
  });
  return grupos;
}
