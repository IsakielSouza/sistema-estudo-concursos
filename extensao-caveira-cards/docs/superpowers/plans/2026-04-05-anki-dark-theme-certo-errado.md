# Anki Dark Theme — Modelo Certo/Errado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um novo script Python que gera `CaveiraCards-CertoErrado.apkg` — modelo Certo/Errado independente com dark theme, logo da extensão no header ao lado do nome da matéria.

**Architecture:** Um único script `gerar-apkg-certo-errado.py` usando `genanki`. O logo `CaveiraCards.png` (128×128px RGBA) é embutido no `.apkg` como media file via `package.media_files`. O template HTML referencia o logo por nome de arquivo simples (`_CaveiraCards.png` — prefixo `_` é convenção Anki para media).

**Tech Stack:** Python 3, genanki (`pip install genanki`), CaveiraCards.png (128×128 RGBA PNG)

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `anki-addon/gerar-apkg-certo-errado.py` | Criar — script principal |
| `anki-addon/CaveiraCards-CertoErrado.apkg` | Gerado pelo script (não commitar) |

---

## Task 1: Criar o script gerar-apkg-certo-errado.py

**Files:**
- Create: `anki-addon/gerar-apkg-certo-errado.py`

- [ ] **Step 1: Criar o arquivo com o conteúdo completo**

Criar `/home/isakiel/projects/sistema-estudo-concursos/extensao-caveira-cards/anki-addon/gerar-apkg-certo-errado.py` com o seguinte conteúdo:

```python
"""
Gera CaveiraCards-CertoErrado.apkg — modelo Certo/Errado com dark theme.
Execute: python3 gerar-apkg-certo-errado.py

Requer: pip install genanki
Logo:   ../caveira-cards/CaveiraCards.png (embutida no .apkg)
"""
import genanki
import os

# IDs fixos — diferentes do modelo CaveiraCards da extensão
MODEL_ID = 1_747_382_920
DECK_ID  = 1_747_382_921

CSS = """
/* ── Base ── */
.card {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #0f1117;
  margin: 0;
  padding: 16px;
  color: #e2e8f0;
  max-width: 680px;
  margin: 0 auto;
}

/* ── Header: logo + matéria lado a lado ── */
.cc-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #1e2d4d;
  border: 1px solid #2d4a7a;
  border-radius: 14px;
  padding: 10px 24px;
  margin-bottom: 14px;
}
.cc-logo {
  height: 28px;
  width: auto;
}
.cc-materia-texto {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #e2e8f0;
}

/* ── Assunto / Tópico ── */
.cc-assunto {
  text-align: center;
  font-size: 12px;
  font-style: italic;
  letter-spacing: 1.5px;
  color: #c4b5fd;
  background: #1e1535;
  border-radius: 8px;
  padding: 6px 14px;
  margin-bottom: 16px;
}

/* ── Afirmação ── */
.cc-afirmacao {
  font-size: 16px;
  line-height: 1.75;
  color: #e2e8f0;
  background: #1a1f2e;
  border-radius: 12px;
  border: 1px solid #2d3748;
  padding: 20px;
  margin-bottom: 14px;
  text-align: justify;
}

/* ── Dica (hint) ── */
.cc-dica {
  text-align: center;
  margin: 10px auto 14px;
  width: fit-content;
}
.cc-dica a {
  font-size: 13px;
  color: #60a5fa;
  text-decoration: none;
  background: #12192b;
  border: 1px solid #1e2d4d;
  border-radius: 20px;
  padding: 5px 16px;
  display: inline-block;
}

/* ── Gabarito: CERTO / ERRADO ── */
.cc-gabarito {
  text-align: center;
  margin: 16px 0 10px;
}
.cc-gabarito-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #475569;
  margin-bottom: 6px;
}
.cc-resposta {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.1em;
}
.cc-resposta.certo  { color: #4ade80; }
.cc-resposta.errado { color: #f87171; }

/* ── Embasamento ── */
.cc-embasamento {
  font-size: 14px;
  line-height: 1.7;
  color: #fde68a;
  background: #1a1500;
  border: 1px solid #ca8a04;
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 14px;
  text-align: justify;
}

/* ── Saiba mais (hint) ── */
.cc-saiba-mais {
  text-align: center;
  margin: 14px auto 0;
  width: fit-content;
}
.cc-saiba-mais a {
  font-size: 13px;
  color: #94a3b8;
  text-decoration: none;
  background: #12192b;
  border: 1px solid #1e2d4d;
  border-radius: 20px;
  padding: 5px 16px;
  display: inline-block;
}

/* ── Rodapé ── */
.cc-rodape {
  margin-top: 20px;
  text-align: center;
  font-size: 11px;
  color: #334155;
}
.cc-rodape a {
  color: #3b6ff5;
  text-decoration: none;
}
"""

# Prefixo _ é convenção Anki para media files geradas por add-ons/scripts
LOGO_REF = "_CaveiraCards.png"

FRENTE = f"""
<div class="cc-header">
  <img class="cc-logo" src="{LOGO_REF}" alt="CaveiraCards">
  <span class="cc-materia-texto">{{{{MATÉRIA}}}}</span>
</div>

{{{{#Assunto > Tópico}}}}
<div class="cc-assunto">{{{{Assunto > Tópico}}}}</div>
{{{{/Assunto > Tópico}}}}

<div class="cc-afirmacao">
  {{{{Afirmação}}}}
  {{{{#✚ Dica}}}}<div class="cc-dica">{{{{hint:✚ Dica}}}}</div>{{{{/✚ Dica}}}}
</div>
"""

VERSO = f"""
{{{{FrontSide}}}}

<div class="cc-gabarito">
  <div class="cc-gabarito-label">Gabarito</div>
  <div id="resposta" class="cc-resposta">{{{{Certo - Errado}}}}</div>
</div>

<script>
(function () {{
  var el = document.getElementById("resposta");
  if (!el) return;
  var v = el.textContent.trim().toLowerCase();
  if (v === "certo")  {{ el.textContent = "CERTO";  el.classList.add("certo");  }}
  if (v === "errado") {{ el.textContent = "ERRADO"; el.classList.add("errado"); }}
}})();
</script>

{{{{#Embasamento}}}}
<div class="cc-embasamento">{{{{Embasamento}}}}</div>
{{{{/Embasamento}}}}

{{{{#✚ Saiba mais}}}}
<div class="cc-saiba-mais">{{{{hint:✚ Saiba mais}}}}</div>
{{{{/✚ Saiba mais}}}}

<div class="cc-rodape">
  Erro? <a href="https://www.instagram.com/isakielsouza/">@isakielsouza</a>
  &nbsp;·&nbsp; <a href="https://www.isakielsouza.com">isakielsouza.com</a>
</div>
"""

modelo = genanki.Model(
    MODEL_ID,
    "CaveiraCards — Certo/Errado",
    fields=[
        {"name": "MATÉRIA"},
        {"name": "Assunto > Tópico"},
        {"name": "Afirmação"},
        {"name": "✚ Dica"},
        {"name": "Certo - Errado"},
        {"name": "Embasamento"},
        {"name": "✚ Saiba mais"},
    ],
    templates=[
        {
            "name": "CaveiraCards — Certo/Errado",
            "qfmt": FRENTE,
            "afmt": VERSO,
        }
    ],
    css=CSS,
)

deck = genanki.Deck(DECK_ID, "CaveiraCards — Certo/Errado")

# Caminho absoluto para o logo (relativo a este script)
script_dir = os.path.dirname(os.path.abspath(__file__))
logo_path = os.path.join(script_dir, "..", "caveira-cards", "CaveiraCards.png")

pacote = genanki.Package(deck)
pacote.media_files = [logo_path]
pacote.write_to_file("CaveiraCards-CertoErrado.apkg")
print("✓ CaveiraCards-CertoErrado.apkg gerado com sucesso!")
print(f"  Logo embutida: {logo_path}")
```

