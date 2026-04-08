// shared/card-builder.js
// Monta HTML da frente e verso do card Anki
// Expõe: window.CaveiraCardBuilder = { montarCard, sanitizar }

(function () {
  "use strict";

  const LETRAS = ["A", "B", "C", "D", "E", "F"];

  /* ── Sanitização de HTML ──
     Remove scripts, event handlers e TODOS os inline color/background
     para garantir legibilidade no tema escuro do card. */
  function sanitizar(html) {
    if (!html) return "";

    // 1. Remove tags <script>
    let limpo = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    // 2. Remove event handlers inline (onclick, onmouseover, etc.)
    limpo = limpo.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    // 3. Remove href javascript:
    limpo = limpo.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, "");
    // 4. Remove atributos Vue scoped (data-v-*)
    limpo = limpo.replace(/\s+data-v-[a-z0-9]+=""/gi, "");

    // 5. Processa atributos style — remove color, background e ruídos
    limpo = limpo.replace(/style\s*=\s*"([^"]*)"/gi, function (match, styles) {
      let s = styles;
      // Remove TODAS as declarações de cor (incluindo preto/escuro que seriam invisíveis no tema dark)
      s = s.replace(/\bcolor\s*:[^;]+;?\s*/gi, "");
      // Remove background
      s = s.replace(/background(?:-color)?\s*:[^;]+;?\s*/gi, "");
      // Remove lixo do Microsoft Office
      s = s.replace(/mso-[^:]+:[^;]+;?\s*/gi, "");
      // Remove font-family (usamos a fonte do card)
      s = s.replace(/font-family\s*:[^;]+;?\s*/gi, "");
      s = s.trim().replace(/;+$/, "");
      return s ? `style="${s}"` : "";
    });

    return limpo;
  }

  /* ── Fisher-Yates shuffle (executa no momento de salvar o card) ──
     Cada card terá uma ordem FIXA (não muda a cada revisão), mas
     diferente de outros cards — elimina a memorização por posição. */
  function embaralharAlternativas(alternativas, idxCorretaOrig, idxErradaOrig) {
    const n = alternativas.length;
    const mapa = Array.from({ length: n }, (_, i) => i);

    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mapa[i], mapa[j]] = [mapa[j], mapa[i]];
    }

    const altsEmbaralhadas = mapa.map(orig => alternativas[orig]);
    const novaCor    = mapa.indexOf(idxCorretaOrig);
    const novaErrada = mapa.indexOf(idxErradaOrig);

    return {
      alts:       altsEmbaralhadas,
      idxCorreta: novaCor,
      idxErrada:  novaErrada,
    };
  }

  /* ── HTML das alternativas (frente) ──
     O atributo data-correta no container é lido pelo JS interativo do template. */
  function altFrente(alternativas, idxCorreta) {
    const itens = alternativas.map((a, i) => {
      const texto = a.replace(/\s+/g, " ").trim();
      const letra = LETRAS[i] || String(i + 1);
      return `<div class="cc-alt cc-clicavel"><span class="cc-letra">${letra}</span><span class="cc-alt-texto">${texto}</span></div>`;
    }).join("");
    // data-correta é usado pelo JS do template (não visível ao usuário)
    return `<div class="cc-alts cc-alts-frente" data-correta="${idxCorreta}">${itens}</div>`;
  }

  /* ── HTML das alternativas (verso) ── */
  function altVerso(alternativas, idxCorreta, idxErrada) {
    const ic = Number(idxCorreta);
    const ie = Number(idxErrada);
    const itens = alternativas.map((a, i) => {
      let cls = "cc-alt";
      let letraCls = "";
      let letraConteudo = LETRAS[i] || String(i + 1);
      if (i === ic) { cls += " correta"; letraConteudo = "✓"; }
      else if (i === ie) { cls += " errada"; letraConteudo = "✗"; }
      return `<div class="${cls}"><span class="cc-letra">${letraConteudo}</span><span class="cc-alt-texto">${a.replace(/\s+/g, " ").trim()}</span></div>`;
    }).join("");
    return `<div class="cc-alts cc-alts-verso">${itens}</div>`;
  }

  /* ── Montagem do card ── */
  function montarCard(questao) {
    const { alts, idxCorreta, idxErrada } = embaralharAlternativas(
      questao.alternativas,
      questao.idxCorreta,
      questao.idxErrada ?? -1
    );

    const metaHtml = [
      questao.plataforma ? `<span class="cc-tag cc-tag-plataforma">${questao.plataforma}</span>` : "",
      questao.assunto    ? `<span class="cc-tag cc-tag-assunto">${questao.assunto}</span>`    : "",
    ].filter(Boolean).join("");

    const headerHtml = `
<div class="cc-header">
  <img class="cc-logo" src="_CaveiraCards.png" onerror="this.style.display='none'" alt="">
  <div class="cc-header-info">
    <span class="cc-materia-texto">${questao.materia || "Geral"}</span>
    ${questao.banca ? `<span class="cc-banca-header">${questao.banca}</span>` : ""}
  </div>
</div>`.trim();

    const frente = `${headerHtml}
<div class="cc-wrap">
  ${metaHtml ? `<div class="cc-meta">${metaHtml}</div>` : ""}
  <div class="cc-enunciado">${sanitizar(questao.enunciado)}</div>
  ${altFrente(alts, idxCorreta)}
  <div class="cc-dica" id="cc-dica-feedback">💡 Clique na alternativa que você acha correta</div>
</div>`.trim();

    const verso = `${headerHtml}
<div class="cc-wrap">
  ${metaHtml ? `<div class="cc-meta">${metaHtml}</div>` : ""}
  <div class="cc-enunciado">${sanitizar(questao.enunciado)}</div>
  <div class="cc-gabarito-label">📌 Gabarito</div>
  ${altVerso(alts, idxCorreta, idxErrada)}
  ${questao.explicacao ? `
  <div class="cc-explicacao">
    <div class="cc-explicacao-label">💬 Comentário / Resolução</div>
    <div class="cc-explicacao-corpo">${sanitizar(questao.explicacao)}</div>
  </div>` : ""}
  <div class="cc-fonte">
    <a href="${questao.url}" target="_blank">🔗 Ver questão — ${questao.plataforma}</a>
    &nbsp;·&nbsp; ${questao.timestamp}
  </div>
</div>`.trim();

    return { frente, verso };
  }

  window.CaveiraCardBuilder = { montarCard, sanitizar, embaralharAlternativas };
})();
