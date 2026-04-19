# Design: Registrar questões respondidas no histórico da sessão ao responder

## Problema

Atualmente os contadores de sessão (`questoes`, `acertos`, `detalhes`) são incrementados dentro de `enviarParaAnki()` em `content.js`. Isso significa que questões respondidas mas não enviadas ao Anki nunca são contabilizadas no histórico da sessão.

## Objetivo

Registrar toda questão respondida no histórico da sessão imediatamente ao exibir o overlay — independentemente de o usuário enviar para o Anki.

Regra de negócio:
- Total = todas as questões respondidas (certas + erradas)
- Acertos = questões com `resultado !== "Erros"`

## Solução — Opção A (escolhida)

Mover o bloco de incremento de contadores de `enviarParaAnki()` para `mostrarOverlay()`.

### Mudança em `mostrarOverlay(questao)` — content.js ~linha 448

Substituir o bloco que só atualizava `ultimaAtividade` por:

```js
chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
  if (sessaoAtiva && sessaoAtiva.ativa) {
    const agora = Date.now();
    const ultimaAtividade = sessaoAtiva.ultimaAtividade || sessaoAtiva.inicio;

    sessaoAtiva.questoes = (sessaoAtiva.questoes || 0) + 1;
    if (questao.resultado !== "Erros") {
      sessaoAtiva.acertos = (sessaoAtiva.acertos || 0) + 1;
    }
    if (!sessaoAtiva.detalhes) sessaoAtiva.detalhes = [];
    sessaoAtiva.detalhes.push({
      materia: questao.materia,
      resultado: questao.resultado,
      tempoGastoMs: agora - ultimaAtividade,
      timestamp: agora
    });
    sessaoAtiva.ultimaAtividade = agora;
    chrome.storage.local.set({ sessaoAtiva });
  }
});
```

### Mudança em `enviarParaAnki(questao)` — content.js ~linha 755

Remover todo o bloco de incremento de contadores (questoes, acertos, detalhes, ultimaAtividade). Manter apenas a lógica de envio ao Anki.

## Arquivos afetados

- `extensao-caveira-cards/caveira-cards/content.js`

## Sem impacto em

- Adapters de plataformas (nenhum adapter precisa mudar)
- `background.js`, `popup.js`, `sessoes.js`, `detalhes-sessao.js`
- Estrutura do objeto `sessaoAtiva` no storage (sem mudança de schema)
