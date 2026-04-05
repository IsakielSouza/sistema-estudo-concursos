# CaveiraCards — Design Spec

**Data:** 2026-04-04
**Autor:** @isakielsouza
**Status:** Aprovado

---

## Visão Geral

Extensão única para o Google Chrome que integra múltiplas plataformas de questões de concursos com o Anki. O usuário instala uma única extensão da Chrome Web Store e ela funciona automaticamente em todos os sites suportados, capturando questões erradas e acertadas e enviando para baralhos organizados no Anki via AnkiConnect.

---

## Arquitetura

### Abordagem: Dispatcher Central com Módulos por Site

Um único `content.js` é injetado em todos os sites suportados. Ele detecta a URL atual e carrega dinamicamente o módulo correspondente ao site. A lógica de envio ao Anki e montagem do card é compartilhada entre todos os módulos.

### Estrutura de Arquivos

```
caveira-cards/
├── manifest.json              ← Manifest V3, todos os sites declarados
├── background.js              ← Service worker mínimo
├── content.js                 ← Dispatcher: detecta site, carrega módulo
│
├── shared/
│   ├── anki.js                ← Toda comunicação com AnkiConnect (localhost:8765)
│   ├── card-builder.js        ← Monta HTML da frente/verso do card
│   └── overlay.css            ← CSS do botão flutuante unificado
│
├── sites/
│   ├── tec.js                 ← Lógica específica do TEC Concursos
│   ├── gran.js                ← Lógica específica do Gran Questões
│   └── qconcurso.js           ← Futuro (QConcurso)
│
├── popup.html                 ← Painel: todas as plataformas + links
├── doacao.html                ← Página de doação com PIX + QR Code
├── guia.html                  ← Guia de instalação do AnkiConnect
│
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Interface Padrão dos Módulos

Cada arquivo em `/sites/` deve expor `window.CaveiraCardsAdapter`:

```js
window.CaveiraCardsAdapter = {
  nomePlataforma: "TEC Concursos",
  deckBase: "CaveiraCards::TEC Concursos",
  modelName: "CaveiraCards",
  tags: ["tec-concursos", "caveira-cards"],
  detectarErro: () => Boolean,      // retorna true se há questão errada na tela
  detectarAcerto: () => Boolean,    // retorna true se há questão acertada na tela
  capturarQuestao: () => Object,    // retorna dados padronizados da questão
}
```

---

## Fluxo de Dados

```
Site de questões
      │
      ▼
content.js (dispatcher)
  ├── detecta URL → carrega sites/tec.js ou sites/gran.js
  └── MutationObserver observa mudanças no DOM
            │
            ▼ questão respondida detectada
      módulo do site
        └── capturarQuestao() → objeto padronizado:
            {
              enunciado, alternativas,
              idxCorreta, idxErrada,
              materia, materiaLimpa,
              banca, assunto,
              resultado,   ← "errou" | "acertou"
              url, timestamp,
              plataforma
            }
            │
            ▼
      card-builder.js
        └── montarCard(questao) → { frente: HTML, verso: HTML }
            │
            ▼
      Botão flutuante aparece (overlay)
        └── usuário clica "Adicionar ao Anki"
            │
            ▼
      anki.js
        ├── createDeck("CaveiraCards")
        ├── createDeck("CaveiraCards::TEC Concursos")
        ├── createDeck("CaveiraCards::TEC Concursos::Erros")
        ├── createDeck("CaveiraCards::TEC Concursos::Erros::Direito Constitucional")
        └── addNote(modelName: "CaveiraCards", frente, verso, tags)
