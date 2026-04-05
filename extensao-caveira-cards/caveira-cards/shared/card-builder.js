// shared/card-builder.js
// Monta HTML da frente e verso do card Anki
// Expõe: window.CaveiraCardBuilder = { montarCard }

(function () {
  "use strict";

  const LETRAS = ["A", "B", "C", "D", "E", "F"];

  function sanitizar(html) {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\s+on\w+="[^"]*"/gi, "")
      .replace(/\s+on\w+='[^']*'/gi, "");
  }

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
    const frente = `<div class="cc-wrap">
      <div class="cc-meta">
        <span class="cc-tag-plataforma">${questao.plataforma}</span>
        <span class="cc-tag-materia">${questao.materia}</span>
        ${questao.assunto ? `<span class="cc-tag-assunto">${questao.assunto}</span>` : ""}
      </div>
      ${questao.banca ? `<div class="cc-banca">${questao.banca}</div>` : ""}
      <div class="cc-enunciado">${sanitizar(questao.enunciado)}</div>
      <div class="cc-alts">${altFrente(questao.alternativas)}</div>
    </div>`;

    const verso = `<div class="cc-wrap">
      <div class="cc-gabarito-label">Gabarito</div>
      <div class="cc-alts">${altVerso(questao.alternativas, questao.idxCorreta, questao.idxErrada)}</div>
      ${questao.explicacao ? `<div class="cc-explicacao"><strong>Comentário:</strong><br>${sanitizar(questao.explicacao)}</div>` : ""}
      <div class="cc-fonte">
        <a href="${questao.url}" target="_blank">Ver questão — ${questao.plataforma}</a>
        &nbsp;|&nbsp; ${questao.timestamp}
      </div>
    </div>`;

    return { frente, verso };
  }

  window.CaveiraCardBuilder = { montarCard };
})();
