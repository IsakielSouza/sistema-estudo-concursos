# 📚 Guia de Clonagem - Sistema de Ciclos de Estudo

Este documento contém todas as instruções para clonar e configurar o módulo de **Ciclos de Estudo** inspirado no O Mentor.

## 🚀 Início Rápido (5 minutos)

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/IsakielSouza/sistema-estudo-concursos.git
cd sistema-estudo-concursos
```

### Passo 2: Criar a Estrutura de Pastas
```bash
mkdir -p ciclo-estudo/{css,js,assets/images}
cd ciclo-estudo
```

### Passo 3: Usar Claude CLI para Criar os Arquivos

Instale o Claude CLI se ainda não tem:
```bash
pip install anthropic
```

Execute este comando para criar todos os arquivos:
```bash
claude create-ciclo-estudo
```

Ou use o prompt abaixo em uma sessão interativa do Claude CLI.

---

## 📝 Instruções Detalhadas para Claude CLI

Cole o seguinte comando no seu terminal com Claude CLI:

```bash
claude -m "Você é um desenvolvedor experiente. Crie os seguintes arquivos no diretório ciclo-estudo/:

1. ciclo-estudo/index.html - Arquivo HTML principal com toda a estrutura da aplicação
2. ciclo-estudo/css/menu.css - Estilos da barra lateral
3. ciclo-estudo/css/styles.css - Estilos principais
4. ciclo-estudo/js/main.js - JavaScript da aplicação

Aqui estão as especificações detalhadas:

## index.html
- Deve ser um HTML5 completo
- Sidebar fixa à esquerda com menu de navegação
- Main content com seções para ciclos de estudo
- Modals para confirmar ações
- Responsive design para mobile
- Use Bootstrap Icons via CDN
- Cores: body #111010, primary #F9D241

## css/menu.css
- Estilos para a sidebar
- Paleta de cores dark com destaque em amarelo
- Transições suaves
- Efeitos hover

## css/styles.css
- Estilos para main-content
- Tabelas com sessões de estudo
- Cards de resumo
- Modals estilizados
- Responsive grid

## js/main.js
- Lógica de timer
- Divisão de tempo com sliders
- Tabela dinâmica de sessões
- Gerenciamento de modals
- LocalStorage para persistência