```

---

## Estrutura de Baralhos no Anki

| Situação | Deck | Note Type |
|---|---|---|
| Errou - TEC | `CaveiraCards::TEC Concursos::Erros::<Matéria>` | `CaveiraCards` |
| Acertou - TEC | `CaveiraCards::TEC Concursos::Revisão::<Matéria>` | `CaveiraCards` |
| Errou - Gran | `CaveiraCards::Gran Questões::Erros::<Matéria>` | `CaveiraCards` |
| Acertou - Gran | `CaveiraCards::Gran Questões::Revisão::<Matéria>` | `CaveiraCards` |
| Errou - QConcurso | `CaveiraCards::QConcurso::Erros::<Matéria>` | `CaveiraCards` |
| Acertou - QConcurso | `CaveiraCards::QConcurso::Revisão::<Matéria>` | `CaveiraCards` |

**Tags automáticas por card:** `caveira-cards`, `caderno-de-erros` ou `revisao`, nome da plataforma (ex: `tec-concursos`), matéria formatada (ex: `direito-constitucional`).

---

## Botão Flutuante (Overlay)

### Comportamento

1. Questão respondida detectada → botão completo aparece no canto da tela
   - Errou: destaque vermelho sutil
   - Acertou: destaque verde sutil
2. Após 5 segundos → minimiza para ícone redondo com logo da caveira
3. Usuário clica no ícone → expande de volta com informações completas
4. Usuário envia para Anki → mostra "Adicionado! ✓" → minimiza para ícone (permanece na tela)
5. Só desaparece quando usuário clica no **X** explicitamente

---

## Popup da Extensão

Painel de 280px, tema escuro, exibindo:

- Logo CaveiraCards + `@isakielsouza`
- Lista de plataformas suportadas com indicador ATIVO (verde) / inativo (cinza) baseado na URL da aba atual
  - TEC Concursos
  - Gran Questões
  - QConcurso (em breve)
- Botão: Guia de instalação
- Botão: Apoiar o projeto (abre `doacao.html`)

---

## Página de Doação (`doacao.html`)

### Tela inicial
- Logo CaveiraCards (caveira) centralizado
- Nome: CaveiraCards / @isakielsouza
- Texto: "Se a extensão te ajudou, considere uma contribuição."
- Botões PIX:
  - Fazer PIX — R$ 2,00
  - Fazer PIX — R$ 3,00
  - Fazer PIX — R$ 5,00

### Tela após selecionar valor
- Botão "← Voltar"
- QR Code gerado dinamicamente via `qrcode.js` com payload PIX EMV padrão
- Valor selecionado em destaque
- Chave PIX: `isakielsouza@outlook.com.br`
- Botão "📋 Copiar chave PIX"

---

## Identidade Visual

| Item | Valor |
|---|---|
| Nome da extensão | CaveiraCards |
| Autor | @isakielsouza |
| PIX | isakielsouza@outlook.com.br |
| Logo | CaveiraCards.png (caveira) |
| Note Type Anki | CaveiraCards |
| Referências removidas | @concurseiroti2025, TEC Concursos → Anki, Gran Questões → Anki |

---

## Sites Suportados (v1.0)

| Site | Status | Arquivo |
|---|---|---|
| TEC Concursos (`tecconcursos.com.br`) | Implementado | `sites/tec.js` |
| Gran Questões (`grancursosonline.com.br`) | Implementado | `sites/gran.js` |
| QConcurso (`qconcursos.com`) | Próxima versão | `sites/qconcurso.js` |

---

## Manifest (host_permissions)

```json
{
  "manifest_version": 3,
  "name": "CaveiraCards",
  "version": "1.0.0",
  "description": "Integração com plataformas de questões e Anki — TEC Concursos, Gran Questões e mais.",
  "author": "@isakielsouza",
  "permissions": ["activeTab", "storage", "notifications", "tabs"],
  "host_permissions": [
    "https://www.tecconcursos.com.br/*",
    "https://*.grancursosonline.com.br/*",
    "https://www.qconcursos.com/*",
    "http://localhost:8765/*"
  ]
}
```

---

## Fora do Escopo (v1.0)

- Integração com QConcurso (próxima versão)
- Sincronização com backend/nuvem
- Estatísticas de desempenho por plataforma
- Suporte a outros navegadores (Firefox, Edge)
