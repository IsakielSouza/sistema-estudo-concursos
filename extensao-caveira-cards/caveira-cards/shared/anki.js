// shared/anki.js
// Comunicação com AnkiConnect (http://localhost:8765)
// Expõe: window.CaveiraAnki = { enviarQuestao }

(function () {
  "use strict";

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

  // Cria todos os níveis do deck hierárquico:
  // CaveiraCards → CaveiraCards::TEC Concursos → ...::Erros → ...::Erros::Direito Constitucional
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
    const resultado = questao.resultado; // "Erros" ou "Revisão"
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

    await ankiRequest("addNote", {
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

    return deckName;
  }

  // Verifica se o modelo "CaveiraCards" existe no Anki e cria se necessário
  async function configurarAnki() {
    const modelos = await ankiRequest("modelNames", {});
    if (modelos.includes("CaveiraCards")) return "ja_existe";

    await ankiRequest("createModel", {
      modelName: "CaveiraCards",
      inOrderFields: ["Frente", "Verso", "Extra"],
      css: ".card { font-family: 'Segoe UI', system-ui, sans-serif; background: white; margin: 0; padding: 8px; }",
      cardTemplates: [{
        Name: "CaveiraCards",
        Front: "{{Frente}}",
        Back: "{{Verso}}",
      }],
    });

    return "criado";
  }

  window.CaveiraAnki = { enviarQuestao, configurarAnki };
})();
