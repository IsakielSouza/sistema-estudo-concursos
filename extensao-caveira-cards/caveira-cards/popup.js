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
  chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
    const duracao = Date.now() - (sessaoAtiva?.inicio || Date.now());
    const questoes = sessaoAtiva?.questoes || 0;
    const acertos  = sessaoAtiva?.acertos  || 0;
    const resumo = formatarResumo(duracao, questoes, acertos);
    chrome.storage.local.set({
      sessaoAtiva: { ativa: false, resumo, inicio: sessaoAtiva.inicio, fim: Date.now(), questoes, acertos }
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

// ── Badges de plataforma ──
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (!tabs[0]) return;
  const url = tabs[0].url || "";

  function setBadge(id, ativo) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = ativo ? "ATIVO" : "INATIVO";
    el.className = "badge " + (ativo ? "ativo" : "inativo");
  }

  setBadge("badge-tec",       url.includes("tecconcursos.com.br"));
  setBadge("badge-gran",      url.includes("grancursosonline.com.br"));
  setBadge("badge-qconcurso", url.includes("qconcursos.com"));
  setBadge("badge-deltinha",       url.includes("deltinha.com.br"));
  setBadge("badge-projetocaveira", url.includes("app.caveira.com"));
});

// ── Toggle liga/desliga ──
const toggle = document.getElementById("toggle-enabled");
const toggleLabel = document.getElementById("toggle-label");

function atualizarToggle(ativo) {
  toggle.checked = ativo;
  toggleLabel.textContent = ativo ? "Extensão ativa" : "Extensão pausada";
  toggleLabel.style.color = ativo ? "#4ade80" : "#f87171";
}

chrome.storage.local.get("caveiraCardsEnabled", ({ caveiraCardsEnabled }) => {
  atualizarToggle(caveiraCardsEnabled !== false); // default: ativo
});

toggle.addEventListener("change", () => {
  const ativo = toggle.checked;
  chrome.storage.local.set({ caveiraCardsEnabled: ativo });
  atualizarToggle(ativo);
});

// ── Setup Anki ──
const statusEl = document.getElementById("setup-status");
const btnSetup = document.getElementById("btn-setup");

chrome.storage.local.get("ankiSetupDone_v6", ({ ankiSetupDone_v6 }) => {
  if (ankiSetupDone_v6) {
    statusEl.textContent = "OK";
    statusEl.className = "setup-status ok";
  }
});

btnSetup.addEventListener("click", async () => {
  statusEl.textContent = "...";
  statusEl.className = "setup-status carregando";
  try {
    const resp = await fetch("http://localhost:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "modelNames", version: 6, params: {} }),
    });
    const data = await resp.json();
    if (data.result) {
      statusEl.textContent = "OK";
      statusEl.className = "setup-status ok";
      chrome.storage.local.set({ ankiSetupDone_v6: true });
    }
  } catch (e) {
    statusEl.textContent = "Anki fechado";
    statusEl.className = "setup-status erro";
  }
});
