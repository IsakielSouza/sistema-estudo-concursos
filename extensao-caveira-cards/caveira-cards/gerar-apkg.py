"""
CaveiraCards — Gera o arquivo CaveiraCards.apkg para importação no Anki.

Execução:  python3 gerar-apkg.py
Dependência: pip install genanki

IDs fixos (não altere — identifica o modelo no Anki):
  MODEL_ID = 1_747_382_910
  DECK_ID  = 1_747_382_911
"""
import genanki

MODEL_ID = 1_747_382_910
DECK_ID  = 1_747_382_911

# ─── CSS (sincronizado com anki.js) ─────────────────────────────────────────
CSS = """
/* ── Reset ── */
* { box-sizing: border-box; margin: 0; padding: 0; }

.card {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: #0f1729; color: #e2e8f0;
  text-align: left; line-height: 1.5;
}
.nightMode.card { background: #0f1729; color: #e2e8f0; }

/* ── Header ── */
.cc-header {
  display: flex; align-items: center; gap: 12px;
  background: #1a2540; border-bottom: 2px solid #3b6ff5;
  padding: 12px 20px;
}
.cc-logo {
  width: 40px; height: 40px; border-radius: 50%;
  object-fit: cover; border: 2px solid #3b6ff5; flex-shrink: 0;
}
.cc-header-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cc-materia-texto {
  font-size: 15px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .07em;
  color: #e2e8f0 !important;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cc-banca-header { font-size: 11px; color: #64748b; font-style: italic; }

/* ── Wrapper ── */
.cc-wrap { max-width: 680px; margin: 0 auto; padding: 16px 20px 20px; }

/* ── Tags ── */
.cc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.cc-tag {
  font-size: 11px; padding: 3px 10px; border-radius: 20px;
  font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
}
.cc-tag-plataforma { background: #1e2d4d; color: #93c5fd; border: 1px solid #2d4070; }
.cc-tag-assunto    { background: #2d1a4d; color: #c4b5fd; border: 1px solid #4a2d8a; }

/* ── Enunciado — força texto claro ── */
.cc-enunciado {
  font-size: 15px; line-height: 1.8;
  color: #e2e8f0 !important;
  margin-bottom: 18px; word-break: break-word;
}
.cc-enunciado p,
.cc-enunciado span,
.cc-enunciado div,
.cc-enunciado strong,
.cc-enunciado b,
.cc-enunciado em,
.cc-enunciado i,
.cc-enunciado a,
.cc-enunciado li,
.cc-enunciado td,
.cc-enunciado th,
.cc-enunciado label { color: #e2e8f0 !important; background: transparent !important; }
.cc-enunciado p   { margin: 6px 0; }
.cc-enunciado img { max-width: 100%; border-radius: 6px; margin: 8px 0; display: block; }
.cc-enunciado table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 14px; }
.cc-enunciado th,
.cc-enunciado td  { border: 1px solid #1e2d4d; padding: 6px 10px; }
.cc-enunciado th  { background: #1a2540 !important; }

/* ── Alternativas ── */
.cc-alts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }

.cc-alt {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 11px 14px; border-radius: 10px;
  border: 1.5px solid #1e2d4d; background: #1a2540;
  font-size: 14px; color: #cbd5e1;
  line-height: 1.5; transition: background .15s, border-color .15s;
}

/* ── Clicável (frente) ── */
.cc-clicavel { cursor: pointer; }
.cc-clicavel:hover {
  background: #1e2f55 !important; border-color: #3b6ff5 !important;
}
.cc-clicavel:hover .cc-letra { background: #3b6ff5 !important; color: #fff !important; }

/* ── Correta ── */
.cc-alt.correta {
  background: #0a2918 !important; border-color: #22c55e !important; color: #86efac !important;
}
.cc-alt.correta .cc-letra     { background: #22c55e !important; color: #fff !important; }
.cc-alt.correta .cc-alt-texto { color: #86efac !important; }

/* ── Errada ── */
.cc-alt.errada {
  background: #290a0a !important; border-color: #ef4444 !important; color: #fca5a5 !important;
}
.cc-alt.errada .cc-letra     { background: #ef4444 !important; color: #fff !important; }
.cc-alt.errada .cc-alt-texto { color: #fca5a5 !important; }

/* ── Letra ── */
.cc-letra {
  min-width: 28px; height: 28px; border-radius: 50%;
  background: #1e2d4d; color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0; margin-top: 1px;
  transition: background .15s, color .15s;
}
.cc-alt-texto { flex: 1; word-break: break-word; }

/* ── Dica / feedback ── */
.cc-dica {
  font-size: 13px; color: #475569;
  text-align: center; margin-top: 6px;
  padding: 6px; border-radius: 8px;
  transition: color .2s;
}
.cc-dica.acertou { color: #4ade80 !important; font-weight: 700; }
.cc-dica.errou   { color: #f87171 !important; font-weight: 700; }

/* ── Gabarito label ── */
.cc-gabarito-label {
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; color: #64748b;
  letter-spacing: .06em; margin-bottom: 10px;
}

/* ── Explicação ── */
.cc-explicacao {
  margin-top: 16px; border-radius: 12px;
  background: #0d1626; border: 1px solid #1e2d4d;
  border-left: 3px solid #3b6ff5; overflow: hidden;
}
.cc-explicacao-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  color: #3b6ff5; padding: 10px 16px 6px; background: #0f1729;
}
.cc-explicacao-corpo { padding: 10px 16px 14px; font-size: 14px; line-height: 1.75; }
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

/* ── Comentários ── */
.cc-comentario {
  margin-top: 8px; padding: 10px 14px;
  border-radius: 8px; background: #0d1e38;
  border: 1px solid #1e3a5f; font-size: 13px; line-height: 1.6;
}
.cc-comentario,
.cc-comentario p,
.cc-comentario span,
.cc-comentario div { color: #bfdbfe !important; background: transparent !important; }
.cc-score { display: inline-block; font-size: 11px; font-weight: 700; color: #38bdf8; margin-bottom: 5px; }

/* ── Extra ── */
.extra-box {
  margin-top: 14px; padding: 12px 16px; border-radius: 10px;
  background: #0d1626; border: 1px solid #1e2d4d;
  font-size: 13px; color: #94a3b8; line-height: 1.6;
}
.extra-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  color: #475569; margin-bottom: 6px;
}

/* ── Rodapé ── */
.cc-fonte {
  margin-top: 16px; padding-top: 10px;
  border-top: 1px solid #1e2d4d;
  font-size: 11px; color: #475569;
}
.cc-fonte a { color: #3b6ff5; text-decoration: none; }
"""

