{{Frente}}

<hr id="answer">

{{Verso}}

<script>
(function () {
  /* ── Destaca a resposta correta automaticamente no Verso ── */
  var container = document.querySelector('.cc-alts-frente');
  if (container) {
    var corretaIdx = parseInt(container.getAttribute('data-correta') || '-1', 10);
    var alts = container.querySelectorAll('.cc-alt');
    if (alts[corretaIdx]) {
      alts[corretaIdx].classList.add('correta');
      var letra = alts[corretaIdx].querySelector('.cc-letra');
      if (letra) letra.textContent = '\u2713';
      alts.forEach(function(a) { a.classList.remove('cc-clicavel'); });
    }
  }

  /* ── Corrige inline colors no verso também ── */
  var fixar = ['.cc-enunciado', '.cc-explicacao-corpo', '.cc-comentario', '.cc-alt-texto', '.comando'];
  fixar.forEach(function(sel) {
    document.querySelectorAll(sel + ', ' + sel + ' *').forEach(function(el) {
      if (!el.style) return;
      el.style.setProperty('color', '#e2e8f0', 'important');
      el.style.setProperty('background', 'transparent', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.removeProperty('font-family');
    });
  });
  // Limpa também cores obsoletas de tags <font color="black">
  document.querySelectorAll('font').forEach(function(el) {
    el.removeAttribute('color');
    el.style.color = '#e2e8f0';
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


```
		<p>Criado por: <a href="https://www.instagram.com/isakielsouza/"/>@isakielsouza</a> <br> <a href="https://www.isakielsouza.com"/>www.isakielsouza.com</a>
```

[Avisos de direitos autorais](https://www.copyrightservice.net/pt/copyright_notice)

