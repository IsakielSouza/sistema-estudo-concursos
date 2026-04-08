// ============================================================
// TEC Concursos → Anki | content.js
// ============================================================

(function () {
  "use strict";

  let ultimaQuestaoCapturada = null;

  const observer = new MutationObserver(() => verificarRespostaErrada());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(verificarRespostaErrada, 1500);

  function verificarRespostaErrada() {
    const alternativaErrada = document.querySelector("li.erro, li.ng-scope.erro");
    if (alternativaErrada) {
      const questao = capturarQuestao();
      if (questao && questao.enunciado !== ultimaQuestaoCapturada) {
        ultimaQuestaoCapturada = questao.enunciado;
        mostrarBotaoEnviar(questao);
      }
    }
  }

  function capturarQuestao() {
    try {
      const enunciadoEl = document.querySelector(
        ".questao-enunciado-comando, [class*='questao-enunciado-comando'], .questao-enunciado"
      );
      if (!enunciadoEl) return null;
      // Clona o enunciado e remove a lista de alternativas que o TEC inclui dentro dele
      const enunciadoClone = enunciadoEl.cloneNode(true);
      enunciadoClone.querySelectorAll("ul, ol, li").forEach(el => el.remove());
      let enunciado = enunciadoClone.innerHTML.trim();
      // Remove tudo a partir de "Você selecionou:" que o TEC adiciona após o enunciado
      const cortes = ["Você selecionou:", "Você errou!", "Gabarito:", "Ver resolução"];
      for (const corte of cortes) {
        const idx = enunciado.indexOf(corte);
        if (idx !== -1) enunciado = enunciado.substring(0, idx).trim();
      }
      if (!enunciado) return null;

      // Alternativas separadas
      const todosLis = Array.from(document.querySelectorAll("li[ng-repeat*='alternativa']"));

      // Pega textos únicos (deduplicados) para a frente
      const textos = [];
      const vistos = new Set();
      todosLis.forEach((el) => {
        const divTexto = el.querySelector(".questao-enunciado-alternativa-texto");
        if (!divTexto) return;
        const clone = divTexto.cloneNode(true);
        clone.querySelectorAll("p.elemento-vazio, p[size]").forEach(p => p.remove());
        const texto = clone.innerText.trim();
        if (texto && !vistos.has(texto)) {
          vistos.add(texto);
          textos.push(texto);
        }
      });
      const alternativas = textos;

      // Detecta índice da correta e errada pelo <li> que tem a classe
      let idxCorreta = -1;
      let idxErrada = -1;
      const lisComClasse = todosLis.filter(el =>
        el.classList.contains("correcao") || el.classList.contains("erro")
      );
      lisComClasse.forEach((el) => {
        const divTexto = el.querySelector(".questao-enunciado-alternativa-texto");
        if (!divTexto) return;
        const clone = divTexto.cloneNode(true);
        clone.querySelectorAll("p.elemento-vazio, p[size]").forEach(p => p.remove());
        const texto = clone.innerText.trim();
        const idx = alternativas.indexOf(texto);
        if (idx === -1) return;
        if (el.classList.contains("correcao")) idxCorreta = idx;
        if (el.classList.contains("erro")) idxErrada = idx;
      });

      const respostaCorreta = idxCorreta;
      const respostaMarcada = idxErrada;

      // Matéria
      let materia = "Geral";
      const materiaContainer = document.querySelector(".questao-cabecalho-informacoes-materia");
      if (materiaContainer) {
        const materiaLink = materiaContainer.querySelector("a");
        if (materiaLink) materia = materiaLink.innerText.trim();
      }

      // Assunto
      let assunto = "";
      const assuntoEl = document.querySelector(".questao-cabecalho-informacoes-assunto a");
      if (assuntoEl) assunto = assuntoEl.innerText.trim();

      // Banca
      let banca = "";
      const bancaEl = document.querySelector(".questao-titulo, [class*='questao-titulo']");
      if (bancaEl) banca = bancaEl.innerText.trim();

      // Resolução
      let explicacao = "";
      const explicacaoEl = document.querySelector(".questao-enunciado-resolucao, [class*='resolucao']");
      if (explicacaoEl) explicacao = explicacaoEl.innerText.trim();

      const materiaLimpa = materia.replace(/[:"]/g, "").trim();

      return {
        enunciado, alternativas, respostaCorreta, respostaMarcada,
        materia, materiaLimpa, assunto, banca, explicacao,
        url: window.location.href,
        timestamp: new Date().toLocaleDateString("pt-BR"),
      };
    } catch (e) {
      console.error("[TEC Anki] Erro:", e);
      return null;
    }
  }

  function mostrarBotaoEnviar(questao) {
    const anterior = document.getElementById("tec-anki-btn");
    if (anterior) anterior.remove();

    const btn = document.createElement("div");
    btn.id = "tec-anki-btn";
    btn.innerHTML = `
      <div class="tec-anki-inner">
        <div class="tec-anki-icon">📚</div>
        <div class="tec-anki-text">
          <span class="tec-anki-title">Adicionar ao Anki</span>
          <span class="tec-anki-sub">${questao.materia}</span>
        </div>
        <button class="tec-anki-close" id="tec-anki-close">✕</button>
      </div>
    `;

    document.body.appendChild(btn);
    setTimeout(() => btn.classList.add("visible"), 100);

    btn.querySelector(".tec-anki-inner").addEventListener("click", (e) => {
      if (e.target.id === "tec-anki-close") return;
      enviarParaAnki(questao, btn);
    });

    btn.querySelector("#tec-anki-close").addEventListener("click", () => {
      btn.classList.remove("visible");
      setTimeout(() => btn.remove(), 400);
    });

    setTimeout(() => {
      if (document.getElementById("tec-anki-btn")) {
        btn.classList.remove("visible");
        setTimeout(() => btn.remove(), 400);
      }
    }, 15000);
  }

  function montarCard(questao) {
    const letras = ["A", "B", "C", "D", "E", "F"];

    const css = `<style>
.card-wrap{font-family:'Segoe UI',system-ui,sans-serif !important;max-width:640px;margin:0 auto;padding:4px;background:#fff !important;color:#1f2937 !important}
.card-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.tag-materia{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:700 !important;text-transform:uppercase;letter-spacing:.04em;background:#dbeafe !important;color:#1e40af !important}
.tag-assunto{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:600 !important;background:#ede9fe !important;color:#5b21b6 !important}
.card-banca{font-size:12px !important;color:#6b7280 !important;margin-bottom:10px;font-style:italic}
.card-enunciado{font-size:15px !important;line-height:1.7;color:#1f2937 !important;margin-bottom:14px}
.alts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.alt{display:flex !important;align-items:center;gap:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #e5e7eb !important;background:#f9fafb !important;font-size:13px !important;line-height:1.3;color:#1f2937 !important}
.alt.correta{background:#f0fdf4 !important;border-color:#22c55e !important;color:#166534 !important}
.alt.errada{background:#fef2f2 !important;border-color:#ef4444 !important;color:#991b1b !important}
.alt-letra{min-width:26px;height:26px;border-radius:50%;background:#e5e7eb !important;color:#374151 !important;display:flex;align-items:center;justify-content:center;font-size:12px !important;font-weight:700 !important;flex-shrink:0}
.alt.correta .alt-letra{background:#22c55e !important;color:white !important}
.alt.errada .alt-letra{background:#ef4444 !important;color:white !important}
.alt-texto{padding-top:3px;color:inherit !important}
.gabarito-label{font-size:12px !important;font-weight:700 !important;text-transform:uppercase;color:#6b7280 !important;letter-spacing:.05em;margin-bottom:8px}
.card-explicacao{margin-top:12px;padding:12px;border-radius:8px;background:#fffbeb !important;border:1px solid #fcd34d;font-size:13px !important;color:#92400e !important;line-height:1.6}
.card-fonte{margin-top:10px;font-size:11px !important;color:#9ca3af !important}
.card-fonte a{color:#6366f1 !important;text-decoration:none}
</style>`;

    // Alternativas para a FRENTE (tudo na mesma linha, sem bullet)
    const altsFrente = alternativas => alternativas.map((a, i) => {
      // Remove quebras de linha e espaços extras, deixa tudo inline
      const texto = a.replace(/\s+/g, " ").trim();
      return `<div class="alt"><span class="alt-letra">${letras[i] || i+1}</span><span class="alt-texto">${texto}</span></div>`;
    }).join("");

    // Alternativas para o VERSO (com cores baseado em índice)
    const altsVerso = (alternativas, idxCorreta, idxErrada) => {
      const ic = Number(idxCorreta);
      const ie = Number(idxErrada);
      return alternativas.map((a, i) => {
        const classe = i === ic ? "alt correta" : i === ie ? "alt errada" : "alt";
        return `<div class="${classe}"><span class="alt-letra">${letras[i] || i+1}</span><span class="alt-texto">${a}</span></div>`;
      }).join("");
    };

    const frente = css + `<div class="card-wrap">
      <div class="card-meta">
        <span class="tag-materia">${questao.materia}</span>
        ${questao.assunto ? `<span class="tag-assunto">${questao.assunto}</span>` : ""}
      </div>
      ${questao.banca ? `<div class="card-banca">${questao.banca}</div>` : ""}
      <div class="card-enunciado">${questao.enunciado}</div>
      <div class="alts">${altsFrente(questao.alternativas)}</div>
    </div>`;

    const verso = css + `<div class="card-wrap">
      <div class="gabarito-label">Gabarito</div>
      <div class="alts">${altsVerso(questao.alternativas, questao.respostaCorreta, questao.respostaMarcada)}</div>
      ${questao.explicacao ? `<div class="card-explicacao"><strong>💡 Comentário:</strong><br>${questao.explicacao}</div>` : ""}
      <div class="card-fonte">
        <a href="${questao.url}" target="_blank">🔗 Ver questão no TEC</a>
        &nbsp;|&nbsp; ${questao.timestamp}
      </div>
    </div>`;

    return { frente, verso };
  }

  async function enviarParaAnki(questao, btn) {
    const inner = btn.querySelector(".tec-anki-inner");
    inner.classList.add("loading");
    btn.querySelector(".tec-anki-title").textContent = "Enviando...";

    const anki = async (action, params) => {
      const r = await fetch("http://localhost:8765", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, version: 6, params }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      return d.result;
    };

    try {
      const { frente, verso } = montarCard(questao);
      const deckName = `Caderno de Erros::TEC Concursos::${questao.materiaLimpa}`;

      // Cria baralhos em sequência
      await anki("createDeck", { deck: "Caderno de Erros::TEC Concursos" });
      await anki("createDeck", { deck: deckName });

      // Adiciona nota
      await anki("addNote", {
        note: {
          deckName,
          modelName: "TEC CONCURSOS",
          fields: {
            Frente: frente,
            Verso: verso,
            Extra: questao.banca || "",
          },
          tags: ["tec-concursos", "caderno-de-erros", questao.materiaLimpa.replace(/\s+/g, "-").toLowerCase()],
          options: { allowDuplicate: false, duplicateScope: "deck" },
        },
      });

      inner.classList.remove("loading");
      inner.classList.add("success");
      btn.querySelector(".tec-anki-title").textContent = "Adicionado! ✓";
      btn.querySelector(".tec-anki-sub").textContent = questao.materia;

      setTimeout(() => {
        btn.classList.remove("visible");
        setTimeout(() => btn.remove(), 400);
      }, 2500);

    } catch (err) {
      inner.classList.remove("loading");
      inner.classList.add("error");

      if (err.message.includes("Failed to fetch")) {
        btn.querySelector(".tec-anki-title").textContent = "Anki fechado!";
        btn.querySelector(".tec-anki-sub").textContent = "Abra o Anki e tente de novo";
      } else if (err.message.includes("duplicate")) {
        btn.querySelector(".tec-anki-title").textContent = "Já existe no deck";
        btn.querySelector(".tec-anki-sub").textContent = "Questão duplicada";
      } else {
        btn.querySelector(".tec-anki-title").textContent = "Erro ao enviar";
        btn.querySelector(".tec-anki-sub").textContent = err.message;
      }

      setTimeout(() => {
        inner.classList.remove("error");
        btn.querySelector(".tec-anki-title").textContent = "Tentar novamente";
        btn.querySelector(".tec-anki-sub").textContent = questao.materia;
      }, 4000);
    }
  }

})();
