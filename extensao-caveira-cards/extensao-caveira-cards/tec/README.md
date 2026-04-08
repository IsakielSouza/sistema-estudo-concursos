<div align="center">

# 📚 TEC Concursos → Anki
### Caderno de Erros Automático

![Badge](https://img.shields.io/badge/versão-1.0.0-3b6ff5?style=for-the-badge)
![Badge](https://img.shields.io/badge/Edge-Compatible-0078d4?style=for-the-badge&logo=microsoftedge)
![Badge](https://img.shields.io/badge/Chrome-Compatible-4285F4?style=for-the-badge&logo=googlechrome)
![Badge](https://img.shields.io/badge/Anki-Required-eb5757?style=for-the-badge)

**Extensão para Chrome/Edge que captura automaticamente as questões que você erra no TEC Concursos e cria cards no Anki — organizados por matéria.**

[Instalação](#-instalação) • [Como usar](#-como-usar) • [Funcionalidades](#-funcionalidades) • [Screenshots](#-screenshots)

---

</div>

## ✨ Funcionalidades

- 🔴 **Detecta automaticamente** quando você erra uma questão no TEC Concursos
- 📚 **Botão flutuante** aparece com o nome da matéria
- 🗂️ **Cria sub-baralhos por matéria** automaticamente (`Caderno de Erros::TEC Concursos::Matemática`)
- ✅ **Verso do card** mostra a alternativa correta em verde e a que você marcou em vermelho
- 💡 **Comentário/resolução** incluído no card quando disponível
- 🔗 **Link direto** para a questão original no TEC Concursos
- 🏷️ **Tags automáticas** por matéria para facilitar filtros

---

## 📋 Pré-requisitos

Antes de instalar a extensão, você precisa de:

| Requisito | Link |
|-----------|------|
| Anki instalado | [ankiweb.net](https://apps.ankiweb.net) |
| Add-on AnkiConnect | Código: `2055492159` |
| Conta no TEC Concursos | [tecconcursos.com.br](https://www.tecconcursos.com.br) |

---

## 🚀 Instalação

### 1. Instalar o AnkiConnect

No Anki, vá em **Ferramentas → Add-ons → Obter add-ons**, cole o código abaixo e reinicie:

```
2055492159
```

### 2. Configurar o AnkiConnect

Vá em **Ferramentas → Add-ons → AnkiConnect → Config** e substitua pelo JSON abaixo:

```json
{
  "apiKey": null,
  "apiLogPath": null,
  "ignoreOriginList": [
    "https://www.tecconcursos.com.br"
  ],
  "webBindAddress": "127.0.0.1",
  "webBindPort": 8765,
  "webCorsOriginList": [
    "http://localhost",
    "https://www.tecconcursos.com.br"
  ]
}
```

Clique OK e reinicie o Anki.

### 3. Criar o baralho

No Anki, clique em **Criar Baralho** e digite exatamente:

```
Caderno de Erros::TEC Concursos
```

### 4. Criar o modelo de nota

Vá em **Ferramentas → Gerenciar Tipos de Nota → Adicionar → Clonar tipo existente (Básico)**

Nome: `TEC CONCURSOS`

Confirme que os campos são: `Frente`, `Verso` e `Extra`.

### 5. Instalar a extensão

**Chrome / Edge:**
1. Baixe ou clone este repositório
2. Acesse `chrome://extensions` ou `edge://extensions`
3. Ative o **Modo desenvolvedor**
4. Clique em **Carregar sem compactação**
5. Selecione a pasta `extensao-chrome`

---

## 📖 Como usar

1. Deixe o **Anki aberto** em segundo plano
2. Acesse o **TEC Concursos** normalmente
3. Responda questões
4. Ao **errar**, um botão aparece no canto inferior direito:

```
┌──────────────────────────────┐
│ 📚  Adicionar ao Anki      ✕ │
│     Língua Portuguesa        │
└──────────────────────────────┘
```

5. Clique → card criado no Anki ✓

---

## 🃏 Estrutura do card

**Frente**
- Tag com a matéria e assunto
- Enunciado completo da questão
- Alternativas A B C D E

**Verso**
- ✅ Alternativa correta destacada em verde
- ❌ Alternativa que você marcou em vermelho
- 💡 Comentário/resolução (se disponível)
- 🔗 Link para a questão no TEC

---

## 🗂️ Estrutura dos arquivos

```
extensao-chrome/
├── manifest.json      # Configuração da extensão
├── content.js         # Detecta erros e envia ao Anki
├── overlay.css        # Estilo do botão flutuante
├── background.js      # Service worker
├── popup.html         # Popup da extensão
└── guia.html          # Guia de instalação interativo
```

---

## ⚠️ Solução de problemas

| Problema | Solução |
|----------|---------|
| Botão não aparece | Verifique se a extensão está ativa em `edge://extensions` |
| "Anki fechado!" | Abra o Anki antes de estudar |
| "deck was not found" | Crie o baralho `Caderno de Erros::TEC Concursos` manualmente |
| "model was not found" | Crie o modelo `TEC CONCURSOS` com os campos Frente, Verso e Extra |
| Erro de CORS | Verifique a configuração do AnkiConnect |

---

## 🔧 Tecnologias

- **JavaScript** — Extensão do navegador (content script)
- **HTML/CSS** — Interface do botão e guia de instalação
- **AnkiConnect API** — Comunicação com o Anki via REST

---

## 📄 Licença

MIT — use, modifique e distribua à vontade, mantendo os créditos.

---

<div align="center">

Desenvolvido por **[@JacquesDouglas10](https://github.com/JacquesDouglas10)** • **@concurseiroti2025**

</div>
