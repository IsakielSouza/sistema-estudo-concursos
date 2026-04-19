# Esse arquivo contem planejamento novas funções para sistema:
## Persistência no banco de dados do Deltinha, e local storage do navegador.
https://www.deltinha.com.br/timer
https://Ankiweb.net/shared/info/2080612123

no Deltinha tem dois tipos, pomodoro, e livre:
Integração de funções com Deltinha:
[ ] Time
[ ] Salvar sessão de estudos Extensão > Deltinha.com

deltinha > Anki
deltinha > extensão

Anki > deltinha
Anki > extensão 

extensão > deltinha
extensão > Anki



O site do Deltinha ja tem uma integração Anki por meio do addon, funcionado as duas vias
pode iniciar tanto pelo Anki extensão do deltinha instalado, quanto pelo site Deltinha
os dois ficam integrado.

minha ideia é usar de forma transparente o time do deltinha, o time deve ser mostrando na minha extensão correndo igual site do deltinha, minha idela é ter um site para minha extensão e dentro do site chamar o site do deltinha apenas com função do time sem mais informações bem simples contedo as funções igual site do deltinha para iniciar time, livre ou pomodoro, iniciar e finalizar sessão.

 e ao final da sessão continuar salvando no local storage do navegador e novidade agora é também chamar a mesma tela de finalização de sessão do deltinha e registrar de forma mais automatica possivel lançamento da sessão contendo todos os dados 



tela de estatística é possível exportar dados: segue modelo no arquivo, com isso podemos mapear dados do sistemas para fazermos uma integração das disciplinas e ao finalizar sessão podemos ter de forma automatica as materias e assunto para podermos finalizar sessão sem manipular muito dados

Deltinha | deltinha.com.br | @odeltinha | Plataforma de estudos para concursos públicos
Data,Início,Fim,Duração,Disciplina,Assuntos,Questões,Acertos,Status,Notas
13/04/2026,18:31,18:32,1h00,,,15,6,completed,"{""gross_duration"":21,""pause_duration"":1}"
13/04/2026,05:43,13:06,1h00,,,15,13,completed,"{""gross_duration"":26547,""pause_duration"":17902}"
10/04/2026,05:33,10:19,1h20,,,103,55,completed,"{""gross_duration"":4829,""pause_duration"":2}"
04/04/2026,12:53,13:33,38min,Desafio 200Q (misto),,26,13,completed,"{""disciplina"":""Desafio 200Q (misto)"",""gross_duration"":2303,""pause_duration"":23}"
03/04/2026,06:58,07:48,50min,,,16,15,completed,
03/04/2026,06:49,07:49,1h00,Informática,1. Conceito de internet e intranet (Parte 1),0,0,completed,"{""source"":""estudo-monitorado"",""edital_id"":200,""topico_id"":""71846"",""disciplina"":""INFORMÁTICA"",""topico"":""1. Conceito de internet e intranet (Parte 1)"",""tag_id"":""837ae141-9612-441d-8e44-c382fd7c5024"",""assunto_id"":""5acceec6-175c-41b4-9019-b67586a06dcb""}"
03/04/2026,05:57,06:27,30min,Informática,1. Conceito de internet e intranet,0,0,completed,"{""source"":""estudo-monitorado"",""edital_id"":200,""topico_id"":""71846"",""disciplina"":""INFORMÁTICA"",""topico"":""1. Conceito de internet e intranet"",""tag_id"":""837ae141-9612-441d-8e44-c382fd7c5024"",""assunto_id"":""9d4390e9-f5af-44f2-ab8b-6b4153953d18""}"
03/04/2026,05:57,06:27,30min,,,0,0,completed,
01/04/2026,05:56,06:57,1h00,,,0,0,completed,"{""gross_duration"":3640,""pause_duration"":2}"
27/03/2026,20:42,21:33,50min,,,56,30,completed,"{""gross_duration"":3000}"
27/03/2026,08:00,14:00,50min,,,21,7,completed,"{""gross_duration"":4825,""pause_duration"":1825}"
26/03/2026,12:03,14:50,51min 25s,,,0,0,completed,"{""gross_duration"":10041,""pause_duration"":6956}"
25/03/2026,21:37,22:30,12min 56s,,,5,4,completed,"{""gross_duration"":3142,""pause_duration"":2366}"
25/03/2026,20:05,20:34,25min,português,,7,4,completed,"{""disciplina"":""português"",""gross_duration"":1662,""pause_duration"":162}"
25/03/2026,19:30,20:00,25min,,,10,7,completed,"{""gross_duration"":1709,""pause_duration"":209}"
23/03/2026,10:25,10:50,25min,português,,5,3,completed,"{""disciplina"":""português"",""gross_duration"":1500}"
23/03/2026,09:39,10:05,25min,,,3,1,completed,"{""gross_duration"":1500}"
22/03/2026,21:26,21:41,15min,,,3,0,completed,"{""gross_duration"":900}"
22/03/2026,15:32,15:55,15min,português,,10,3,completed,"{""disciplina"":""português"",""gross_duration"":900}"
22/03/2026,15:04,15:20,15min,,,10,0,completed,"{""gross_duration"":900}"
21/03/2026,17:00,17:38,25min,,,2,0,completed,"{""gross_duration"":2214,""pause_duration"":714}"


# Integração as disciplinas
 ainda nao sei como organizar isso de forma eficiente, mais minha idea é 
com base no nome da disciplina e nome do site criar no site do deltinha
e ficar armazenado no local storage a integração

exemplo: no site TEC nome da matéria: Informática
no Deltinha criar no seguinte formato: INFORMÁTICA-TEC
e salvar essa associação para usar no futuro quando for lançar novamente a sessão de estudos
sistema precisa ser inteligente para usar mesmo nome e assim os relatórios ficar corretos,
minha idela é salvar isso em banco de dados do navegador e poder editar no no site da extensão, entao precisariamos de uma nova tela de materias e site associados para adicionar editar nome ja existentes.