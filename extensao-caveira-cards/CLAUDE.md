Nome projeto: CaveiraCards

Descrição:
projeto de integração do Anki com varais plataformas de questões

- Tec Concurso
- Q Concurso
- Gran concurso
- Projeto Caveira
- Projeto Missão

icon do projeto: CaveiraCards.png

projeto livre para uso, mais pode fazer doação para o pix isakielsouza@outlook.com.br


CaveiraCards transforma o seu estudo para concursos em um ciclo contínuo de revisão. Enquanto
  você resolve questões nas plataformas, a extensão detecta automaticamente cada resposta e
  oferece a opção de salvar o card direto no Anki — sem copiar, sem colar, sem sair da página.

  ▎ Como funciona
  ▎ Ao responder uma questão, um botão aparece discretamente na tela. Com um clique, o card é
  criado no Anki com a questão formatada, as alternativas destacadas (certa em verde, errada em
  vermelho) e a matéria organizada em baralhos separados.

  ▎ Plataformas suportadas
  ▎ • TEC Concursos
  ▎ • Gran Questões
  ▎ • Mais plataformas em breve

  ▎ Organização automática no Anki
  ▎ Os cards são organizados em baralhos hierárquicos:
  ▎ CaveiraCards → Plataforma → Erros ou Revisão → Matéria

  ▎ Questões erradas vão para o Caderno de Erros. Questões acertadas vão para Revisão. Tudo
  separado e fácil de estudar.

  ▎ Requisitos
  ▎ • Anki instalado no computador
  ▎ • Plugin AnkiConnect (gratuito, instruções no guia da extensão)

  ▎ Desenvolvido por @isakielsouza. Projeto livre — use à vontade.


  Para testar a extensão no Chrome, siga esses passos:                                            
                                                                                                
  1. Carregar a extensão no Chrome                                                                
   
  1. Abra chrome://extensions                                                                     
  2. Ative "Modo do desenvolvedor" (canto superior direito) 
  3. Clique em "Carregar sem compactação"                                                         
  4. Selecione a pasta:                                                                           
  /home/isakiel/projects/sistema-estudo-concursos/extensao-caveira-cards/caveira-cards            
                                                                                                  
  2. Configurar o Anki                                                                            
                                                            
  1. Abra o Anki                                                                                  
  2. Verifique se o AnkiConnect está instalado (código 2055492159)
  3. Atualize o config do AnkiConnect com o arquivo já pronto:                                    
  /home/isakiel/projects/sistema-estudo-concursos/extensao-caveira-cards/AnkiConnect.config       
  3. Cole o conteúdo em Ferramentas → Complementos → AnkiConnect → Config                         
  4. Reinicie o Anki                                                                              
                                                            
  3. Testar                                                                                       
                                                            
  - Popup: clique no ícone da extensão → veja se mostra "ATIVO" no site certo                     
  - ⚙️  Configurar Anki: clique e veja se muda para "OK"
  - TEC Concursos: responda uma questão → deve aparecer o overlay no canto                        
  - Gran Questões: mesmo processo


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GUIA TÉCNICO — ADICIONANDO NOVA PLATAFORMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. CRIAR O ADAPTER  (sites/<nome>.js)
  ─────────────────────────────────────
  Expor window.CaveiraCardsAdapter com os campos obrigatórios:

    window.CaveiraCardsAdapter = {
      nomePlataforma:   "NomeDaPlataforma",   // string exibida no overlay
      seletorQuestao:   ".seletor-css",        // (para plataformas forEach)
      questaoRespondida(el) { ... },           // retorna bool
      capturarQuestao(el)   { ... },           // retorna objeto questão
      // opcionais:
      capturarComentarios(el) { ... },         // retorna array de comentários
      detectarErro()  { ... },                 // (plataformas de questão única, como TEC)
      detectarAcerto() { ... },
    };

  O objeto questão retornado por capturarQuestao deve ter:
    { enunciado, alternativas, resultado ("Erros"|"Revisao"),
      materia, materiaLimpa, plataforma, banca, explicacao, idQuestao }

  2. REGISTRAR NO manifest.json
  ──────────────────────────────
  Adicionar em content_scripts:
    { "matches": ["https://site.com.br/*"],
      "js": ["shared/anki.js", "shared/card-builder.js", "sites/<nome>.js", "content.js"],
      "css": ["shared/overlay.css"],
      "run_at": "document_idle" }

  Adicionar em host_permissions:
    "https://site.com.br/*"

  Adicionar em web_accessible_resources → resources → matches:
    "https://site.com.br/*"

  3. REGISTRAR NO popup.html
  ───────────────────────────
  Adicionar badge na seção "Plataformas":
    <div class="platform">
      <span class="platform-name">Nome da Plataforma</span>
      <span class="badge" id="badge-<id>">inativo</span>
    </div>

  Atualizar popup.js para setar o badge:
    setBadge("badge-<id>", url.includes("dominio.com"));

  4. REGISTRAR NO content.js  (bloco dentro de verificar())
  ──────────────────────────────────────────────────────────
  Para plataformas com MÚLTIPLAS questões por página (padrão forEach):

    if (adapter.nomePlataforma === "NomeDaPlataforma") {
      document.querySelectorAll(adapter.seletorQuestao).forEach(questaoEl => {
        if (!adapter.questaoRespondida(questaoEl)) return;

        // 🔑 CHAVE DE DEDUPLICAÇÃO — use algo único por questão
        const chave = questaoEl.querySelector(".enunciado").innerText.trim().substring(0, 80);
        if (!chave || processadas.has(chave)) return;

        // ⚠️ REQUISITO OBRIGATÓRIO — verificar antes de processar
        // Não adicionar a processadas enquanto o dialog de sessão estiver ativo.
        // O verificar() retenta no próximo ciclo (1s) quando mostrandoOverlay = false.
        if (mostrandoOverlay) return;

        const questao = adapter.capturarQuestao(questaoEl);
        if (!questao) return;

        processadas.add(chave);       // ← sempre APÓS o guard mostrandoOverlay
        mostrarOverlay(questao);
      });
    }

  Para plataformas com QUESTÃO ÚNICA (padrão TEC — detectarErro/detectarAcerto):
  Usar a chave da questão para detectar troca, resetar overlayEl e usar:

    if (!overlayEl && !mostrandoOverlay && questao) {
      mostrarOverlay(questao);        // ← guard mostrandoOverlay obrigatório
    }

  5. SESSÃO DE ESTUDO — COMPORTAMENTO ESPERADO (automático)
  ──────────────────────────────────────────────────────────
  A contagem de sessão e a detecção de inatividade são gerenciadas
  centralmente em content.js e NÃO precisam ser implementadas no adapter.

  O sistema garante automaticamente para TODAS as plataformas:

  ✅ Ao responder qualquer questão → mostrarOverlay() é chamado
  ✅ mostrarOverlay() chama verificarInatividade() antes de exibir o overlay
  ✅ Se a sessão estiver ativa e > 1h sem atividade → dialog amarelo aparece:
       "⏸ Sessão pausada"  com opções  [🆕 Nova sessão]  [▶ Continuar]
       • Nova sessão: zera questões e reinicia o timer
       • Continuar: apenas atualiza o timestamp de atividade
  ✅ Após envio pro Anki → sessaoAtiva.questoes++ e ultimaAtividade são atualizados
  ✅ Durante o dialog: questões que ainda não foram processadas aguardam
       (não entram em processadas até mostrandoOverlay = false)

  Storage utilizado (chrome.storage.local):
    sessaoAtiva: {
      inicio:          number   // timestamp ms do início
      questoes:        number   // total de cards enviados ao Anki na sessão
      ativa:           boolean  // true enquanto sessão em curso
      ultimaAtividade: number   // timestamp ms da última questão respondida
      // quando ativa=false (sessão encerrada pelo usuário):
      fim:    number
      resumo: string  // ex: "⏱ 1h10min  |  📚 60 questões"
    }

  O adapter NÃO precisa tocar nesse storage diretamente.
  Apenas garantir que questaoRespondida() e capturarQuestao() funcionem
  corretamente — o resto é responsabilidade do content.js.