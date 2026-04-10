"""
Gera CaveiraCards.apkg — modelo principal usado pela extensão.
Execute: python3 gerar-apkg.py
"""
import genanki
import os
import shutil

# IDs fixos — NUNCA ALTERE (gera conflitos no Anki)
MODEL_ID = 1747382910
DECK_ID  = 1747382911

# Nome do Deck que será criado na importação
DECK_NAME = "CaveiraCards"

script_dir = os.path.dirname(os.path.abspath(__file__))
modelo_dir = os.path.join(script_dir, "modelo-apkg")

def ler_arquivo(nome):
    caminho = os.path.join(modelo_dir, nome)
    # Tenta variações de Case (Verso.md vs verso.md)
    if not os.path.exists(caminho):
        caminho = os.path.join(modelo_dir, "Verso.md" if nome.lower() == "verso.md" else nome)
    if not os.path.exists(caminho):
        caminho = os.path.join(modelo_dir, nome.lower())
        
    with open(caminho, 'r', encoding='utf-8') as f:
        return f.read()

try:
    CSS = ler_arquivo("estilo.md")
    FRONT = ler_arquivo("frente.md")
    BACK = ler_arquivo("Verso.md")
    print("✓ Arquivos de modelo (.md) carregados.")
except Exception as e:
    print(f"Erro ao ler arquivos .md: {e}")
    exit(1)

# Cria o Modelo
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

# Cria o Deck
deck = genanki.Deck(DECK_ID, DECK_NAME)

# Adiciona uma nota de exemplo para garantir que o deck e o modelo sejam criados na importação
exemplo_nota = genanki.Note(
    model=modelo,
    fields=[
        "<h1>Questão de Exemplo</h1><p>Se você está vendo isso, o modelo foi importado com sucesso!</p>",
        "<p>O gabarito aparecerá aqui.</p>",
        "Exemplo de comentário extra."
    ]
)
deck.add_note(exemplo_nota)

# Gerar o Pacote (.apkg)
pacote = genanki.Package(deck)

# Tenta incluir a logo se existir
logo_src = os.path.join(script_dir, "..", "logo.png") # Tentando .png que é mais comum
if not os.path.exists(logo_src):
    logo_src = os.path.join(script_dir, "..", "logo.ico")

if os.path.exists(logo_src):
    logo_dest = os.path.join(script_dir, "_CaveiraCards_logo" + os.path.splitext(logo_src)[1])
    shutil.copy(logo_src, logo_dest)
    pacote.media_files = [logo_dest]
    print(f"✓ Logo incluída: {os.path.basename(logo_dest)}")

output_path = os.path.join(script_dir, "CaveiraCards.apkg")
pacote.write_to_file(output_path)

if 'logo_dest' in locals() and os.path.exists(logo_dest):
    os.remove(logo_dest)

print(f"\n🚀 SUCESSO! Arquivo gerado em: {output_path}")
print(f"👉 Agora importe este arquivo no Anki para atualizar o modelo e criar o deck '{DECK_NAME}'.")
