{{Verso}}

<script>

(function () {

  /* ── Corrige inline colors no verso também ── */

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

