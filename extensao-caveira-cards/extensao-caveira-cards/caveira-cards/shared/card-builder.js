// shared/card-builder.js
// Monta HTML da frente e verso do card Anki
// Expõe: window.CaveiraCardBuilder = { montarCard }

(function () {
  "use strict";

  const LETRAS = ["A", "B", "C", "D", "E", "F"];

  function sanitizar(html) {
    if (!html) return "";
    // Remove tags de script e seus conteúdos
    let limpo = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    // Remove atributos de evento
    limpo = limpo.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    // Remove links javascript:
    limpo = limpo.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, "");
    // Remove atributos Vue scoped (data-v-*)
    limpo = limpo.replace(/\s+data-v-[a-z0-9]+=""/gi, "");
    // Limpa inline styles: remove background/background-color e cores claras (tema escuro)
    limpo = limpo.replace(/style="([^"]*)"/gi, function(match, styles) {
      let s = styles;
      // Remove background e background-color
      s = s.replace(/background(?:-color)?\s*:[^;]+;?\s*/gi, "");
      // Remove color se for branco/claro (invisível no fundo branco do Anki)
      s = s.replace(/\bcolor\s*:\s*(white|#fff(?:fff)?|#f[0-9a-fA-F]{5}|rgba?\(\s*2[0-9]{2}\s*,\s*2[0-9]{2}\s*,\s*2[0-9]{2}[^)]*\))\s*;?\s*/gi, "");
      // Remove mso-* (Microsoft Office junk)
      s = s.replace(/mso-[^:]+:[^;]+;?\s*/gi, "");
      s = s.trim().replace(/;+$/, "");
      return s ? `style="${s}"` : "";
    });
    return limpo;
  }

  function altFrente(alternativas) {
    return alternativas.map((a, i) => {
      const texto = a.replace(/\s+/g, " ").trim();
      const letra = LETRAS[i] || String(i + 1);
      return `<div class="cc-alt"><span class="cc-letra">${letra}</span><span>${texto}</span></div>`;
    }).join("");
  }

  function altVerso(alternativas, idxCorreta) {
    const ic = Number(idxCorreta);
    return alternativas.map((a, i) => {
      const classe = i === ic ? "cc-alt correta" : "cc-alt";
      const letra = LETRAS[i] || String(i + 1);
      return `<div class="${classe}"><span class="cc-letra">${letra}</span><span>${a.replace(/\s+/g, " ").trim()}</span></div>`;
    }).join("");
  }

  function montarCard(questao) {
    const frente = `<div class="cc-header">
      <img class="cc-logo" src="_CaveiraCards.ico" alt="">
      <span class="cc-materia-texto">${questao.materia}</span>
    </div>
    <div class="cc-wrap">
      <div class="cc-meta">
        <span class="cc-tag-plataforma">${questao.plataforma}</span>
        ${questao.assunto ? `<span class="cc-tag-assunto">${questao.assunto}</span>` : ""}
      </div>
      ${questao.banca ? `<div class="cc-banca">${questao.banca}</div>` : ""}
      <div class="cc-enunciado">${sanitizar(questao.enunciado)}</div>
      <div class="cc-alts">${altFrente(questao.alternativas)}</div>
    </div>`;

    const verso = `<div class="cc-wrap">
      <div class="cc-gabarito-label">Gabarito</div>
      <div class="cc-alts">${altVerso(questao.alternativas, questao.idxCorreta)}</div>
      ${questao.explicacao ? `<div class="cc-explicacao"><strong>Comentário:</strong><br>${sanitizar(questao.explicacao)}</div>` : ""}
      <div class="cc-fonte">
        <a href="${questao.url}" target="_blank">Ver questão — ${questao.plataforma}</a>
        &nbsp;|&nbsp; ${questao.timestamp}
      </div>
    </div>`;

    return { frente, verso };
  }

  window.CaveiraCardBuilder = { montarCard, sanitizar };
})();
