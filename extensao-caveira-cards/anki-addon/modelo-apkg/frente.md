{{Frente}}

<script>
(function () {
  /* ── 1. Limpeza agressiva de cores (TEC Concursos) ── */
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
  document.body.style.color = '#e2e8f0';

  /* ── 2. Interatividade: Texto Associado colapsável ── */
  document.querySelectorAll('.cc-texto-associado-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var wrap = this.parentElement;
      var content = wrap.querySelector('.cc-texto-associado-content');
      var isExpandido = wrap.classList.toggle('expandido');
      content.style.display = isExpandido ? 'block' : 'none';
    });
  });

  /* ── 3. Interatividade: Clique na Alternativa ── */
  // Se houver .cc-alts-verso, estamos no verso (re-render) -> não adiciona clique
  if (document.querySelector('.cc-alts-verso')) return;

  var container = document.querySelector('.cc-alts-frente');
  if (!container) return;

  var corretaIdx = parseInt(container.getAttribute('data-correta') || '-1', 10);
  var alts       = Array.from(container.querySelectorAll('.cc-alt'));
  var respondido = false;

  alts.forEach(function (alt, i) {
    alt.addEventListener('click', function () {
      if (respondido) return;
      respondido = true;

      var acertou = (i === corretaIdx);

      // Aplica classes visuais
      alts.forEach(function (a, j) {
        a.classList.remove('cc-clicavel');
        if (j === corretaIdx) {
          a.classList.add('correta');
          var l = a.querySelector('.cc-letra');
          if (l) l.textContent = '\u2713'; // ✓
        } else if (j === i && !acertou) {
          a.classList.add('errada');
          var l = a.querySelector('.cc-letra');
          if (l) l.textContent = '\u2717'; // ✗
        }
      });

      // Feedback textual
      var dica = document.getElementById('cc-dica-feedback');
      if (dica) {
        dica.textContent = acertou
          ? '\u2705 Você acertou! Boa!'
          : '\u274C Você errou — veja o gabarito no verso';
        dica.className = 'cc-dica ' + (acertou ? 'acertou' : 'errou');
      }

      // Navega para o verso
      setTimeout(function () {
        try { pycmd('ans'); } catch (e) {}
      }, 900);
    });
  });
})();
</script>
