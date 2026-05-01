# Configurações Gerais do Sistema:

Todos os sites devem enviar comentário do professor obrigatoriamente, para cada site deve ter seu sua função e controle separados, ao poucos vou trazendo detalhes dos outros site de como realizar a leitura dos html dos sites para realizar o envio de forma automática.


'Salvar comentário manual': detalhes dessa função, ela deve ser usada para controlar o envio dos comentários dos alunos para o Anki junto a questão em foco.

'Salvar comentário manual' Ativado, Deve enviar ate 5 comentários mais relevantes dos site para o Anki de forma acrescentar junto ao comentários do professor

'Salvar comentário manual' Desativado, o envio dos comentários dos ALUNOS, para de ser enviado para Anki. 


### Site Tec:
#### Funções especificas do site TEC, existe alguns atalhos para usar quando for necessário:

##### Atalhos:
C: atalho para marcar questão como Certo
E: atalho para marcar questão como Errado

A a D ou de A a E: atalho para marcar questão dentro das resposta múltipla escolha.

Enter: para confirmar a resposta

(2x)quando resposta esta selecionada e a mesma tecla é apertada a questão é cortada (sublinhada), retirada da possível resposta.


N: navega usuário para próxima questão não resolvido.

F: acessa fórum de discussão da questão, (Comentários dos alunos)

O: acesa o comentário do professo da respetiva questão. 







# Regras de Negocio: Retomada de Atividade (Relógio Pausado/Pausa)

O sistema monitora a atividade do usuário (resolução de questões). Caso uma questão seja respondida enquanto o timer está parado ou em intervalo, as seguintes regras se aplicam:

### Caso 1: Inatividade maior que 1 hora
*   **Modo Pomodoro:** Retoma a contagem de tempo automaticamente (unpause) e continua a sessão atual, pois o Pomodoro gerencia seus próprios ciclos de encerramento.
*   **Modo Livre:** Exibe um diálogo perguntando se o usuário deseja **Iniciar uma nova sessão** (zerando estatísticas) ou **Continuar** a atual.

### Caso 2: Inatividade menor que 1 hora
*   **Modo Pomodoro & Livre:** Retoma a contagem de tempo automaticamente (unpause) assim que a atividade é detectada, sem exibir interrupções.

### Regra Especial: Pausa de Descanso (Break) no Pomodoro
*   Se o usuário responder uma questão durante o intervalo (Short/Long Break), o sistema entende que ele deseja voltar a estudar. A pausa é encerrada automaticamente e um **novo ciclo de foco** é iniciado imediatamente, sincronizando uma nova sessão de estudos.