# ─── Template da FRENTE (com JS interativo) ─────────────────────────────────
FRENTE_TEMPLATE = r"""{{Frente}}
<script>
(function () {
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
          a.querySelector('.cc-letra').textContent = '\u2713';
        } else if (j === i && !acertou) {
          a.classList.add('errada');
          a.querySelector('.cc-letra').textContent = '\u2717';
        }
      });
      var dica = document.getElementById('cc-dica-feedback');
      if (dica) {
        dica.textContent = acertou
          ? '\u2705 Voc\u00ea acertou! Boa!'
          : '\u274C Voc\u00ea errou \u2014 veja o gabarito no verso';
        dica.className = 'cc-dica ' + (acertou ? 'acertou' : 'errou');
      }
      setTimeout(function () {
        try { pycmd('ans'); } catch (e) {}
      }, 900);
    });
  });
})();
</script>"""

# ─── Template do VERSO ──────────────────────────────────────────────────────
VERSO_TEMPLATE = """{{Verso}}
{{#Extra}}
<div class="cc-wrap" style="padding-top:0">
  <div class="extra-box">
    <div class="extra-label">\U0001f4ac Comentários</div>
    {{Extra}}
  </div>
</div>
{{/Extra}}"""

# ─── Modelo ─────────────────────────────────────────────────────────────────
modelo = genanki.Model(
    MODEL_ID,
    "CaveiraCards",
    fields=[
        {"name": "Frente"},
        {"name": "Verso"},
        {"name": "Extra"},
    ],
    templates=[{
        "name":  "CaveiraCards",
        "qfmt":  FRENTE_TEMPLATE,
        "afmt":  VERSO_TEMPLATE,
    }],
    css=CSS,
)

# ─── Deck + nota modelo ─────────────────────────────────────────────────────
deck = genanki.Deck(DECK_ID, "CaveiraCards")

nota_modelo = genanki.Note(
    model=modelo,
    fields=[
        # Frente — card de boas-vindas
        """<div class="cc-header">
  <div class="cc-header-info">
    <span class="cc-materia-texto">CaveiraCards</span>
    <span class="cc-banca-header">Modelo instalado com sucesso \u2014 @isakielsouza</span>
  </div>
</div>
<div class="cc-wrap">
  <div class="cc-enunciado">
    <p>Bem-vindo ao <strong>CaveiraCards</strong>!</p>
    <p>Suas quest\u00f5es salvas pelas plataformas aparecer\u00e3o aqui com tema escuro,
    alternativas embaralhadas e coment\u00e1rios de resolu\u00e7\u00e3o.</p>
  </div>
  <div class="cc-alts cc-alts-frente" data-correta="0">
    <div class="cc-alt cc-clicavel"><span class="cc-letra">A</span><span class="cc-alt-texto">Clique em uma alternativa para responder</span></div>
    <div class="cc-alt cc-clicavel"><span class="cc-letra">B</span><span class="cc-alt-texto">O Anki mostrar\u00e1 o gabarito automaticamente</span></div>
  </div>
  <div class="cc-dica" id="cc-dica-feedback">\U0001f4a1 Clique na alternativa que voc\u00ea acha correta</div>
</div>""",
        # Verso
        """<div class="cc-header">
  <div class="cc-header-info">
    <span class="cc-materia-texto">CaveiraCards</span>
    <span class="cc-banca-header">Plataformas suportadas</span>
  </div>
</div>
<div class="cc-wrap">
  <div class="cc-gabarito-label">\U0001f4cc Plataformas Suportadas</div>
  <div class="cc-alts cc-alts-verso">
    <div class="cc-alt correta"><span class="cc-letra">\u2713</span><span class="cc-alt-texto">TEC Concursos</span></div>
    <div class="cc-alt correta"><span class="cc-letra">\u2713</span><span class="cc-alt-texto">Gran Quest\u00f5es</span></div>
    <div class="cc-alt correta"><span class="cc-letra">\u2713</span><span class="cc-alt-texto">QConcursos</span></div>
    <div class="cc-alt correta"><span class="cc-letra">\u2713</span><span class="cc-alt-texto">Deltinha</span></div>
    <div class="cc-alt correta"><span class="cc-letra">\u2713</span><span class="cc-alt-texto">Projeto Caveira</span></div>
  </div>
  <div class="cc-fonte">Projeto livre &mdash; <a href="https://github.com/isakielsouza">GitHub @isakielsouza</a></div>
</div>""",
        # Extra
        "",
    ],
    tags=["caveira-cards", "modelo"],
)
deck.add_note(nota_modelo)

pacote = genanki.Package(deck)
pacote.write_to_file("CaveiraCards.apkg")
print("\u2713 CaveiraCards.apkg gerado com sucesso!")