Estrutura esperada:
- Paleta: --body-color: #111010, --primary-color: #F9D241
- Font: Sora, sans-serif
- Dark theme completo"
```

---

## 📂 Estrutura Final Esperada

```
ciclo-estudo/
├── index.html                 # Arquivo principal
├── css/
│   ├── menu.css             # Estilos sidebar
│   └── styles.css           # Estilos gerais
├── js/
│   └── main.js              # Lógica principal
└── assets/
    └── images/              # Imagens (placeholders por enquanto)
    ```

    ---

    ## 🎯 Funcionalidades Principais

    ### 1. Sidebar de Navegação
    - Menu fixo à esquerda
    - Ícones com Bootstrap Icons
    - Efeito collapse para mobile
    - Links para: Início, Minhas rotinas, Meus ciclos, Tutorial, Reportar problema

    ### 2. Header do Ciclo
    - Título do ciclo
    - Matéria atual
    - Cronômetro em destaque
    - Botões: Voltar, Editar ciclo

    ### 3. Sugestão do Mentor
    - Caixa de destaque com cor primária
    - Dicas inteligentes sobre divisão de tempo

    ### 4. Divisão de Tempo
    - Toggle para habilitar/desabilitar
    - Slider para distribuir tempo entre revisão e conteúdo novo
    - Input numérico para percentual
    - Botões confirmar/remover

    ### 5. Tabela de Sessões
    - Listagem de matérias e sessões
    - Tempo restante de cada sessão
    - Botões de ação: inserir tempo, marcar concluída, reiniciar

    ### 6. Cards de Resumo
    - Visão geral do progresso
    - Tempo total vs tempo restante
    - Grid responsivo

    ---

    ## 💻 Comandos Úteis

    ### Iniciar servidor local
    ```bash
    # Python 3
    python -m http.server 8000

    # Ou com Node.js
    npx http-server
    ```

    Acesse: http://localhost:8000/ciclo-estudo/

    ### Fazer commit dos arquivos
    ```bash
    git add ciclo-estudo/
    git commit -m "feat: adicionar módulo de ciclos de estudo"
    git push origin main
    ```

    ---

    ## 🎨 Paleta de Cores

    ```
    --body-color: #111010              (Fundo escuro)
    --sidebar-color: rgba(29,29,29,.8) (Sidebar)
    --primary-color: #F9D241           (Amarelo destaque)
    --hover-bg-color: #2F2A17          (Hover escuro)
    --text-color: #ccc                 (Texto claro)
    ```

    ---

    ## 📦 Dependências

    - **Bootstrap Icons** (CDN): Para ícones
    - **noUiSlider** (CDN): Para slider de tempo
    - Font: Sora via Google Fonts (ou fallback sans-serif)

    Tudo é carregado via CDN, nenhuma instalação necessária!

    ---

    ## 🔧 Personalização

    ### Mudar cores
    Edite as variáveis CSS no arquivo `index.html` dentro da tag `<style>`:
    ```css
    :root {
        --body-color: #111010;
            --primary-color: #F9D241;
                /* ... outras variáveis */
                }
                ```

                ### Adicionar mais disciplinas
                No `js/main.js`, edite o array `sessionsData`:
                ```javascript
                const sessionsData = [
                ```javascript
                fetch('/api/ciclos', {
                    method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cicloData)
                            })
                            ```
                            
                            ---
                            
                            ## 🐛 Troubleshooting
                            
                            ### Estilos não aparecem
                            - Certifique-se de que os arquivos CSS estão no caminho relativo correto
                            - Abra o Console do navegador (F12) e procure por erros de CORS
                            
                            ### Ícones não aparecem
                            - Verifique se o CDN do Bootstrap Icons está acessível
                            - Tente recarregar a página (Ctrl+Shift+R)
                            
                            ### Slider não funciona
                            - Verifique se o noUiSlider foi carregado do CDN
                            - Confirme que o JavaScript foi carregado sem erros
                            
                            ---
                            
                            ## 📞 Suporte
                            
                            Se encontrar problemas:
                            1. Abra o Console do navegador (F12)
                            2. Procure por mensagens de erro em vermelho
                            3. Verifique o Network tab para requisições falhadas
                            4. Consulte o README.md principal do projeto
                            
                            ---
                            
                            ## ✅ Checklist de Implementação
                            
                            - [ ] Criar pasta `ciclo-estudo/`
                            - [ ] Criar arquivo `index.html`
                            - [ ] Criar arquivo `css/menu.css`
                            - [ ] Criar arquivo `css/styles.css`
                            - [ ] Criar arquivo `js/main.js`
                            - [ ] Testar no navegador (localhost)
                            - [ ] Fazer commit e push
                            - [ ] Verificar se aparece no GitHub
                            - [ ] Testar responsividade (F12 > Mobile)
                            
                            ---
                            
                            ## 🎓 Próximos Passos
                            
                            1. Integrar com backend/API
                            2. Adicionar autenticação
                            3. Implementar persistência de dados
                            4. Criar página de listagem de ciclos
                            5. Adicionar gráficos de progresso
                            6. Implementar notificações de timer
                            7. Criar versão mobile app
                            
                            ---
                            
                            **Última atualização**: 22/04/2026
                            **Status**: Pronto para uso{ material: 'Sua Disciplina', session: '02:00:00', remaining: '02:00:00' },
                        // ... mais disciplinas
                        ];
                        ```

                        ### Conectar a um Backend
                        Substitua o localStorage pelas chamadas fetch() para salvar no servidor:
