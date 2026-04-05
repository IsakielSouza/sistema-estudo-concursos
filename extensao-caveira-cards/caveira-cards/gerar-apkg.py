"""
Gera o arquivo CaveiraCards.apkg para importação no Anki.
Execute: python3 gerar-apkg.py
"""
import genanki

# IDs fixos e únicos para o modelo e deck
MODEL_ID = 1_747_382_910
DECK_ID  = 1_747_382_911

CSS = """
.card {
  background: #0f1117;
  font-family: 'Segoe UI', system-ui, sans-serif;
  margin: 0;
  padding: 0;
  color: #e2e8f0;
}

/* ── Wrapper do conteúdo gerado pela extensão ── */
.cc-wrap {
  max-width: 680px !important;
  margin: 0 auto !important;
  padding: 16px !important;
  background: #0f1117 !important;
  color: #e2e8f0 !important;
}

/* Tags */
.cc-tag-plataforma {
  background: #1e2d4d !important;
  color: #93c5fd !important;
}
.cc-tag-materia {
  background: #1e3a5f !important;
  color: #60a5fa !important;
}
.cc-tag-assunto {
  background: #2d1a4d !important;
  color: #c4b5fd !important;
}

/* Banca */
.cc-banca {
  color: #64748b !important;
}

/* Enunciado */
.cc-enunciado {
  color: #e2e8f0 !important;
  font-size: 15px !important;
  line-height: 1.75 !important;
}

/* Alternativas */
.cc-alt {
  background: #1e2535 !important;
  border-color: #2d3748 !important;
  color: #cbd5e1 !important;
}
.cc-alt.correta {
  background: #0d2b1a !important;
  border-color: #22c55e !important;
  color: #4ade80 !important;
}
.cc-alt.errada {
  background: #2b0d0d !important;
  border-color: #ef4444 !important;
  color: #f87171 !important;
}
.cc-letra {
  background: #2d3748 !important;
  color: #94a3b8 !important;
}
.cc-alt.correta .cc-letra {
  background: #22c55e !important;
  color: #fff !important;
}
.cc-alt.errada .cc-letra {
  background: #ef4444 !important;
  color: #fff !important;
}

/* Gabarito label */
.cc-gabarito-label {
  color: #64748b !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: .06em !important;
  margin-bottom: 10px !important;
}

/* Comentário / explicação */
.cc-explicacao {
  background: #1a1500 !important;
  border-color: #ca8a04 !important;
  color: #fde68a !important;
}

/* Fonte */
.cc-fonte a {
  color: #3b6ff5 !important;
}

/* Campo Extra (comentário adicional) */
.extra-box {
  margin-top: 14px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #12192b;
  border: 1px solid #1e2d4d;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
}
.extra-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #475569;
  margin-bottom: 6px;
}
"""

FRENTE_TEMPLATE = "{{Frente}}"

VERSO_TEMPLATE = """{{Verso}}
{{#Extra}}
<div class="extra-box">
  <div class="extra-label">Comentário</div>
  {{Extra}}
</div>
{{/Extra}}"""

modelo = genanki.Model(
    MODEL_ID,
    "CaveiraCards",
    fields=[
        {"name": "Frente"},
        {"name": "Verso"},
        {"name": "Extra"},
    ],
    templates=[
        {
            "name": "CaveiraCards",
            "qfmt": FRENTE_TEMPLATE,
            "afmt": VERSO_TEMPLATE,
        }
    ],
    css=CSS,
)

deck = genanki.Deck(DECK_ID, "CaveiraCards")

pacote = genanki.Package(deck)
pacote.write_to_file("CaveiraCards.apkg")
print("✓ CaveiraCards.apkg gerado com sucesso!")
