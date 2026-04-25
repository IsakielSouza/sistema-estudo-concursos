# CaveiraCards

**CaveiraCards** é uma extensão de navegador desenvolvida para otimizar o estudo para concursos públicos através da técnica de Repetição Espaçada (SRS), utilizando o aplicativo **Anki**.

Com essa ferramenta, você pode transformar questões de bancas como **TEC Concursos**, **Gran Questões**, **QConcursos**, **AOCP**, **CEBRASPE**, **VUNESP**, **FGV** e outras em flashcards prontos para revisar, diretamente na interface da plataforma.

![Interface da Extensão](docs/interface.png)

## 📋 Características

- **Criação Rápida de Flashcards**: Converta questões e respostas em flashcards com um clique.
- **Integração Nativa com Anki**: Utiliza o **AnkiConnect** para sincronizar flashcards automaticamente com sua biblioteca Anki instalada localmente. *Não é necessário o envio de dados para a nuvem*.
- **Suporte Múltiplo de Bancas**: Compatível com as maiores plataformas de questões de concursos do Brasil:
  - TEC Concursos ⚠
  - Gran Questões (Atualizado - Apenas texto das questões e respostas)
  - QConcursos (Atualizado - Apenas texto das questões e respostas)
  - AOCP
  - CEBRASPE
  - VUNESP
  - FGV
  - FCC
  - ESAF
  - INEP
  -IUS Natura
- **Design Clean e Intuitivo**: Interface moderna e discreta que não interfere na experiência de estudo.

## 🚀 Como Instalar

A instalação é feita diretamente pelo seu navegador Google Chrome ou Chromium.

1.  **Baixe os Arquivos**: Obtenha os arquivos da extensão [aqui](#).
2.  **Acesse as Extensões**: Abra o seu navegador e digite `chrome://extensions` na barra de endereços.
3.  **Ative o Modo Desenvolvedor**: No canto superior direito da página de extensões, ative o interruptor **"Modo de desenvolvedor"**.
4.  **Carregue a Extensão**: Clique no botão **"Carregar sem compactação"** e selecione a pasta onde você baixou os arquivos da CaveiraCards.
5.  **Ative a Extensão**: Encontre a extensão na lista e certifique-se de que ela esteja ativa. Se preferir, fixe-a na barra de ferramentas para acesso rápido.

## 📖 Como Usar

1.  **Acesse a Plataforma de Questões**: Navegue até o site da banca desejada (ex: TEC Concursos).
2.  **Abra o Painel do Anki**: Clique no ícone da **CaveiraCards** na barra de ferramentas do seu navegador.
3.  **Selecione o Baralho**: Escolha em qual baralho do Anki deseja salvar os cards.
4.  **Salve os Cards**: Clique no botão de "Salvar" para exportar as questões como flashcards para o Anki.

## ⚙️ Configurações

A extensão permite algumas configurações para ajustar sua experiência de estudo:

- **Seletor de Baralho**: Escolha previamente em qual baralho do Anki os cards serão salvos.
- **Layouts**: Selecione se deseja salvar apenas a questão ou tanto a questão quanto a resposta.
- **Tema**: Alterne entre modo claro e escuro.

## ⚠️ Limitações e Considerações

A API local do Anki (AnkiConnect) é o ponto chave para essa integração. As limitações são impostas por ela e pela estrutura de dados de cada site:

- **TEC Concursos**: Atualmente, a extensão funciona perfeitamente para salvar questões com texto completo e gabarito.
- **Gran Questões / QConcursos / Outros**:
  - Devido à recente proteção dessas plataformas, **apenas o texto da questão e a resposta (gabarito) são capturados**.
  - Imagens, vídeos e áudios não são suportados neste momento.
- **AnkiConnect**: O Anki deve estar aberto e rodando em segundo plano para que a extensão possa salvar os cards.

## 🔐 Privacidade e Segurança

A privacidade do usuário é nossa prioridade. A extensão **CaveiraCards** não coleta, armazena ou transmite dados pessoais.

- **Processamento Local**: Todo o processamento é feito localmente no navegador.
- **Sem Servidores**: Não há servidores externos processando suas questões.
- **Comunicação Direta**: A comunicação é feita exclusivamente via API local (AnkiConnect) para o software Anki instalado na sua máquina.

Leia nossa [Política de Privacidade](PRIVACY_POLICY.md) completa para mais detalhes.

## 👥 Contribuições

Contribuições são bem-vindas! Seja para novas funcionalidades, correção de bugs ou melhorias de performance.

1.  Crie uma _branch_ com a sua _feature_ (`git checkout -b feature/NovaFuncionalidade`).
2.  Faça o _commit_ das suas alterações (`git commit -m 'Add some NovaFuncionalidade'`).
3.  Faça o _push_ para a _branch_ (`git push origin feature/NovaFuncionalidade`).
4.  Abra um _Pull Request_.

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido por** [Isakiel Souza](https://github.com/isakielsouza)

**Versão** 1.1.0