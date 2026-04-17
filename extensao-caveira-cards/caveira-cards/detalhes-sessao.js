// detalhes-sessao.js — Lógica para exibir detalhes ricos de uma sessão

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = parseInt(urlParams.get("id"));

  if (!sessionId) {
    alert("Sessão não encontrada.");
    window.location.href = "sessoes.html";
    return;
  }

  const loadingState = document.getElementById("loading-state");
  const detailsContent = document.getElementById("session-details");

  chrome.storage.local.get("historicoSessoes", ({ historicoSessoes = [] }) => {
    const sessao = historicoSessoes.find(s => s.id === sessionId);

    if (!sessao) {
      alert("Sessão não encontrada no histórico.");
      window.location.href = "sessoes.html";
      return;
    }

    renderizarDetalhes(sessao);
    loadingState.style.display = "none";
    detailsContent.style.display = "block";
  });

  function renderizarDetalhes(sessao) {
    // 1. Resumo Topo
    document.getElementById("det-data").textContent = sessao.data;
    document.getElementById("det-tempo").textContent = sessao.duracaoStr;
    document.getElementById("det-questoes").textContent = sessao.questoes;
    document.getElementById("det-aproveitamento").textContent = sessao.aproveitamento;
    document.getElementById("det-media").textContent = sessao.mediaTempoStr;

    // Ajustar cor do aproveitamento
    const perc = parseInt(sessao.aproveitamento);
    const elAproveitamento = document.getElementById("det-aproveitamento");
    if (perc < 60) {
      elAproveitamento.classList.remove("success");
      elAproveitamento.classList.add("danger");
    }

    // 2. Mapeamento e Alertas
    const mapeamentoInfo = document.getElementById("mapeamento-info");
    const detalhes = sessao.detalhes || [];
    
    // Identificar questões com matéria "Não identificado"
    const naoMapeadas = detalhes.filter(d => 
      !d.materia || d.materia === "Não identificado" || d.materia === "Matéria não encontrada"
    ).length;

    if (naoMapeadas > 0) {
      mapeamentoInfo.innerHTML = `
        <div class="unmapped-warning">
          <span>⚠️</span>
          <div>
            <strong>Atenção:</strong> ${naoMapeadas} questões desta sessão não tiveram a matéria identificada automaticamente pela plataforma.
          </div>
        </div>
      `;
    }

    // 3. Desempenho por Matéria
    const listaMaterias = document.getElementById("lista-materias");
    const grupos = sessao.detalhesPorMateria || {};
    
    const materiasSorted = Object.keys(grupos).sort((a, b) => grupos[b].questoes - grupos[a].questoes);

    if (materiasSorted.length === 0) {
      listaMaterias.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Nenhum detalhe por matéria disponível.</td></tr>';
    } else {
      listaMaterias.innerHTML = materiasSorted.map(m => {
        const g = grupos[m];
        const p = Math.round((g.acertos / g.questoes) * 100);
        return `
          <tr>
            <td class="materia-nome">${m}</td>
            <td>${g.questoes}</td>
            <td>${g.acertos}</td>
            <td style="font-weight: 700; color: ${p < 60 ? '#f87171' : '#4ade80'}">${p}%</td>
            <td>
              <div class="progresso-bar-bg">
                <div class="progresso-bar-fill" style="width: ${p}%; background: ${p < 60 ? '#f87171' : '#4ade80'}"></div>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    // 4. Linha do Tempo
    const timelineLista = document.getElementById("timeline-lista");
    if (!detalhes || detalhes.length === 0) {
      timelineLista.innerHTML = '<div style="color: #64748b; padding: 10px;">A linha do tempo só está disponível para sessões capturadas automaticamente (v2.1+).</div>';
    } else {
      timelineLista.innerHTML = detalhes.slice().reverse().map(d => {
        const hora = new Date(d.timestamp).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
        const isError = d.resultado === "Erros";
        const tempoGasto = d.tempoGastoMs ? formatarTimerCurto(d.tempoGastoMs) : "";

        return `
          <div class="timeline-item ${isError ? 'error' : 'success'}">
            <div class="timeline-time">${hora} ${tempoGasto ? `· ${tempoGasto}` : ''}</div>
            <div class="timeline-content">
              <div class="timeline-materia">${d.materia || "Sem matéria"}</div>
              <div class="timeline-resultado" style="color: ${isError ? '#f87171' : '#4ade80'}">
                ${isError ? '❌ Errou' : '✅ Acertou'} · ${d.resultado}
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  function formatarTimerCurto(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
});
