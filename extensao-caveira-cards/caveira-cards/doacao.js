// doacao.js — lógica da página de doação
// Script externo obrigatório no MV3 (inline scripts são bloqueados pelo CSP)

document.getElementById("btn-doar").addEventListener("click", () => {
  chrome.tabs.create({
    url: "https://nubank.com.br/cobrar/xafk/69d323b5-c073-4814-ad58-8997939f27a7"
  });
});
