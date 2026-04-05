"""
Gera CaveiraCards.apkg — modelo principal usado pela extensão.
Execute: python3 gerar-apkg.py

Requer: pip install genanki
Logo:   ../caveira-cards/CaveiraCards.png (embutida no .apkg)

Campos: Frente, Verso, Extra, Materia
- Frente:  questão montada pela extensão (enunciado + alternativas)
- Verso:   gabarito — só a alternativa correta destacada + explicação
- Extra:   banca/explicação + comentários dos alunos (opcional, via botão 📎)
- Materia: nome da matéria — aparece no header ao lado da logo
"""
import genanki
import os

# IDs fixos — nunca altere após distribuição (gera conflito no Anki)
MODEL_ID = 1_747_382_910
DECK_ID  = 1_747_382_911

LOGO_REF = "_CaveiraCards.png"  # prefixo _ = Anki não apaga na limpeza de media

# CSS em sincronia com shared/anki.js → MODEL_CSS
CSS = """\
.card{font-family:'Segoe UI',system-ui,sans-serif;background:#fff;margin:0;padding:8px;color:#1f2937}
.cc-header{display:flex;align-items:center;gap:12px;background:#1a1a2e;border-radius:12px;padding:10px 16px;margin:0 auto 12px;max-width:640px;box-sizing:border-box}
.cc-logo{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #3b6ff5;flex-shrink:0}
.cc-materia-texto{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#e2e8f0}
.cc-wrap{max-width:640px;margin:0 auto;padding:4px;color:#1f2937}
.cc-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cc-tag-plataforma{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;background:#1a1a2e;color:#e0e0e0}
.cc-tag-assunto{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600;background:#ede9fe;color:#5b21b6}
.cc-banca{font-size:12px;color:#6b7280;margin-bottom:10px;font-style:italic}
.cc-enunciado{font-size:15px;line-height:1.7;color:#1f2937;margin-bottom:14px}
.cc-alts{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.cc-alt{display:flex;align-items:center;gap:10px;padding:6px 12px;border-radius:8px;border:1.5px solid #e5e7eb;background:#f9fafb;font-size:13px;line-height:1.3;color:#1f2937}
.cc-alt.correta{background:#f0fdf4;border-color:#22c55e;color:#166534}
.cc-letra{min-width:26px;height:26px;border-radius:50%;background:#e5e7eb;color:#374151;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.cc-alt.correta .cc-letra{background:#22c55e;color:white}
.cc-gabarito-label{font-size:12px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;margin-bottom:8px}
.cc-explicacao{margin-top:12px;padding:12px;border-radius:8px;background:#fffbeb;border:1px solid #fcd34d;font-size:13px;color:#92400e;line-height:1.6}
.cc-fonte{margin-top:10px;font-size:11px;color:#9ca3af}
.cc-fonte a{color:#6366f1;text-decoration:none}
.cc-comentarios{margin-top:8px}
.cc-comentarios strong{font-size:12px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em}
.cc-comentario{margin-top:10px;padding:10px 12px;border-radius:8px;background:#f0f9ff;border:1px solid #bae6fd;font-size:13px;line-height:1.6;color:#0c4a6e}
.cc-score{display:inline-block;font-size:11px;font-weight:700;color:#0284c7;margin-bottom:4px}
"""

# Frente: a extensão injeta HTML completo (inclui header logo+matéria)
FRONT = "{{Frente}}"

# Verso: repete frente (com header) + gabarito + Extra se preenchido
BACK = (
    "{{FrontSide}}"
    "<hr style='border:1px solid #e5e7eb;margin:16px 0'>"
    "{{Verso}}"
    "{{#Extra}}"
    "<hr style='border:1px solid #e5e7eb;margin:12px 0'>"
    "{{Extra}}"
    "{{/Extra}}"
)

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
            "qfmt": FRONT,
            "afmt": BACK,
        }
    ],
    css=CSS,
)

deck = genanki.Deck(DECK_ID, "CaveiraCards")

import shutil

script_dir = os.path.dirname(os.path.abspath(__file__))
logo_src  = os.path.join(script_dir, "..", "caveira-cards", "CaveiraCards.png")
logo_tmp  = os.path.join(script_dir, LOGO_REF)  # cópia com nome correto (_CaveiraCards.png)
shutil.copy(logo_src, logo_tmp)

pacote = genanki.Package(deck)
pacote.media_files = [logo_tmp]  # genanki usa basename → "_CaveiraCards.png"

output = os.path.join(script_dir, "CaveiraCards.apkg")
pacote.write_to_file(output)
os.remove(logo_tmp)  # limpa cópia temporária
print(f"✓ CaveiraCards.apkg gerado: {output}")
print(f"  Logo embutida como: {LOGO_REF}")
