---
name: gerar-filtros-tec
description: Gera plano de filtros para o site TEC Concursos (tecconcursos.com.br) respeitando o limite de 1000 questões por filtro, voltado ao concurso da PRF. Use quando o usuário pedir plano de estudos, divisão de questões, montar caderno no TEC, preparar o desafio mensal de 1000 questões, ou subdividir um tema grande (ex.: Português) em filtros menores.
---

# Skill — Gerar Filtros TEC PRF

## Quando usar

Acione esta skill sempre que o usuário:
- Pedir para "montar um caderno", "gerar filtros", "dividir as 1000 questões".
- Estiver preparando o **desafio mensal 1k**.
- Quiser revisar uma matéria específica e o tema tiver mais de 1000 questões no banco.
- Pedir distribuição proporcional entre matérias para um total qualquer (não só 1000).

## Entradas esperadas

Pergunte ao usuário (use AskUserQuestion) se algum dos itens abaixo não estiver claro:

1. **Total de questões** desejado (default: 1000).
2. **Matéria(s)** envolvida(s) — todas / específica.
3. **Filtro de status** no TEC: "não respondidas" (default) ou "erradas".
4. **Banca / ano / dificuldade** (opcionais).

## Procedimento

### Passo 1 — Ler o mapa-mestre

Sempre começar lendo `CONTROLE 1K Q.docx` na raiz do projeto para obter:
- Lista hierárquica de matérias e tópicos.
- Quantidade de questões disponíveis no banco do TEC para cada nó.

### Passo 2 — Calcular distribuição

Distribuição padrão proporcional (definida em `CLAUDE.md` §3) para 1000:

| Matéria                          | Meta  |
| -------------------------------- | ----- |
| Língua Portuguesa                | 608   |
| Direito Constitucional           | 138   |
| Direito Administrativo           | 117   |
| Informática                      | 104   |
| Legislação de Trânsito (CTB)     | 31    |
| Outros                           | 2     |
| **Total**                        | **1000** |

Para totais diferentes de 1000, escalar proporcionalmente (multiplicar cada meta pelo fator `total / 1000`).

### Passo 3 — Subdividir temas grandes

Se a meta de uma matéria + filtro selecionado retornar **mais de 1000 questões disponíveis no banco**, dividir em subtópicos. Exemplo para Português (608 questões alvo, 14.865 disponíveis):

| # | Filtro                                                      | Qtd alvo |
| - | ----------------------------------------------------------- | -------- |
| 1 | Português → Interpretação de Textos                         | 200      |
| 2 | Português → Coerência e Coesão                              | 80       |
| 3 | Português → Pontuação                                       | 80       |
| 4 | Português → Concordância                                    | 60       |
| 5 | Português → Regência (inclui Crase)                         | 60       |
| 6 | Português → Morfologia (Classes de Palavras)                | 70       |
| 7 | Português → Tipologia e Gênero Textual                      | 58       |

A soma deve bater com a meta da matéria.

### Passo 4 — Montar instruções de filtro no TEC

Para cada bloco do plano, gerar um item com:
- **Matéria/Tópico** (caminho completo, ex.: "Direito Constitucional > Remédios Constitucionais > Mandado de Segurança").
- **Status** = "Não respondidas" (ou "Erradas" se for revisão).
- **Limite** = qtd alvo (sempre ≤ 1000).
- **Nome do caderno sugerido** no padrão `PRF-AAAA-MM-Materia-Topico`.
- **Observação** (se houver: priorizar banca CESPE/Cebraspe, recortar por ano etc.).

### Passo 5 — Apresentar o plano

Saída em tabela markdown clara, mais um resumo numérico:

```
Plano para [N] questões — [data]
- Matérias cobertas: [lista]
- Total de filtros: [n]
- Limite máximo por filtro: 1000 ✓
```

## Boas práticas

- **Sempre verificar o limite de 1000** antes de finalizar o plano.
- **Priorizar "não respondidas"** para evitar retrabalho.
- Para temas com pouquíssimas questões (<10 disponíveis), agrupar com tópicos afins.
- Usar nomenclatura consistente em todos os cadernos para facilitar busca depois.
- Após o usuário executar, lembrá-lo de registrar resultados em `controle/desafio-1k.xlsx` (aba "Diário").

## O que NÃO fazer

- Não criar filtros sem antes ler `CONTROLE 1K Q.docx`.
- Não sugerir tópicos que não constam no mapa-mestre.
- Não ultrapassar 1000 questões por filtro, mesmo que o usuário peça.
- Não recriar cadernos já existentes — perguntar antes se já existe um equivalente em "Meus Cadernos".

## Próximos passos automáticos

Após gerar o plano, sugerir ao usuário:
1. Abrir o TEC em uma aba e aplicar os filtros (Claude in Chrome pode ajudar).
2. Salvar cada filtro como caderno no TEC.
3. Atualizar `controle/desafio-1k.xlsx` com a meta planejada.
