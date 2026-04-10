* { box-sizing: border-box; margin: 0; padding: 0; }

.card {

  font-family: 'Segoe UI', system-ui, sans-serif;

  background: #0f1729;

  color: #e2e8f0;

  text-align: left;

  line-height: 1.5;

}

.nightMode.card { background: #0f1729; color: #e2e8f0; }

/* Header */

.cc-header {

  display: flex; align-items: center; gap: 12px;

  background: #1a2540;

  border-bottom: 2px solid #3b6ff5;

  padding: 12px 20px;

}

.cc-logo {

  width: 40px; height: 40px; border-radius: 50%;

  object-fit: cover; border: 2px solid #3b6ff5; flex-shrink: 0;

}

.cc-header-info { display: flex; flex-direction: column; gap: 2px; }

.cc-materia-texto {

  font-size: 15px; font-weight: 800;

  text-transform: uppercase; letter-spacing: .07em;

  color: #e2e8f0 !important;

}

.cc-banca-header { font-size: 11px; color: #64748b; font-style: italic; }

/* Wrapper */

.cc-wrap { max-width: 680px; margin: 0 auto; padding: 16px 20px 20px; }

/* Tags */

.cc-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }

.cc-tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 700; text-transform: uppercase; }

.cc-tag-plataforma { background: #1e2d4d; color: #93c5fd; border: 1px solid #2d4070; }

.cc-tag-assunto    { background: #2d1a4d; color: #c4b5fd; border: 1px solid #4a2d8a; }

/* ══ ENUNCIADO — força texto claro em tudo ══ */
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

.cc-enunciado img      { max-width: 100%; border-radius: 6px; margin: 8px 0; display: block; }
.cc-enunciado table    { width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0 !important; }
.cc-enunciado th,
.cc-enunciado td       { border: 1px solid #1e2d4d; padding: 6px 10px; color: #e2e8f0 !important; }
.cc-enunciado th       { background: #1a2540 !important; }

/* Alternativas */
.cc-alts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.cc-alt {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 11px 14px; border-radius: 10px;
  border: 1.5px solid #1e2d4d; background: #1a2540;
  font-size: 14px; color: #cbd5e1 !important; line-height: 1.5;
  transition: background .15s, border-color .15s;
}
.cc-alt * { color: inherit !important; background-color: transparent !important; }


/* Clicável */

.cc-clicavel { cursor: pointer; }

.cc-clicavel:hover { background: #1e2f55 !important; border-color: #3b6ff5 !important; }

.cc-clicavel:hover .cc-letra { background: #3b6ff5 !important; color: #fff !important; }

/* Correta */

.cc-alt.correta { background: #0a2918 !important; border-color: #22c55e !important; }

.cc-alt.correta .cc-letra     { background: #22c55e !important; color: #fff !important; }

.cc-alt.correta .cc-alt-texto { color: #86efac !important; }

/* Errada */

.cc-alt.errada { background: #290a0a !important; border-color: #ef4444 !important; }

.cc-alt.errada .cc-letra     { background: #ef4444 !important; color: #fff !important; }

.cc-alt.errada .cc-alt-texto { color: #fca5a5 !important; }

/* Círculo letra */

.cc-letra {

  min-width: 28px; height: 28px; border-radius: 50%;

  background: #1e2d4d; color: #94a3b8;

  display: flex; align-items: center; justify-content: center;

  font-size: 12px; font-weight: 800; flex-shrink: 0; margin-top: 1px;

}

.cc-alt-texto { flex: 1; word-break: break-word; color: #cbd5e1; }

/* Dica / feedback */

.cc-dica { font-size: 13px; color: #475569; text-align: center; margin-top: 6px; padding: 6px; border-radius: 8px; }

.cc-dica.acertou { color: #4ade80 !important; font-weight: 700; }

.cc-dica.errou   { color: #f87171 !important; font-weight: 700; }

/* Gabarito label */

.cc-gabarito-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: .06em; margin-bottom: 10px; }

/* Explicação */

.cc-explicacao { margin-top: 16px; border-radius: 12px; background: #0d1626; border: 1px solid #1e2d4d; border-left: 3px solid #3b6ff5; overflow: hidden; }

.cc-explicacao-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #3b6ff5; padding: 10px 16px 6px; background: #0f1729; }

.cc-explicacao-corpo { padding: 10px 16px 14px; font-size: 14px; line-height: 1.75; }

.cc-explicacao-corpo,

.cc-explicacao-corpo * { color: #cbd5e1 !important; background: transparent !important; }

.cc-explicacao-corpo p { margin: 5px 0; }

/* Comentários */

.cc-comentario { margin-top: 8px; padding: 10px 14px; border-radius: 8px; background: #0d1e38; border: 1px solid #1e3a5f; }

.cc-comentario,

.cc-comentario * { color: #bfdbfe !important; background: transparent !important; }

.cc-score { font-size: 11px; font-weight: 700; color: #38bdf8; display: block; margin-bottom: 4px; }

/* Extra */

.extra-box { margin-top: 14px; padding: 12px 16px; border-radius: 10px; background: #0d1626; border: 1px solid #1e2d4d; font-size: 13px; color: #94a3b8; }

.extra-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 6px; }

/* Rodapé */

.cc-fonte { margin-top: 16px; padding-top: 10px; border-top: 1px solid #1e2d4d; font-size: 11px; color: #475569; }

.cc-fonte a { color: #3b6ff5; text-decoration: none; }