// sessoes.js — Lógica de gestão de histórico de sessões

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("manual-form");
  const lista = document.getElementById("historico-lista");
  const btnLimpar = document.getElementById("btn-limpar-tudo");
  const btnExportar = document.getElementById("btn-exportar");

  // Exportar para JSON
  function exportarHistorico(historico) {
    if (!historico || historico.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    const data = JSON.stringify(historico, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caveira-cards-historico-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  btnExportar.addEventListener("click", () => {
    chrome.storage.local.get("historicoSessoes", ({ historicoSessoes = [] }) => {
      exportarHistorico(historicoSessoes);
    });
  });

  // Limpar Tudo
  btnLimpar.addEventListener("click", () => {
    chrome.storage.local.get("historicoSessoes", ({ historicoSessoes = [] }) => {
      if (historicoSessoes.length === 0) {
        alert("O histórico já está vazio.");
        return;
      }

      const confirmacao = confirm(
        "⚠️ ATENÇÃO: Você está prestes a apagar TODO o seu histórico de estudos. Esta ação é definitiva e os dados não poderão ser recuperados.\n\n" +
        "Deseja exportar uma cópia de segurança em .JSON antes de limpar?"
      );

      if (confirmacao) {
        // Oferece exportar antes
        exportarHistorico(historicoSessoes);
        
        // Pergunta final após exportar (ou se o usuário cancelar o download)
        setTimeout(() => {
          if (confirm("Agora que você exportou (ou cancelou), deseja realmente APAGAR TUDO do navegador?")) {
            executarLimpeza();
          }
        }, 1000);
      } else {
        // Se o usuário clicar em Cancelar no primeiro confirm, perguntamos se ele quer limpar SEM exportar
        if (confirm("Deseja prosseguir com a limpeza SEM exportar os dados? (Ação irreversível)")) {
          executarLimpeza();
        }
      }
    });
  });

  function executarLimpeza() {
    chrome.storage.local.set({ historicoSessoes: [] }, () => {
      renderizar([]);
      alert("Histórico limpo com sucesso.");
    });
  }
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

  // Inicializar
  carregarHistorico();
});
