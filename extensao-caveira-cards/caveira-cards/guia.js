// guia.js — lógica do guia de instalação CaveiraCards
document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const texto = document.getElementById(targetId).innerText.trim();
    navigator.clipboard.writeText(texto).then(() => {
      btn.textContent = "Copiado!";
      btn.classList.add("copiado");
      setTimeout(() => {
        btn.textContent = "Copiar";
        btn.classList.remove("copiado");
      }, 2000);
    });
  });
});
