- Por padrão para todos sites deve salvar comentario do professor! (TEC, QConcurso, ProjetoCaveira)
- Separar Professor e Alunos em abas no Anki.
- Evitar duplicidade e permitir múltiplos comentários na mesma questão via anexo inteligente.

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

[x] Task: Histórico rico de sessões (Tempo por questão, média, matérias agrupadas).
[x] Task: Exportação JSON e Limpeza segura de histórico.


[x] - timer precisa adicionar contador de horas apartir de 59:59, exemplo: 01:00, atualmente esta ficando 60:00.

Bugs & Melhorias Timer:
[x] - Permitir trocar modo (Pomodoro/Livre) mesmo após timer finalizar (corrigir bloqueio por sessão ativa).
[x] - Oferecer botões de "Continuar", "Iniciar Pausa" ou "Encerrar sessão" ao finalizar o Pomodoro.
[x] - Parâmetros de Pomodoro (foco, pausas, sessões) editáveis via teclado.
[x] - Botão "Iniciar Pausa" (amarelo) e layout compacto em todas as versões (popup, fs, timer).
[x] - ao terminar sessao muda cor para verdeno timer-indicator
[x] - ao terminar todos os times da sessao iniciar cronometro de pausa longa
[x] - Corrigir sinal sonoro (beep) que não toca quando o usuário está em outra aba (migrar para background/offscreen).


[x] - na notificao que aparece ao final de um pomodoro verificar se é possivel mostrar os controladores de iniciar pausa, ou continuar estudos, caso nao seja posivel, mostrar opcao para ir para tela de timer para poder usuario realizar essas acoes
[x] - ao clicar para pular pausa, nao mostrou a sessao seguinte do pomodoro que seria mais minuos de estudos conforme sessao
[x] - revisar a funcao de pausa de 1 hora, para o pomodoro nao se aplica, apenas para timer livre
[x] corrigir link de cafe no popup de adicionar questao no anki
[x] - diminuir todos os componentes da tela flutuante, deixar minimanista igual pirnt (deltinha)
[x] - reviser control de sessao do pomodro e a contagem de questoes respondidas, quando uma sessao de pomodor acaba exemplo 25 minutos, deve ser registrando uma sessao como concluida e registrar todas as questoes igual é feito hoje tudo normal, realizei um teste de fiz duas sessoes, inicie uma com 25 minustos, respond umas 10 questoes, apos primeira sessao acabar inicei a pausa de 5 minustos, ate ai tudo bem, nesse momento caso usuario responda alguma questao, precisa alertar que timer esta em pausa e se quer continuar estudos, fazendo com que ele decida pular a pausa e continuar pomodoro nova sessao, nesse caso a nova questao deve ir para segunda sessao do pomodoro iniciado mais uma sessao, nesses caso sempre terar no historicos sessoes de 25 minutos se foi o tempo usado na configuracao de sessao.



[ ] ao iniciar sessao pelo popup que add questao ao anki, mostrar togle de se é timer Livre ou Pomodoro, input ao lado do butao de iniciar para digitar tag, assim como é feito na popup da extensa principal e verificar se por que relogio nao comeca contar