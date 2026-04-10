{{Frente}}

<script>

(function () {

  /* ── Corrige inline colors do conteúdo da plataforma ── */
  var containers = document.querySelectorAll('.card, .cc-enunciado, .cc-alt-texto, .comando');
  containers.forEach(function(c) {
    c.querySelectorAll('*').forEach(function(el) {
      if (!el.style) return;
      // Força texto claro em tudo se houver estilo de cor inline
      if (el.style.color || el.getAttribute('color')) {
        el.style.setProperty('color', '#e2e8f0', 'important');
      }
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.removeProperty('font-family');
    });
  });
  // Reset adicional para o corpo do card
  document.body.style.color = '#e2e8f0';

  /* ── Interatividade: Texto Associado colapsável ── */
  document.querySelectorAll('.cc-texto-associado-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var wrap = this.parentElement;
      var content = wrap.querySelector('.cc-texto-associado-content');
      var isExpandido = wrap.classList.toggle('expandido');
      content.style.display = isExpandido ? 'block' : 'none';
    });
  });

  /* ── Interatividade: clique na alternativa ── */

  if (document.querySelector('.cc-alts-verso')) return;

  var container = document.querySelector('.cc-alts-frente');

  if (!container) return;

  var corretaIdx = parseInt(container.getAttribute('data-correta') || '-1', 10);

  var alts = Array.from(container.querySelectorAll('.cc-alt'));

  var respondido = false;

  alts.forEach(function (alt, i) {

    alt.addEventListener('click', function () {

      if (respondido) return;

      respondido = true;

      var acertou = (i === corretaIdx);

      alts.forEach(function (a, j) {

        a.classList.remove('cc-clicavel');

        if (j === corretaIdx) {

          a.classList.add('correta');

          a.querySelector('.cc-letra').textContent = '\u2713';

        } else if (j === i && !acertou) {

          a.classList.add('errada');

          a.querySelector('.cc-letra').textContent = '\u2717';

        }

      });

      var dica = document.getElementById('cc-dica-feedback');

      if (dica) {

        dica.textContent = acertou

          ? '\u2705 Você acertou! Boa!'

          : '\u274C Você errou — veja o gabarito no verso';

        dica.className = 'cc-dica ' + (acertou ? 'acertou' : 'errou');

      }

      setTimeout(function () {

        try { pycmd('ans'); } catch (e) {}

      }, 900);

    });

  });

})();

</script>