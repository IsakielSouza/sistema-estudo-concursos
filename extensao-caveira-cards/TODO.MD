- [x] Por padrão para todos sites deve salvar comentario do professor!

Feature nova:
[x] salvar comentários dos alunos de forma manual
[x] ao acessar site e marcar a questao como relevante (gostei), esse comentario ser enviado para anki
[x] e usuario clicar em um ou 10 comentarios deve ser enviado no click do like!
[x] abaixo do butão de sessão na tela principal da extensão mostrar toggle de ativar/desativar comentários manual
[x] forma automática deve salvar ate 5 comentários de alunos, os mais relevantes conforme numero de likes (gostei).

Checklist sites:
[x] - Tec
[x] - QConcurso
[x] - Projeto Caveira

Site TEC:
Butão com like:
<button class="discussao-comentario-nota-seta nota-positiva ativo" ng-class="{ ativo: comentario.voto == 'UP' }" ng-click="vm.votarComentarioAprovar(comentario)" aria-label="Gostei do comentário" aria-pressed="true">
									<span id="" class="glyphicon glyphicon-chevron-up " title=""></span></button>


Butão sem like:

<button class="discussao-comentario-nota-seta nota-positiva" ng-class="{ ativo: comentario.voto == 'UP' }" ng-click="vm.votarComentarioAprovar(comentario)" aria-label="Gostei do comentário" aria-pressed="false">
									<span id="" class="glyphicon glyphicon-chevron-up " title=""></span></button>


[x] Task: criar tela de Plataformas Homologadas, com card list, mostrando imagem 250 por 320 px mais ou menos, e colocar imagem abaixo nome
em cada item da lista colocar link para navegar para respectivas plataformas, uma forma de atalho para entrar nos site oficiais.
add também um link de sugestões ou relatar bug, nele vai abrir um link de google doc para usuario pode fazer feedback.
add detalhes a pagina como minha rede social, direitos footer padrão e header com base na outra tela de guia de instalação
[x] Salvar git commit 


[x]  Task: remover do pop tela inicio o nome das plataformas, e deixar apenas um butão link para navegar para nova tela
no popup principal remover butão onde mostra Configurar Anki, trocar por um toogle igual butão de liga/desliga mostrando se Anki esta ligado ou desligado (ativo), apenas nome: Anki e lado toogle mostrando se esta ligado ou desligado
[x] Salvar git commit 

[x] Task: no toast onde mostra para add questão ao anki, lado direto mostrar ícone de cafe e ao passar mouse em cima mostrar: Apoie o projeto (ícone coração)!, e ao clicar fazer igual outro atalho no popup principal, navegar usuário para tela de doação
[x] Salvar git commit 
