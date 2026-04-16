// sessoes.js — Lógica de gestão de histórico de sessões

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("manual-form");
  const lista = document.getElementById("historico-lista");
  const btnLimpar = document.getElementById("btn-limpar-tudo");

  // Carregar e renderizar histórico
  function carregarHistorico() {
    chrome.storage.local.get("historicoSessoes", ({ historicoSessoes = [] }) => {
      renderizar(historicoSessoes);
    });
  }

  function renderizar(historico) {
    if (historico.length === 0) {
      lista.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #475569;">Nenhuma sessão registrada.</td></tr>';
      return;
    }

    lista.innerHTML = historico.map(sessao => {
      const aproveitamento = parseInt(sessao.aproveitamento);
      const classeCor = aproveitamento < 60 ? 'baixo' : '';
      
      return `
        <tr>
          <td class="row-data">${sessao.data}</td>
          <td>${sessao.duracaoStr || (sessao.duracaoMs ? formatarTimer(sessao.duracaoMs) : "-")}</td>
          <td>${sessao.questoes}</td>
          <td>${sessao.acertos}</td>
          <td class="row-aproveitamento ${classeCor}">${sessao.aproveitamento}</td>
          <td class="actions">
            <button class="btn-icon btn-excluir" data-id="${sessao.id}" title="Excluir">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");

    // Eventos de exclusão
    document.querySelectorAll(".btn-excluir").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        removerSessao(id);
      });
    });
  }

  function formatarTimer(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h${String(m).padStart(2,"0")}m`;
    return `${m}min`;
  }

  function removerSessao(id) {
    if (!confirm("Deseja excluir este registro do histórico?")) return;

    chrome.storage.local.get("historicoSessoes", ({ historicoSessoes = [] }) => {
      const novo = historicoSessoes.filter(s => s.id !== id);
      chrome.storage.local.set({ historicoSessoes: novo }, () => {
        renderizar(novo);
      });
    });
  }

  // Adicionar Manual
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const dataVal = document.getElementById("form-data").value; // YYYY-MM-DD
    const durMin  = parseInt(document.getElementById("form-duracao").value);
    const q       = parseInt(document.getElementById("form-questoes").value);
    const a       = parseInt(document.getElementById("form-acertos").value);

    // Converte data para padrão BR
    const [y, m, d] = dataVal.split("-");
    const dataBr = `${d}/${m}/${y}`;

    const novaSessao = {
      id: Date.now(),
      data: dataBr,
      duracaoMs: durMin * 60000,
      duracaoStr: durMin >= 60 ? `${Math.floor(durMin/60)}h${String(durMin%60).padStart(2,"0")}m` : `${durMin}min`,
      questoes: q,
      acertos: a,
      aproveitamento: q > 0 ? Math.round((a / q) * 100) + "%" : "0%"
    };

    chrome.storage.local.get("historicoSessoes", ({ historicoSessoes = [] }) => {
      const novo = [novaSessao, ...historicoSessoes];
      chrome.storage.local.set({ historicoSessoes: novo }, () => {
        renderizar(novo);
        form.reset();
        alert("Sessão adicionada com sucesso!");
      });
    });
  });

  // Limpar Tudo
  btnLimpar.addEventListener("click", () => {
    if (!confirm("⚠️ ATENÇÃO: Deseja apagar TODO o histórico de sessões? Esta ação não pode ser desfeita.")) return;
    
    chrome.storage.local.set({ historicoSessoes: [] }, () => {
      renderizar([]);
    });
  });

  // Inicializar
  carregarHistorico();
});
