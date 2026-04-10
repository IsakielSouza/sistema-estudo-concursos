{{Verso}}

<script>
(function () {
  /* ── 1. Destaca a resposta correta automaticamente no Verso ── */
  var container = document.querySelector('.cc-alts-frente');
  if (container) {
    var corretaIdx = parseInt(container.getAttribute('data-correta') || '-1', 10);
    var alts       = container.querySelectorAll('.cc-alt');
    if (alts[corretaIdx]) {
      alts[corretaIdx].classList.add('correta');
      var letra = alts[corretaIdx].querySelector('.cc-letra');
      if (letra) letra.textContent = '\u2713';
      alts.forEach(function(a) { a.classList.remove('cc-clicavel'); });
    }
  }

  /* ── 2. Limpeza de cores no verso também ── */
  var containers = document.querySelectorAll('.card, .cc-enunciado, .cc-alt-texto, .comando');
  containers.forEach(function(c) {
    c.querySelectorAll('*').forEach(function(el) {
      if (!el.style) return;
      if (el.style.color || el.getAttribute('color')) {
        el.style.setProperty('color', '#e2e8f0', 'important');
      }
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.removeProperty('font-family');
    });
  });
})();
</script>

{{#Extra}}
<div class="cc-wrap" style="padding-top:0">
  <div class="extra-box">
    <div class="extra-label">💬 Comentários</div>
    {{Extra}}
  </div>
</div>
{{/Extra}}
