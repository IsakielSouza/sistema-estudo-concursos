// shared/anki.js
// Comunicação com AnkiConnect (http://localhost:8765)
// Expõe: window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra, buscarNotas }

(function () {
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     CSS DO MODELO — sincronizado com o popup da extensão
  ══════════════════════════════════════════════════════════════ */
  const MODEL_CSS = `
/* ── Reset ── */
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Base ── */
.card {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #0f1729;
  color: #e2e8f0;
  text-align: left;
  line-height: 1.5;
}
.nightMode.card { background: #0f1729; color: #e2e8f0; }

/* ── Header: logo + matéria (igual ao popup) ── */
.cc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1a2540;
  border-bottom: 2px solid #3b6ff5;
  padding: 12px 20px;
}
.cc-logo {
  width: 40px; height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3b6ff5;
  flex-shrink: 0;
}
.cc-header-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cc-materia-texto {
  font-size: 15px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .07em;
  color: #e2e8f0 !important;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cc-banca-header {
  font-size: 11px; color: #64748b; font-style: italic;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── Wrapper ── */
.cc-wrap {
  max-width: 680px; margin: 0 auto;
  padding: 16px 20px 20px;
}

/* ── Tags ── */
.cc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.cc-tag {
  font-size: 11px; padding: 3px 10px; border-radius: 20px;
  font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
}
.cc-tag-plataforma { background: #1e2d4d; color: #93c5fd; border: 1px solid #2d4070; }
.cc-tag-assunto    { background: #2d1a4d; color: #c4b5fd; border: 1px solid #4a2d8a; }

/* ── Enunciado — força legibilidade no tema escuro ── */
.cc-enunciado, 
.cc-enunciado *,
.cc-enunciado p,
.cc-enunciado span,
.cc-enunciado div,
.cc-enunciado font,
.comando,
.comando * {
  color: #e2e8f0 !important;
  background-color: transparent !important;
  text-shadow: none !important;
}
.cc-enunciado {
  font-size: 15px; line-height: 1.8;
  margin-bottom: 18px; word-break: break-word;
}

/* ══ TEXTO ASSOCIADO (Expand/Collapse) ══ */
.cc-texto-associado-wrap {
  display: block;
  clear: both;
  position: relative;
  margin-bottom: 20px;
  border-radius: 8px;
  background: #1a2540;
  border: 1.5px solid #1e2d4d;
  overflow: hidden;
  width: 100%;
}
.cc-texto-associado-toggle {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; background: #223055; cursor: pointer;
  font-size: 0.9em; font-weight: 700; color: #93c5fd;
}
.cc-texto-associado-toggle:hover { background: #2a3a66; }
.cc-texto-associado-icon { font-size: 1.2em; transition: transform .2s; }
.cc-texto-associado-wrap.expandido .cc-texto-associado-icon { transform: rotate(45deg); }
.cc-texto-associado-content {
  padding: 14px; font-size: 0.9em; line-height: 1.6;
  border-top: 1px solid #1e2d4d; color: #cbd5e1 !important;
  font-style: italic;
}
.cc-texto-associado-content * { color: #cbd5e1 !important; }

.cc-enunciado p  { margin: 6px 0; }
.cc-enunciado img { max-width: 100%; border-radius: 6px; margin: 8px 0; display: block; }
.cc-enunciado table {
  width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 14px;
}
.cc-enunciado th,
.cc-enunciado td { border: 1px solid #1e2d4d; padding: 6px 10px; }
.cc-enunciado th  { background: #1a2540 !important; }

/* ── Alternativas (container) ── */
.cc-alts {
  display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;
}

/* ── Alternativa base ── */
.cc-alt {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 11px 14px; border-radius: 10px;
  border: 1.5px solid #1e2d4d;
  background: #1a2540;
  font-size: 14px; color: #cbd5e1;
  line-height: 1.5; transition: background .15s, border-color .15s;
}

/* ── Alternativa clicável (só na frente) ── */
.cc-clicavel { cursor: pointer; }
.cc-clicavel:hover {
  background: #1e2f55 !important;
  border-color: #3b6ff5 !important;
}
.cc-clicavel:hover .cc-letra {
  background: #3b6ff5 !important;
  color: #fff !important;
}

/* ── Alternativa correta ── */
.cc-alt.correta {
  background: #0a2918 !important;
  border-color: #22c55e !important;
  color: #86efac !important;
}
.cc-alt.correta .cc-letra    { background: #22c55e !important; color: #fff !important; }
.cc-alt.correta .cc-alt-texto { color: #86efac !important; }

/* ── Alternativa errada (a que o usuário escolheu) ── */
.cc-alt.errada {
  background: #290a0a !important;
  border-color: #ef4444 !important;
  color: #fca5a5 !important;
}
.cc-alt.errada .cc-letra    { background: #ef4444 !important; color: #fff !important; }
.cc-alt.errada .cc-alt-texto { color: #fca5a5 !important; }

/* ── Círculo letra ── */
.cc-letra {
  min-width: 28px; height: 28px; border-radius: 50%;
  background: #1e2d4d; color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0; margin-top: 1px;
  transition: background .15s, color .15s;
}
.cc-alt-texto { flex: 1; word-break: break-word; }

/* ── Feedback / dica ── */
.cc-dica {
  font-size: 13px; color: #475569;
  text-align: center; margin-top: 6px;
  padding: 6px; border-radius: 8px;
  transition: color .2s;
}
.cc-dica.acertou { color: #4ade80 !important; font-weight: 700; }
.cc-dica.errou   { color: #f87171 !important; font-weight: 700; }

/* ── Label Gabarito ── */
.cc-gabarito-label {
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; color: #64748b;
  letter-spacing: .06em; margin-bottom: 10px;
}

/* ── Explicação / Resolução ── */
.cc-explicacao {
  margin-top: 16px; border-radius: 12px;
  background: #0d1626; border: 1px solid #1e2d4d;
  border-left: 3px solid #3b6ff5; overflow: hidden;
}
.cc-explicacao-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  color: #3b6ff5; padding: 10px 16px 6px;
  background: #0f1729;
}
.cc-explicacao-corpo {
  padding: 10px 16px 14px;
  font-size: 14px; line-height: 1.75;
}
.cc-explicacao-corpo,
.cc-explicacao-corpo p,
.cc-explicacao-corpo span,
.cc-explicacao-corpo div,
.cc-explicacao-corpo strong,
.cc-explicacao-corpo b,
.cc-explicacao-corpo em,
.cc-explicacao-corpo li { color: #cbd5e1 !important; background: transparent !important; }
.cc-explicacao-corpo p   { margin: 5px 0; }
.cc-explicacao-corpo img { max-width: 100%; border-radius: 6px; }

/* ── Comentários da comunidade ── */
.cc-comentario {
  margin-top: 8px; padding: 10px 14px;
  border-radius: 8px; background: #0d1e38;
  border: 1px solid #1e3a5f;
  font-size: 13px; line-height: 1.6;
}
.cc-comentario,
.cc-comentario p,
.cc-comentario span,
.cc-comentario div { color: #bfdbfe !important; background: transparent !important; }
.cc-score { display: inline-block; font-size: 11px; font-weight: 700; color: #38bdf8; margin-bottom: 5px; }

/* ── Extra (comentários capturados depois) ── */
.extra-box {
  margin-top: 14px; padding: 0; border-radius: 10px;
  background: #0d1626; border: 1px solid #1e2d4d;
  font-size: 13px; color: #94a3b8; line-height: 1.6;
  overflow: hidden;
}

/* ── Sistema de Abas no Extra ── */
.cc-tabs { display: flex; flex-direction: column; }
.cc-tabs-header {
  display: flex; background: #1a2540; border-bottom: 1px solid #1e2d4d;
}
.cc-tab-btn {
  flex: 1; padding: 10px; border: none; background: none;
  color: #64748b; font-size: 11px; font-weight: 700;
  text-transform: uppercase; cursor: pointer; transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.cc-tab-btn.active {
  color: #3b6ff5; border-bottom: 2px solid #3b6ff5; background: #1e2d4d;
}
.cc-tab-content { padding: 12px 16px; display: none; }
.cc-tab-content.active { display: block; }
`.trim(),old_string:
/* ── Rodapé ── */
.cc-fonte {
  margin-top: 16px; padding-top: 10px;
  border-top: 1px solid #1e2d4d;
  font-size: 11px; color: #475569;
}
.cc-fonte a { color: #3b6ff5; text-decoration: none; }
`.trim();

  /* ══════════════════════════════════════════════════════════════
     TEMPLATE DA FRENTE
  ══════════════════════════════════════════════════════════════ */
  const FRONT_TEMPLATE = `{{Frente}}
<script>
(function () {
  // 1. Limpeza agressiva de cores (TEC Concursos)
  var containers = document.querySelectorAll('.card, .cc-enunciado, .cc-alt-texto, .comando');
  containers.forEach(function(c) {
    c.querySelectorAll('*').forEach(function(el) {
      if (!el.style) return;
      if (el.style.color || el.getAttribute('color')) {
        el.style.setProperty('color', '#e2e8f0', 'important');
      }
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.removeProperty('font-family');
    });
  });
  document.body.style.color = '#e2e8f0';

  // 2. Interatividade: Texto Associado colapsável
  document.querySelectorAll('.cc-texto-associado-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var wrap = this.parentElement;
      var content = wrap.querySelector('.cc-texto-associado-content');
      var isExpandido = wrap.classList.toggle('expandido');
      content.style.display = isExpandido ? 'block' : 'none';
    });
  });

  // 3. Interatividade: Clique na Alternativa
  if (document.querySelector('.cc-alts-verso')) return;

  var container = document.querySelector('.cc-alts-frente');
  if (!container) return;

  var corretaIdx = parseInt(container.getAttribute('data-correta') || '-1', 10);
  var alts       = Array.from(container.querySelectorAll('.cc-alt'));
  var respondido = false;

  alts.forEach(function (alt, i) {
    alt.addEventListener('click', function () {
      if (respondido) return;
      respondido = true;
      var acertou = (i === corretaIdx);
      alts.forEach(function (a, j) {
        a.classList.remove('cc-clicavel');
        if (j === corretaIdx) {
          a.classList.add('correta');
          var l = a.querySelector('.cc-letra');
          if (l) l.textContent = '\\u2713';
        } else if (j === i && !acertou) {
          a.classList.add('errada');
          var l = a.querySelector('.cc-letra');
          if (l) l.textContent = '\\u2717';
        }
      });
      var dica = document.getElementById('cc-dica-feedback');
      if (dica) {
        dica.textContent = acertou ? '\\u2705 Você acertou! Boa!' : '\\u274C Você errou — veja o gabarito no verso';
        dica.className   = 'cc-dica ' + (acertou ? 'acertou' : 'errou');
      }
      setTimeout(function () {
        try { pycmd('ans'); } catch (e) { }
      }, 900);
    });
  });
})();
<\/script>`;

  /* ══════════════════════════════════════════════════════════════
     TEMPLATE DO VERSO
  ══════════════════════════════════════════════════════════════ */
  const BACK_TEMPLATE = `{{Verso}}
