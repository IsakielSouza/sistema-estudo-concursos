// shared/anki.js
// Comunicação com AnkiConnect (http://localhost:8765)
// Expõe: window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra, buscarNotas }

(function () {
  "use strict";

  const MODEL_CSS = `
.card{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;margin:0;padding:8px;color:#f1f5f9;text-align:left}
.nightMode.card{background:#0f172a;color:#f1f5f9}
.cc-header{display:flex;align-items:center;gap:12px;background:#1e293b;border-radius:12px;padding:10px 16px;margin:0 auto 12px;max-width:640px;box-sizing:border-box}
.cc-logo{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #3b82f6;flex-shrink:0}
.cc-materia-texto{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#f1f5f9}
.cc-wrap{max-width:640px;margin:0 auto;padding:4px}
.cc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cc-tag-plataforma{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:#334155;color:#f1f5f9}
.cc-tag-assunto{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;background:#334155;color:#f1f5f9}
.cc-banca{font-size:12px;color:#94a3b8;margin-bottom:10px;font-style:italic}
.cc-enunciado{font-size:16px;line-height:1.6;margin-bottom:16px;color:#f1f5f9}
.cc-enunciado, .cc-enunciado *{color:#f1f5f9 !important;background:transparent !important}
.cc-alts{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
.cc-alt{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;border:1.5px solid #334155;background:#1e293b;font-size:14px;color:#f1f5f9}
.cc-alt.correta{background:#064e3b;border-color:#059669;color:#ecfdf5}
.cc-letra{min-width:28px;height:28px;border-radius:50%;background:#334155;color:#cbd5e1;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.cc-alt.correta .cc-letra{background:#22c55e;color:white}
.cc-gabarito-label{font-size:12px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.05em;margin-bottom:8px}
.cc-explicacao{margin-top:16px;padding:16px;border-radius:12px;background:#1e293b!important;border:1px solid #334155;font-size:14px;color:#f1f5f9;line-height:1.6}
.cc-explicacao *{color:#f1f5f9!important;background:transparent!important}
.cc-explicacao p{margin:4px 0}
.cc-fonte{margin-top:12px;font-size:11px;color:#64748b}
.cc-fonte a{color:#3b82f6;text-decoration:none}
.cc-comentarios{margin-top:8px}
.cc-comentarios strong{font-size:12px;text-transform:uppercase;color:#94a3b8;letter-spacing:.05em}
.cc-comentario{margin-top:10px;padding:10px 12px;border-radius:8px;background:#0c4a6e;border:1px solid #0284c7;font-size:13px;line-height:1.6;color:#e0f2fe}
.cc-comentario *{color:#e0f2fe!important;background:transparent!important}
.cc-score{display:inline-block;font-size:11px;font-weight:700;color:#38bdf8;margin-bottom:4px}
`.trim();

  const FRONT_TEMPLATE = "{{Frente}}";
  const BACK_TEMPLATE = "{{FrontSide}}<hr style='border:1px solid #e5e7eb;margin:16px 0'>{{Verso}}{{#Extra}}<hr style='border:1px solid #e5e7eb;margin:12px 0'>{{Extra}}{{/Extra}}";

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
    const niveis = [
      "CaveiraCards",
      `CaveiraCards::${plataforma}`,
      `CaveiraCards::${plataforma}::${resultado}`,
      `CaveiraCards::${plataforma}::${resultado}::${materiaLimpa}`,
    ];
    for (const deck of niveis) {
      await ankiRequest("createDeck", { deck });
    }
    return niveis[niveis.length - 1];
  }

  async function enviarQuestao(questao, frente, verso) {
    const resultado = questao.resultado;
    const deckName = await criarDecks(
      questao.plataforma,
      resultado,
      questao.materiaLimpa
    );

    const tags = [
      "caveira-cards",
      resultado === "Erros" ? "caderno-de-erros" : "revisao",
      questao.plataforma.toLowerCase().replace(/\s+/g, "-"),
      questao.materiaLimpa.toLowerCase().replace(/\s+/g, "-"),
    ];

    const noteId = await ankiRequest("addNote", {
      note: {
        deckName,
        modelName: "CaveiraCards",
        fields: {
          Frente: frente,
          Verso: verso,
          Extra: questao.banca || "",
        },
        tags,
        options: { allowDuplicate: false, duplicateScope: "deck" },
      },
    });

    return noteId;
  }

  async function atualizarExtra(noteId, extraHtml) {
    await ankiRequest("updateNoteFields", {
      note: {
        id: noteId,
        fields: { Extra: extraHtml },
      },
    });
  }

  async function buscarNotas(query) {
    return await ankiRequest("findNotes", { query });
  }

  async function configurarAnki() {
    const modelos = await ankiRequest("modelNames", {});

    if (!modelos.includes("CaveiraCards")) {
      await ankiRequest("createModel", {
        modelName: "CaveiraCards",
        inOrderFields: ["Frente", "Verso", "Extra"],
        css: MODEL_CSS,
        cardTemplates: [{
          Name: "CaveiraCards",
          Front: FRONT_TEMPLATE,
          Back: BACK_TEMPLATE,
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
            "CaveiraCards": {
              Front: FRONT_TEMPLATE,
              Back: BACK_TEMPLATE,
            },
          },
        },
      });
    }
  }

  window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra, buscarNotas };
})();
