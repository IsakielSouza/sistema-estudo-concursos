{{Frente}}

<script>

(function () {

  /* ── Corrige inline colors do conteúdo da plataforma ── */

  var fixar = ['.cc-enunciado', '.cc-explicacao-corpo', '.cc-comentario'];

  fixar.forEach(function(sel) {

    document.querySelectorAll(sel + ', ' + sel + ' *').forEach(function(el) {

      if (![el.style](http://el.style)) return;

      [el.style](http://el.style).removeProperty('color');

      [el.style](http://el.style).removeProperty('background');

      [el.style](http://el.style).removeProperty('background-color');

      [el.style](http://el.style).removeProperty('font-family');

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