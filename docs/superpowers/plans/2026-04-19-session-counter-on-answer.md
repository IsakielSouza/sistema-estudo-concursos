# Session Counter on Answer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover o incremento dos contadores de sessão (`questoes`, `acertos`, `detalhes`) para `mostrarOverlay()`, registrando toda questão respondida independentemente de envio ao Anki.

**Architecture:** Única mudança em `content.js` — o bloco de storage que hoje vive em `enviarParaAnki()` é movido para `mostrarOverlay()`, onde já existe um bloco de atualização de `ultimaAtividade`. Os dois blocos se fundem em um só. `enviarParaAnki()` fica sem lógica de sessão.

**Tech Stack:** JavaScript (browser extension content script), `chrome.storage.local`

---

### Task 1: Atualizar `mostrarOverlay()` para registrar a questão na sessão

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/content.js:448-458`

O bloco atual (linhas ~448–457) só atualiza `ultimaAtividade`. Substituí-lo pelo bloco completo que também incrementa contadores.

**Bloco ATUAL a remover:**

```js
// Registra que houve atividade agora
if (contextoValido()) {
  try {
    chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
      if (sessaoAtiva && sessaoAtiva.ativa) {
        sessaoAtiva.ultimaAtividade = Date.now();
        chrome.storage.local.set({ sessaoAtiva });
      }
    });
  } catch { /* contexto inválido — ignora */ }
}
```

**Bloco NOVO a colocar no lugar:**

```js
// Registra questão respondida e atualiza atividade
if (contextoValido()) {
  try {
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
  } catch { /* contexto inválido — ignora */ }
}
```

- [ ] **Step 1: Localizar o bloco atual em `mostrarOverlay()`**

Abrir `extensao-caveira-cards/caveira-cards/content.js` e localizar o comentário `// Registra que houve atividade agora` (por volta da linha 447). Confirmar que o bloco imediatamente abaixo é o `get("sessaoAtiva")` que apenas atualiza `ultimaAtividade`.

- [ ] **Step 2: Substituir o bloco**

Substituir o bloco de 9 linhas descrito acima ("Bloco ATUAL") pelo "Bloco NOVO" (16 linhas).

- [ ] **Step 3: Verificar visualmente que `questao` está em escopo**

Confirmar que `mostrarOverlay(questao)` recebe `questao` como parâmetro (linha ~415 — `async function mostrarOverlay(questao)`). O parâmetro `questao` deve estar acessível no novo bloco sem alterações adicionais.

---

### Task 2: Remover bloco de contadores de `enviarParaAnki()`

**Files:**
- Modify: `extensao-caveira-cards/caveira-cards/content.js:754-783`

**Bloco a remover inteiro (linhas ~754–783):**

```js
// ── Incrementar contadores da sessão ativa ──
if (contextoValido()) {
  try {
    chrome.storage.local.get("sessaoAtiva", ({ sessaoAtiva }) => {
      if (sessaoAtiva && sessaoAtiva.ativa) {
        const agora = Date.now();
        const ultimaAtividade = sessaoAtiva.ultimaAtividade || sessaoAtiva.inicio;
        
        // Dados da questão atual
        const detalheQuestao = {
          materia: questao.materia,
          resultado: questao.resultado,
          tempoGastoMs: agora - ultimaAtividade,
          timestamp: agora
        };

        sessaoAtiva.questoes = (sessaoAtiva.questoes || 0) + 1;
        if (questao.resultado !== "Erros") {
          sessaoAtiva.acertos = (sessaoAtiva.acertos || 0) + 1;
        }
        
        if (!sessaoAtiva.detalhes) sessaoAtiva.detalhes = [];
        sessaoAtiva.detalhes.push(detalheQuestao);
        
        sessaoAtiva.ultimaAtividade = agora;
        chrome.storage.local.set({ sessaoAtiva });
      }
    });
  } catch { /* contexto inválido — ignora */ }
}
```

- [ ] **Step 1: Localizar o bloco em `enviarParaAnki()`**

Localizar o comentário `// ── Incrementar contadores da sessão ativa ──` dentro de `enviarParaAnki()`. Confirmar que começa após `noteIdAtual = noteId` e o bloco `autoCapturarComentarios`.

- [ ] **Step 2: Deletar o bloco inteiro**

Remover as ~30 linhas do bloco (do comentário `// ── Incrementar contadores` até o `catch` de fechamento inclusive).

- [ ] **Step 3: Verificar que `enviarParaAnki` não ficou com linhas soltas**

Confirmar que após a remoção, o `try` de `enviarParaAnki` termina limpo no bloco `catch (err)` de erro de envio. Nenhuma chave `{` ou `}` órfã.

---

### Task 3: Teste manual e commit

- [ ] **Step 1: Recarregar a extensão no Chrome**

Abrir `chrome://extensions` → localizar CaveiraCards → clicar em "Atualizar" (ícone de reload). Confirmar que não aparece erro de sintaxe na aba.

- [ ] **Step 2: Testar fluxo sem enviar ao Anki**

1. Abrir uma plataforma suportada (ex: TEC Concursos ou Gran Questões)
2. Responder uma questão — o overlay deve aparecer
3. Fechar o overlay com ✕ **sem clicar para enviar ao Anki**
4. Abrir o popup da extensão → verificar se `sessaoAtiva.questoes` foi incrementado

Para verificar no DevTools:
```js
chrome.storage.local.get("sessaoAtiva", console.log)
```
Executar no console da página. Esperado: `questoes: 1`, `acertos: 0` ou `1` conforme o resultado.

- [ ] **Step 3: Testar fluxo com envio ao Anki**

1. Responder outra questão
2. Clicar no overlay para enviar ao Anki
3. Verificar novamente:
```js
chrome.storage.local.get("sessaoAtiva", console.log)
```
Esperado: `questoes` incrementou mais 1, `detalhes` tem 2 entradas.

- [ ] **Step 4: Confirmar que não há dupla contagem**

Ao enviar ao Anki, `questoes` deve ter aumentado **1** (registrado em `mostrarOverlay`), não **2**. Enviar uma questão e verificar que o total bate.

- [ ] **Step 5: Commit**

```bash
git add extensao-caveira-cards/caveira-cards/content.js
git commit -m "refactor: register answered questions in session history on overlay show, not on Anki send"
```
