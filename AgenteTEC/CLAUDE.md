# AgenteTEC — Agente de Estudos PRF (TEC Concursos)

Instruções deste projeto para o Claude. Toda nova conversa nesta pasta deve respeitar este arquivo.

## 1. Objetivo

Auxiliar o Isakiel nos estudos para o concurso da Polícia Rodoviária Federal (PRF) usando o caderno do TEC Concursos (24k+ questões). O agente deve:

- Ler o documento `CONTROLE 1K Q.docx` (mapa-mestre de temas e quantidade de questões disponíveis no banco do TEC).
- Gerar planos de filtros para o site do TEC respeitando o limite de **1000 questões por filtro/caderno**.
- Apoiar o **desafio mensal de 1000 questões em um dia** (último dia do mês).
- Evitar retrabalho usando os filtros nativos do TEC ("Não respondidas", "Erradas").

## 2. Plataforma

- Site: https://www.tecconcursos.com.br/
- Interação: navegador, via Claude in Chrome.
- Limite por caderno/filtro: **1000 questões**.
- Concurso-alvo: Polícia Rodoviária Federal (PRF).

## 3. Estratégia do desafio 1k (distribuição proporcional)

Distribuição base, derivada dos percentuais do `CONTROLE 1K Q.docx`. Use como ponto de partida para 1000 questões em um dia:

| Matéria                              | %       | Qtd no banco | Meta diária |
| ------------------------------------ | ------- | ------------ | ----------- |
| Língua Portuguesa                    | 60,81%  | 14.865       | ~608        |
| Direito Constitucional               | 13,79%  | 3.370        | ~138        |
| Direito Administrativo               | 11,68%  | 2.855        | ~117        |
| Informática                          | 10,44%  | 2.552        | ~104        |
| Legislação de Trânsito (CTB)         | 3,13%   | 766          | ~31         |
| Outros (Arquitetura/Obras/Licitação) | <0,5%   | ~114         | ~2          |
| **Total**                            | ~100%   | ~24.522      | **1.000**   |

Notas:
- Se o tempo for curto, priorizar os tópicos com maior peso histórico em provas (Português → Constitucional → Administrativo → Informática → CTB).
- O desafio acontece em **um único dia** — preparar os filtros antes para não gastar tempo configurando durante.

## 4. Anti-retrabalho

Sempre que possível, ao montar um caderno/filtro no TEC:

1. Marcar **"Questões não respondidas"** — para puxar conteúdo novo.
2. Em ciclos de revisão, marcar **"Questões erradas"** — para reforçar pontos fracos.
3. Quando um conjunto for útil mais de uma vez, **salvar como Caderno** dentro do TEC (com nome padronizado, ex.: `PRF-2026-04-Portugues-Pontuacao`).
4. Não recriar filtros já existentes no TEC — verificar a aba "Meus Cadernos" antes.

## 5. Fluxo de trabalho mensal

1. **Início do mês** — planejar o desafio:
   - Abrir `controle/desafio-1k.xlsx`, aba "Plano Mensal".
   - Distribuir 1000 questões pelas matérias (default = tabela acima).
2. **Durante o mês** — gerar filtros conforme estuda:
   - Usar a skill `gerar-filtros-tec` para criar planos de filtro respeitando o limite de 1000.
   - Subdividir temas com mais de 1000 questões disponíveis em vários filtros menores (por subtópico).
3. **Dia do desafio** — executar 1000 questões:
   - Cadernos já preparados, só executar.
   - Registrar resultado por caderno na aba "Diário" da planilha.
4. **Pós-desafio** — revisar:
   - Identificar tópicos com menor % de acerto.
   - Programar revisão com filtro "Erradas" no início do mês seguinte.

## 6. Estrutura de arquivos

```
AgenteTEC/
├── CLAUDE.md                          ← este arquivo (instruções do projeto)
├── CONTROLE 1K Q.docx                 ← mapa-mestre de temas (não modificar)
├── skills/
│   └── gerar-filtros-tec/
│       └── SKILL.md                   ← skill para criar planos de filtro
└── controle/
    └── desafio-1k.xlsx                ← planejamento mensal + log diário
```

## 7. Convenções

- **Nunca** ultrapassar 1000 questões em um único filtro do TEC.
- Temas grandes (Português, Constitucional, Administrativo) devem ser **subdivididos por subtópico** quando passarem do limite.
- Toda sessão de estudo registrada na planilha deve ter: data, matéria, tópico, qtd feita, qtd certa, tempo.
- Datas em formato `AAAA-MM-DD`.
- Nomes de cadernos no TEC: `PRF-AAAA-MM-Materia-Topico`.
- Não inventar tópicos — sempre conferir contra o `CONTROLE 1K Q.docx`.

## 8. O que o agente deve perguntar antes de agir

- Qual o foco da sessão? (matéria/tópico específico, revisão, simulado)
- É preparação para o desafio 1k ou estudo regular?
- Quer filtrar "não respondidas" ou "erradas"?
- Existe alguma banca/ano/dificuldade preferida para esse filtro?
