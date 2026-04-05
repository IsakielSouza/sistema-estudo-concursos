// shared/anki.js
// Comunicação com AnkiConnect (http://localhost:8765)
// Expõe: window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra }

(function () {
  "use strict";

  const MODEL_CSS = `
.card{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;margin:0;padding:8px;color:#1f2937}
.cc-wrap{max-width:640px;margin:0 auto;padding:4px;color:#1f2937}
.cc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cc-tag-plataforma{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:#1a1a2e;color:#e0e0e0}
.cc-tag-materia{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;background:#dbeafe;color:#1e40af}
.cc-tag-assunto{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;background:#ede9fe;color:#5b21b6}
.cc-banca{font-size:12px;color:#6b7280;margin-bottom:10px;font-style:italic}
.cc-enunciado{font-size:15px;line-height:1.7;color:#1f2937;margin-bottom:14px}
.cc-alts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.cc-alt{display:flex;align-items:center;gap:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #e5e7eb;background:#f9fafb;font-size:13px;line-height:1.3;color:#1f2937}
.cc-alt.correta{background:#f0fdf4;border-color:#22c55e;color:#166534}
.cc-alt.errada{background:#fef2f2;border-color:#ef4444;color:#991b1b}
.cc-letra{min-width:26px;height:26px;border-radius:50%;background:#e5e7eb;color:#374151;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.cc-alt.correta .cc-letra{background:#22c55e;color:white}
.cc-alt.errada .cc-letra{background:#ef4444;color:white}
.cc-gabarito-label{font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;margin-bottom:8px}
.cc-explicacao{margin-top:12px;padding:12px;border-radius:8px;background:#fffbeb;border:1px solid #fcd34d;font-size:13px;color:#92400e;line-height:1.6}
.cc-fonte{margin-top:10px;font-size:11px;color:#9ca3af}
.cc-fonte a{color:#6366f1;text-decoration:none}
.cc-comentarios{margin-top:8px}
.cc-comentarios strong{font-size:12px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
.cc-comentario{margin-top:10px;padding:10px 12px;border-radius:8px;background:#f0f9ff;border:1px solid #bae6fd;font-size:13px;line-height:1.6;color:#0c4a6e}
.cc-score{display:inline-block;font-size:11px;font-weight:700;color:#0284c7;margin-bottom:4px}
`.trim();

  const BACK_TEMPLATE = "{{Verso}}{{#Extra}}<hr style='border:1px solid #e5e7eb;margin:12px 0'>{{Extra}}{{/Extra}}";

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
          Extra: [questao.banca, questao.explicacao].filter(Boolean).join("<br><br>"),
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

  async function configurarAnki() {
    const modelos = await ankiRequest("modelNames", {});

    if (!modelos.includes("CaveiraCards")) {
      await ankiRequest("createModel", {
        modelName: "CaveiraCards",
        inOrderFields: ["Frente", "Verso", "Extra"],
        css: MODEL_CSS,
        cardTemplates: [{
          Name: "CaveiraCards",
          Front: "{{Frente}}",
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
          templates: [{
            name: "CaveiraCards",
            qfmt: "{{Frente}}",
            afmt: BACK_TEMPLATE,
          }],
        },
      });
    }
  }

  window.CaveiraAnki = { enviarQuestao, configurarAnki, atualizarExtra };
})();