- [ ] **Step 2: Verificar que o logo existe no caminho esperado**

```bash
ls /home/isakiel/projects/sistema-estudo-concursos/extensao-caveira-cards/caveira-cards/CaveiraCards.png
```

Esperado: arquivo existe (`PNG image data, 128 x 128`)

- [ ] **Step 3: Instalar genanki se necessário**

```bash
pip install genanki --quiet 2>&1 | tail -1
```

Esperado: `Successfully installed genanki-X.X.X` ou `Requirement already satisfied`

- [ ] **Step 4: Executar o script para gerar o .apkg**

```bash
cd /home/isakiel/projects/sistema-estudo-concursos/extensao-caveira-cards/anki-addon && python3 gerar-apkg-certo-errado.py
```

Esperado:
```
✓ CaveiraCards-CertoErrado.apkg gerado com sucesso!
  Logo embutida: .../caveira-cards/CaveiraCards.png
```

- [ ] **Step 5: Verificar que o .apkg foi gerado e tem tamanho razoável**

```bash
ls -lh /home/isakiel/projects/sistema-estudo-concursos/extensao-caveira-cards/anki-addon/CaveiraCards-CertoErrado.apkg
```

Esperado: arquivo existe com tamanho > 10KB (para confirmar que o logo foi embutido)

- [ ] **Step 6: Commit do script (não do .apkg gerado)**

```bash
cd /home/isakiel/projects/sistema-estudo-concursos/extensao-caveira-cards
git add anki-addon/gerar-apkg-certo-errado.py
git commit -m "feat: script para gerar .apkg dark theme Certo/Errado com logo CaveiraCards"
```
