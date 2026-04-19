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
    chrome.storage.local.get(["historicoSessoes", "sessaoAtiva"], ({ historicoSessoes = [], sessaoAtiva }) => {
      renderizar(historicoSessoes, sessaoAtiva);
    });
  }

  function renderizar(historico, sessaoAtiva = null) {
    if (historico.length === 0 && (!sessaoAtiva || !sessaoAtiva.ativa)) {
      lista.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; color: #475569;">Nenhuma sessão registrada.</td></tr>';
      return;
    }

    let html = "";

    // 1. Renderizar Sessão Ativa (se houver)
    if (sessaoAtiva && sessaoAtiva.ativa) {
      const agora = Date.now();
      const duracaoMs = agora - sessaoAtiva.inicio;
      const q = sessaoAtiva.questoes || 0;
      const a = sessaoAtiva.acertos || 0;
      const aproveitamento = q > 0 ? Math.round((a / q) * 100) + "%" : "0%";
      const mediaMs = q > 0 ? Math.round(duracaoMs / q) : 0;

      const cadernoAtivoHtml = sessaoAtiva.caderno
        ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">📓 ${sessaoAtiva.caderno}</div>`
        : "";

      html += `
        <tr style="background: rgba(59, 111, 245, 0.1); border-left: 4px solid #3b6ff5;">
          <td class="row-data"><span style="background: #3b6ff5; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 8px;">AO VIVO</span> ${new Date(sessaoAtiva.inicio).toLocaleDateString("pt-BR")}${cadernoAtivoHtml}</td>
          <td>${formatarTimer(duracaoMs)}</td>
          <td>${q}</td>
          <td>${a}</td>
          <td class="row-aproveitamento">${aproveitamento}</td>
          <td>${mediaMs > 0 ? formatarTimer(mediaMs) : "-"}</td>
          <td style="font-size: 11px; color: #3b6ff5; font-weight: 700;">Sessão em andamento...</td>
          <td class="actions">
            <button class="btn" id="btn-finalizar-agora" style="padding: 4px 10px; font-size: 11px; background: #14532d; color: #4ade80; border: 1px solid #22c55e;">Finalizar</button>
          </td>
        </tr>
      `;
    }

    // 2. Renderizar Histórico
    html += historico.map(sessao => {
      const aproveitamento = parseInt(sessao.aproveitamento);
      const classeCor = aproveitamento < 60 ? 'baixo' : '';
      const mediaStr = sessao.mediaTempoStr || (sessao.mediaTempoMs ? formatarTimer(sessao.mediaTempoMs) : "-");

      const materiasResumo = sessao.materias
        ? (sessao.materias.length > 50 ? sessao.materias.substring(0, 50) + "..." : sessao.materias)
        : "-";

      const cadernoHtml = sessao.caderno
        ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;" title="${sessao.caderno}">📓 ${sessao.caderno}</div>`
        : "";

      return `
        <tr>
          <td class="row-data">${sessao.data}${cadernoHtml}</td>
          <td>${sessao.duracaoStr || (sessao.duracaoMs ? formatarTimer(sessao.duracaoMs) : "-")}</td>
          <td>${sessao.questoes}</td>
          <td>${sessao.acertos}</td>
          <td class="row-aproveitamento ${classeCor}">${sessao.aproveitamento}</td>
          <td>${mediaStr}</td>
          <td title="${sessao.materias || ''}" style="font-size: 11px; color: #64748b;">${materiasResumo}</td>
          <td class="actions">
            <button class="btn-icon btn-detalhes" data-id="${sessao.id}" title="Ver Detalhes">🔍</button>
            <button class="btn-icon btn-excluir" data-id="${sessao.id}" title="Excluir">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");

    lista.innerHTML = html;

    // Eventos de detalhes
    document.querySelectorAll(".btn-detalhes").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        window.location.href = `detalhes-sessao.html?id=${id}`;
      });
    });

    // Evento Finalizar (Sessão Ativa)
    const btnFinalizar = document.getElementById("btn-finalizar-agora");
    if (btnFinalizar) {
      btnFinalizar.addEventListener("click", () => {
        finalizarSessaoAtiva();
      });
    }

    // Eventos de exclusão
    document.querySelectorAll(".btn-excluir").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        removerSessao(id);
      });
    });
  }

  function finalizarSessaoAtiva() {
    if (!confirm("Deseja encerrar a sessão de estudos atual e salvar no histórico?")) return;

    chrome.storage.local.get(["sessaoAtiva", "historicoSessoes"], ({ sessaoAtiva, historicoSessoes = [] }) => {
      if (!sessaoAtiva || !sessaoAtiva.ativa) return;

      const agora = Date.now();
      const duracaoMs = agora - sessaoAtiva.inicio;
      const q = sessaoAtiva.questoes || 0;
      const a = sessaoAtiva.acertos || 0;
      
      const detalhes = sessaoAtiva.detalhes || [];
      const materiasSet = new Set(detalhes.map(d => d.materia));
      const listaMaterias = Array.from(materiasSet).join(", ");
      
      const tempoTotalMs = detalhes.reduce((acc, d) => acc + d.tempoGastoMs, 0);
      const mediaTempoMs = q > 0 ? Math.round(tempoTotalMs / q) : 0;

      const novaSessao = {
        id: Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        inicio: sessaoAtiva.inicio,
        fim: agora,
        duracaoMs,
        duracaoStr: formatarTimer(duracaoMs),
        questoes: q,
        acertos: a,
        aproveitamento: q > 0 ? Math.round((a / q) * 100) + "%" : "0%",
        mediaTempoMs,
        mediaTempoStr: mediaTempoMs > 0 ? formatarTimer(mediaTempoMs) : "-",
        materias: listaMaterias || "Sessão sem questões mapeadas",
        caderno: sessaoAtiva.caderno || null,
        detalhesPorMateria: agruparPorMateria(detalhes),
        detalhes: detalhes
      };

      const novoHistorico = [novaSessao, ...historicoSessoes];
      
      chrome.storage.local.set({
        sessaoAtiva: { ativa: false, inicio: sessaoAtiva.inicio, fim: agora, questoes: q, acertos: a },
        historicoSessoes: novoHistorico
      }, () => {
        renderizar(novoHistorico, { ativa: false });
        alert("Sessão finalizada com sucesso!");
      });
    });
  }

  function agruparPorMateria(detalhes) {
    const grupos = {};
    detalhes.forEach(d => {
      const materia = d.materia || "Não identificado";
      if (!grupos[materia]) {
        grupos[materia] = { questoes: 0, acertos: 0 };
      }
      grupos[materia].questoes++;
      if (d.resultado !== "Erros") grupos[materia].acertos++;
    });
    return grupos;
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

    const durMs = durMin * 60000;
    const mediaMs = q > 0 ? Math.round(durMs / q) : 0;

    const novaSessao = {
      id: Date.now(),
      data: dataBr,
      duracaoMs: durMs,
      duracaoStr: durMin >= 60 ? `${Math.floor(durMin/60)}h${String(durMin%60).padStart(2,"0")}m` : `${durMin}min`,
      questoes: q,
      acertos: a,
      aproveitamento: q > 0 ? Math.round((a / q) * 100) + "%" : "0%",
      mediaTempoMs: mediaMs,
      mediaTempoStr: mediaMs > 0 ? formatarTimer(mediaMs) : "-",
      materias: "Adição manual"
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
