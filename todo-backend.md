# TODO - Backend & API - O Mentor

## 🔴 CRÍTICO - Matérias com Horas Zeradas (PRF & PF)

### Problema Identificado
Várias matérias cadastradas no banco de dados estão com **0:00h** de conteúdo:

**PRF (Polícia Rodoviária Federal):**
- Direito Administrativo
- - Direito Penal
  - - Direito Processual Penal
    - - Direitos Humanos
      - - Legislação Especial Extravagante
        - - Ética e Cidadania
          - - Inglês ou Espanhol
            - - Física
              - - Geopolítica
                - - Legislação da PRF
                 
                  - ### Causa Possível
                  - 1. Falta de seed/migration de dados
                    2. 2. Campo de horas não foi populado
                       3. 3. Relacionamento Edital → Cargo → Matérias não está correto
                         
                          4. ---
                         
                          5. ## 🟡 ALTA PRIORIDADE - API de Matérias
                         
                          6. ### Requisitos
                          7. - [ ] **GET /api/editais/:id/materias** - Retornar todas as matérias do edital
                             - [ ] - [ ] **GET /api/editais/:id/cargo/:cargoId/materias** - Retornar matérias específicas de um cargo
                             - [ ] - [ ] **POST /api/ciclos/:id/materias** - Criar nova matéria customizada no ciclo
                             - [ ] - [ ] **PUT /api/ciclos/:id/materias/:materiaId** - Atualizar matéria (nome, peso, horas)
                             - [ ] - [ ] **DELETE /api/ciclos/:id/materias/:materiaId** - Deletar matéria do ciclo
                             - [ ] - [ ] **PATCH /api/ciclos/:id/materias/:materiaId/complete** - Marcar como completa
                            
                             - [ ] ### Validações
                             - [ ] - [ ] Nome da matéria não pode ser vazio
                             - [ ] - [ ] Peso deve estar entre 1-10
                             - [ ] - [ ] Horas devem ser calculadas automaticamente baseado no peso
                             - [ ] - [ ] Não permitir duplicatas de matéria no mesmo ciclo
                            
                             - [ ] ---
                            
                             - [ ] ## 🟡 ALTA PRIORIDADE - Seed de Dados para PF e PRF
                            
                             - [ ] ### Script de Migração
                             - [ ] - [ ] Criar migration: `seed_materias_prf.sql`
                             - [ ] - [ ] Criar migration: `seed_materias_pf.sql`
                             - [ ] - [ ] Popular campo `hours_per_subject` para todas as matérias
                             - [ ] - [ ] Criar relacionamento correto: `edital_materia`
                             - [ ] - [ ] Criar relacionamento: `cargo_materia` (alguns cargos podem ter matérias diferentes)
                            
                             - [ ] ### Matérias PRF (com horas)
                             - [ ] ```
                             - [ ] Legislação de Trânsito: 11:30h
                             - [ ] Português: 7:00h
                             - [ ] Informática: 2:30h
                             - [ ] Raciocínio Lógico-Matemático: 2:30h
                             - [ ] Direito Constitucional: 2:30h
                             - [ ] Direito Administrativo: 2:30h (FALTANDO)
                             - [ ] Direito Penal: 2:30h (FALTANDO)
                             - [ ] Legislação da PRF: 3:00h (FALTANDO)
                             - [ ] ```
                            
                             - [ ] ---
                            
                             - [ ] ## 🟡 MÉDIA PRIORIDADE - Banco de Dados
                            
                             - [ ] ### Schema de Matérias
                             - [ ] ```sql
                             - [ ] CREATE TABLE materias (
                             - [ ]   id INT PRIMARY KEY,
                             - [ ]     nome VARCHAR(255) NOT NULL UNIQUE,
                             - [ ]   descricao TEXT,
                             - [ ]     horas_padrao DECIMAL(5,2),
                             - [ ]   peso_padrao INT DEFAULT 5,
                             - [ ]     created_at TIMESTAMP
                             - [ ] );
                            
                             - [ ] CREATE TABLE edital_materia (
                             - [ ]   edital_id INT,
                             - [ ]     materia_id INT,
                             - [ ]   ordem INT,
                             - [ ]     horas_recomendadas DECIMAL(5,2),
                             - [ ]   PRIMARY KEY (edital_id, materia_id),
                             - [ ]     FOREIGN KEY (edital_id) REFERENCES editais(id),
                             - [ ]   FOREIGN KEY (materia_id) REFERENCES materias(id)
                             - [ ]   );
                            
                             - [ ]   CREATE TABLE cargo_materia (
                             - [ ]     cargo_id INT,
                             - [ ]   materia_id INT,
                             - [ ]     obrigatoria BOOLEAN DEFAULT true,
                             - [ ]   peso_sugerido INT,
                             - [ ]     PRIMARY KEY (cargo_id, materia_id),
                             - [ ]   FOREIGN KEY (cargo_id) REFERENCES cargos(id),
                             - [ ]     FOREIGN KEY (materia_id) REFERENCES materias(id)
                             - [ ] );
                            
                             - [ ] CREATE TABLE ciclo_materia (
                             - [ ]   ciclo_id INT,
                             - [ ]     materia_id INT,
                             - [ ]   nome_customizado VARCHAR(255),
                             - [ ]     peso INT DEFAULT 5,
                             - [ ]   horas_estimadas DECIMAL(5,2),
                             - [ ]     completa BOOLEAN DEFAULT false,
                             - [ ]   PRIMARY KEY (ciclo_id, materia_id),
                             - [ ]     FOREIGN KEY (ciclo_id) REFERENCES ciclos(id),
                             - [ ]   FOREIGN KEY (materia_id) REFERENCES materias(id)
                             - [ ]   );
                             - [ ]   ```
                            
                             - [ ]   ### Relacionamentos
                             - [ ]   - [ ] Edital tem N Cargos
                             - [ ]   - [ ] Cargo tem N Matérias (obrigatórias + eletivas)
                             - [ ]   - [ ] Ciclo tem N Matérias (com customizações)
                             - [ ]   - [ ] Matéria customizada pode ter horas e peso diferentes
                            
                             - [ ]   ---
                            
                             - [ ]   ## 🟢 BAIXA PRIORIDADE - Melhorias
                            
                             - [ ]   ### Performance
                             - [ ]   - [ ] Cache de matérias por edital
                             - [ ]   - [ ] Índices no banco de dados (edital_id, cargo_id, materia_id)
                             - [ ]   - [ ] Paginação para listagem de matérias (se houver muitas)
                            
                             - [ ]   ### Features Futuras
                             - [ ]   - [ ] Sugerir matérias baseado em histórico do usuário
                             - [ ]   - [ ] IA para estimar horas necessárias por matéria
                             - [ ]   - [ ] Integração com conteúdo de estudo
                             - [ ]   - [ ] Recomendação de ordem de estudo
                            
                             - [ ]   ---
                            
                             - [ ]   ## 📋 Checklist de Resolução
                            
                             - [ ]   - [ ] Investigar banco de dados atual - qual é o schema?
                             - [ ]   - [ ] Criar/atualizar schema de matérias conforme documento
                             - [ ]   - [ ] Criar migrations: PF e PRF
                             - [ ]   - [ ] Implementar endpoints REST para matérias
                             - [ ]   - [ ] Implementar validações na API
                             - [ ]   - [ ] Testar GET editais/:id/materias
                             - [ ]   - [ ] Testar POST ciclos/:id/materias (criar customizada)
                             - [ ]   - [ ] Testar PUT/DELETE/PATCH de matérias
                             - [ ]   - [ ] Documentar API no Swagger/OpenAPI
                             - [ ]   - [ ] Sincronizar com frontend sobre formato de resposta
                            
                             - [ ]   ---
                            
                             - [ ]   ## 📌 Links Relacionados
                            
                             - [ ]   - **Frontend**: https://github.com/IsakielSouza/frontend/blob/main/todo.md
                             - [ ]   - **O Mentor**: https://omentor.app (aplicação)
                             - [ ]   - **Teste realizado em**: 5 de maio de 2026
