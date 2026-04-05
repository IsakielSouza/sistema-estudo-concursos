// popup.js — lógica do popup CaveiraCards

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

  setBadge("badge-tec", url.includes("tecconcursos.com.br"));
  setBadge("badge-gran", url.includes("grancursosonline.com.br"));
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

chrome.storage.local.get("ankiSetupDone_v2", ({ ankiSetupDone_v2 }) => {
  if (ankiSetupDone_v2) {
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
      chrome.storage.local.set({ ankiSetupDone_v2: true });
    }
  } catch (e) {
    statusEl.textContent = "Anki fechado";
    statusEl.className = "setup-status erro";
  }
});