<script>
(function () {
  /* ── 1. Destaca a resposta correta automaticamente no Verso ── */
  var container = document.querySelector('.cc-alts-frente');
  if (container) {
    var corretaIdx = parseInt(container.getAttribute('data-correta') || '-1', 10);
    var alts       = container.querySelectorAll('.cc-alt');
    if (alts[corretaIdx]) {
      alts[corretaIdx].classList.add('correta');
      var letra = alts[corretaIdx].querySelector('.cc-letra');
      if (letra) letra.textContent = '\\u2713';
      alts.forEach(function(a) { a.classList.remove('cc-clicavel'); });
    }
  }

  // 2. Limpeza de cores no verso também
  var containers = document.querySelectorAll('.card, .cc-enunciado, .cc-alt-texto, .comando');
  containers.forEach(function(c) {
    c.querySelectorAll('*').forEach(function(el) {
      if (!el.style) return;
      if (el.style.color || el.getAttribute('color')) {
        el.style.setProperty('color', '#e2e8f0', 'important');
      }
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.removeProperty('font-family');
    });
  });

  // 3. Lógica de Abas
  window.ccOpenTab = function(evt, tabId) {
    var i, content, btns;
    content = document.getElementsByClassName("cc-tab-content");
    for (i = 0; i < content.length; i++) { content[i].classList.remove("active"); }
    btns = document.getElementsByClassName("cc-tab-btn");
    for (i = 0; i < btns.length; i++) { btns[i].classList.remove("active"); }
    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");
  }
})();
<\/script>
{{#Extra}}
<div class="cc-wrap" style="padding-top:0">
  <div class="extra-box">
    {{Extra}}
  </div>
</div>
{{/Extra}}`;

  /* ══════════════════════════════════════════════════════════════
     AnkiConnect helpers
  ══════════════════════════════════════════════════════════════ */
  async function ankiRequest(action, params) {
    const response = await fetch("http://localhost:8765", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  async function criarDecks(plataforma, resultado, materiaLimpa) {
    // Normaliza "Revisão" para "Revisao" para evitar problemas de encoding em deck names
    const resNormalizado = resultado === "Revisão" ? "Revisao" : resultado;
    
    const niveis = [
      "CaveiraCards",
      `CaveiraCards::${plataforma}`,
      `CaveiraCards::${plataforma}::${resNormalizado}`,
      `CaveiraCards::${plataforma}::${resNormalizado}::${materiaLimpa}`,
    ];
    for (const deck of niveis) await ankiRequest("createDeck", { deck });
    return niveis[niveis.length - 1];
  }

  async function enviarQuestao(questao, frente, verso) {
    const resultado = questao.resultado;
    const deckName  = await criarDecks(questao.plataforma, resultado, questao.materiaLimpa);

    const tags = [
      "caveira-cards",
      resultado === "Erros" ? "caderno-de-erros" : "revisao",
      questao.plataforma.toLowerCase().replace(/\s+/g, "-"),
      questao.materiaLimpa.toLowerCase().replace(/[\s:/\\?*^]/g, "-"),
    ].filter(Boolean);

    // Constrói o Extra inicial com banca + explicação (resolução do professor padrão)
    let extraInicial = "";
    if (questao.banca) extraInicial += `<em style="font-size:0.9em; color:#64748b;">${questao.banca}</em><br><br>`;
    if (questao.explicacao) {
      extraInicial += `
        <div class="cc-explicacao">
          <div class="cc-explicacao-label">Resolução</div>
          <div class="cc-explicacao-corpo">${questao.explicacao}</div>
        </div>`.trim();
    }

    const noteId = await ankiRequest("addNote", {
      note: {
        deckName,
        modelName: "CaveiraCards",
        fields: {
          Frente: frente,
          Verso:  verso,
          Extra:  extraInicial,
        },
        tags,
        options: { allowDuplicate: false, duplicateScope: "deck" },
      },
    });
    return noteId;
  }

  async function atualizarExtra(noteId, newExtraHtml) {
    const notesInfo = await ankiRequest("notesInfo", { notes: [noteId] });
    if (!notesInfo || notesInfo.length === 0) return;
    
    let currentExtra = notesInfo[0].fields.Extra.value || "";
    const normalizedNew = newExtraHtml.trim();

    // Se o conteúdo exato já existe, ignora
    if (currentExtra.includes(normalizedNew)) return "exists";

    // Lógica de mesclagem para Abas (Professor/Alunos)
    if (normalizedNew.includes("cc-tabs")) {
      const parser = new DOMParser();
      const docNew = parser.parseFromString(normalizedNew, "text/html");
      const docCurrent = parser.parseFromString(currentExtra || "<div></div>", "text/html");

      const newProf = docNew.getElementById("tab-prof");
      const newAlunos = docNew.getElementById("tab-alunos");

      let currentTabs = docCurrent.querySelector(".cc-tabs");
      
      // Se não tem abas ainda, preserva o conteúdo antigo (ex: banca) acima das abas
      if (!currentTabs) {
        const preContent = currentExtra.trim() ? `<div style="padding:10px 16px; border-bottom:1px solid #1e2d4d; font-size:11px; opacity:0.7;">${currentExtra}</div>` : "";
        currentExtra = preContent + normalizedNew;
      } else {
        // Mescla Professor
        if (newProf) {
          let tabProf = docCurrent.getElementById("tab-prof");
          if (!tabProf) {
            // Cria aba professor se não existia
            const header = docCurrent.querySelector(".cc-tabs-header");
            header.insertAdjacentHTML("afterbegin", '<button class="cc-tab-btn active" onclick="ccOpenTab(event, \'tab-prof\')">Professor</button>');
            const tabs = docCurrent.querySelector(".cc-tabs");
            tabs.insertAdjacentHTML("beforeend", `<div id="tab-prof" class="cc-tab-content active">${newProf.innerHTML}</div>`);
            // Desativa outras abas
            docCurrent.querySelectorAll(".cc-tab-btn, .cc-tab-content").forEach(el => {
              if (el.id !== "tab-prof" && !el.getAttribute("onclick")?.includes("tab-prof")) {
                el.classList.remove("active");
              }
            });
          } else {
            // Anexa se for novo conteúdo
            if (!tabProf.innerHTML.includes(newProf.innerHTML.trim())) {
              tabProf.innerHTML += newProf.innerHTML;
            }
          }
        }

        // Mescla Alunos
        if (newAlunos) {
          let tabAlunos = docCurrent.getElementById("tab-alunos");
          if (!tabAlunos) {
            const header = docCurrent.querySelector(".cc-tabs-header");
            header.insertAdjacentHTML("beforeend", '<button class="cc-tab-btn" onclick="ccOpenTab(event, \'tab-alunos\')">Alunos</button>');
            currentTabs.insertAdjacentHTML("beforeend", `<div id="tab-alunos" class="cc-tab-content">${newAlunos.innerHTML}</div>`);
          } else {
            if (!tabAlunos.innerHTML.includes(newAlunos.innerHTML.trim())) {
              tabAlunos.innerHTML += newAlunos.innerHTML;
            }
          }
        }
        currentExtra = docCurrent.body.innerHTML;
      }
    } else {
      // Anexo simples para conteúdos não estruturados
      const separator = currentExtra.trim() ? "<br><hr style='border:1px dashed #1e2d4d; margin: 10px 0;'><br>" : "";
      currentExtra = currentExtra + separator + normalizedNew;
    }

    await ankiRequest("updateNoteFields", {
      note: { id: noteId, fields: { Extra: currentExtra } },
    });
    return "updated";
  }

  async function buscarNotas(query) {
    return await ankiRequest("findNotes", { query });
  }

  /* ── Configura (ou atualiza) o modelo CaveiraCards no Anki ── */
  async function configurarAnki() {
    const modelos = await ankiRequest("modelNames", {});

    if (!modelos.includes("CaveiraCards")) {
      await ankiRequest("createModel", {
        modelName:     "CaveiraCards",
        inOrderFields: ["Frente", "Verso", "Extra"],
        css:           MODEL_CSS,
        cardTemplates: [{
          Name:  "CaveiraCards",
          Front: FRONT_TEMPLATE,
          Back:  BACK_TEMPLATE,
        }],
      });
    } else {
      await ankiRequest("updateModelStyling", {
        model: { name: "CaveiraCards", css: MODEL_CSS },
      });
      await ankiRequest("updateModelTemplates", {
        model: {
          name: "CaveiraCards",
          templates: {
            "CaveiraCards": { Front: FRONT_TEMPLATE, Back: BACK_TEMPLATE },
          },
        },
      });
    }
  }

  window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra, buscarNotas };
})();
