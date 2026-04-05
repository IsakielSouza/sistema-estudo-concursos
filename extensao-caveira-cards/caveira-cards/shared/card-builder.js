// shared/card-builder.js
// Monta HTML da frente e verso do card Anki
// Expõe: window.CaveiraCardBuilder = { montarCard }

(function () {
  "use strict";

  const LETRAS = ["A", "B", "C", "D", "E", "F"];

  const CSS = `<style>
.cc-wrap{font-family:'Segoe UI',system-ui,sans-serif !important;max-width:640px;margin:0 auto;padding:4px;background:#fff !important;color:#1f2937 !important}
.cc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cc-tag-plataforma{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:700 !important;text-transform:uppercase;letter-spacing:.04em;background:#1a1a2e !important;color:#e0e0e0 !important}
.cc-tag-materia{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:700 !important;text-transform:uppercase;background:#dbeafe !important;color:#1e40af !important}
.cc-tag-assunto{font-size:11px !important;padding:3px 10px;border-radius:20px;font-weight:600 !important;background:#ede9fe !important;color:#5b21b6 !important}
.cc-banca{font-size:12px !important;color:#6b7280 !important;margin-bottom:10px;font-style:italic}
.cc-enunciado{font-size:15px !important;line-height:1.7;color:#1f2937 !important;margin-bottom:14px}
.cc-alts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.cc-alt{display:flex !important;align-items:center;gap:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #e5e7eb !important;background:#f9fafb !important;font-size:13px !important;line-height:1.3;color:#1f2937 !important}
.cc-alt.correta{background:#f0fdf4 !important;border-color:#22c55e !important;color:#166534 !important}
.cc-alt.errada{background:#fef2f2 !important;border-color:#ef4444 !important;color:#991b1b !important}
.cc-letra{min-width:26px;height:26px;border-radius:50%;background:#e5e7eb !important;color:#374151 !important;display:flex;align-items:center;justify-content:center;font-size:12px !important;font-weight:700 !important;flex-shrink:0}
.cc-alt.correta .cc-letra{background:#22c55e !important;color:white !important}
.cc-alt.errada .cc-letra{background:#ef4444 !important;color:white !important}
.cc-gabarito-label{font-size:12px !important;font-weight:700 !important;text-transform:uppercase;color:#6b7280 !important;letter-spacing:.05em;margin-bottom:8px}
.cc-explicacao{margin-top:12px;padding:12px;border-radius:8px;background:#fffbeb !important;border:1px solid #fcd34d;font-size:13px !important;color:#92400e !important;line-height:1.6}
.cc-fonte{margin-top:10px;font-size:11px !important;color:#9ca3af !important}
.cc-fonte a{color:#6366f1 !important;text-decoration:none}
</style>`;

  function altFrente(alternativas) {
    return alternativas.map((a, i) => {
      const texto = a.replace(/\s+/g, " ").trim();
      const letra = LETRAS[i] || String(i + 1);
      return `<div class="cc-alt"><span class="cc-letra">${letra}</span><span>${texto}</span></div>`;
    }).join("");
  }

  function altVerso(alternativas, idxCorreta, idxErrada) {
    const ic = Number(idxCorreta);
    const ie = Number(idxErrada);
    return alternativas.map((a, i) => {
      const classe = i === ic ? "cc-alt correta" : i === ie ? "cc-alt errada" : "cc-alt";
      const letra = LETRAS[i] || String(i + 1);
      return `<div class="${classe}"><span class="cc-letra">${letra}</span><span>${a.replace(/\s+/g, " ").trim()}</span></div>`;
    }).join("");
  }

  function montarCard(questao) {
    const frente = CSS + `<div class="cc-wrap">
      <div class="cc-meta">
        <span class="cc-tag-plataforma">${questao.plataforma}</span>
        <span class="cc-tag-materia">${questao.materia}</span>
        ${questao.assunto ? `<span class="cc-tag-assunto">${questao.assunto}</span>` : ""}
      </div>
      ${questao.banca ? `<div class="cc-banca">${questao.banca}</div>` : ""}
      <div class="cc-enunciado">${questao.enunciado}</div>
      <div class="cc-alts">${altFrente(questao.alternativas)}</div>
    </div>`;

    const verso = CSS + `<div class="cc-wrap">
      <div class="cc-gabarito-label">Gabarito</div>
      <div class="cc-alts">${altVerso(questao.alternativas, questao.idxCorreta, questao.idxErrada)}</div>
      ${questao.explicacao ? `<div class="cc-explicacao"><strong>Comentário:</strong><br>${questao.explicacao}</div>` : ""}
      <div class="cc-fonte">
        <a href="${questao.url}" target="_blank">Ver questão — ${questao.plataforma}</a>
        &nbsp;|&nbsp; ${questao.timestamp}
      </div>
    </div>`;

    return { frente, verso };
  }

  window.CaveiraCardBuilder = { montarCard };
})();
