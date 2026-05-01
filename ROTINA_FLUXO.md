# 🗓️ ROTINA - Fluxo Completo de Funcionalidades

## Análise da Feature omentor.app/rotina

A feature de rotina permite que usuários criem agendas de estudo semanais, definindo horários específicos para atividades de estudo e outras atividades. Este documento detalha o fluxo completo de uso e a arquitetura necessária para implementar essa funcionalidade no sistema local.

---

## 📋 Fluxo de Navegação Completa

### 1. Página Listagem - `/rotina`

**Estado Inicial:**
- Usuário navega para "Minhas rotinas" via menu principal
- Página exibe tabela com todas as rotinas do usuário

**Componentes:**
- Header com título "Minhas rotinas"
- Botão "+ Nova rotina" (destaque visual com cor de destaque)
- Tabela com 3 colunas: Nome | Status | Ações
- Menu contexto em cada linha com opções: Visualizar, Ativar, Editar, Deletar

**Dados Exibidos:**
```
Nome              | Status    | Ações
Manhã (07-12h)    | Ativo     | ▼ (menu)
Tarde (13-18h)    | Inativo   | ▼ (menu)
Noite (19-22h)    | Inativo   | ▼ (menu)
```

**Interações:**
- Click em "+ Nova rotina" → Navega para `/rotina/create`
- Click em "Ativar" → Modal de confirmação (se houver rotina ativa anterior)
- Click em "Editar" → Navega para `/rotina/create?id={id}` (edit mode)
- Click em "Deletar" → Modal de confirmação, soft delete

**Estados Possíveis:**
- Lista vazia: "Nenhuma rotina criada. Clique em + Nova rotina para começar"
- Com rotinas: Lista ordenada por data de criação (mais recentes primeiro)
- Com ativa: Badge visual destacando qual está ativa

---

### 2. Criação/Edição de Rotina - `/rotina/create`

#### Step 1: Informações Básicas

**URL:** `/rotina/create` ou `/rotina/create?id={id}` (edit mode)

**Componentes:**
- Campo "Nome da rotina" (texto obrigatório, até 255 caracteres)
- Checkbox "Deseja receber notificações para lembrar os horários"
- Calendário semanal vazio para adicionar atividades

**Validação:**
- Nome não pode ser vazio
- Nome não pode ser duplicado (para o mesmo usuário)
- Máximo 255 caracteres

---

#### Step 2: Grid Semanal (Principal)

**Estrutura:**
- Grid 7 colunas × 24 linhas (dias × horas)
- Cabeçalho: Dias da semana com datas (SEG TER QUA QUI SEX SAB DOM)
- Linha tempo: 00:00 até 23:00 (cada célula = 1 hora)
- Navegação: Botões "This week", "Previous week", "Next week"

**Elementos Visuais:**
- Hora atual marcada com destaque amarelo
- Células vazias com fundo escuro
- Atividades preenchidas com cores diferentes:
  - Azul/Verde: Horário de estudo
  - Cinza: Outras atividades
- Hover effect: Cursor muda para pointer, célula destaca

**Interações:**
- Click em célula → Abre modal "Criar/Editar atividade"
- Drag múltiplas células → Abre modal com horário pré-preenchido
- Click em atividade existente → Abre modal de edição
- Botão direito → Menu contexto (editar, deletar)

**Display de Total:**
- "0:00h Total de horas para estudo" em tempo real
- Atualiza ao adicionar/remover atividades
- Validação: Aviso se exceder limite semanal do ciclo

---

#### Step 3: Modal de Criação/Edição de Atividade

**Trigger:** Click em célula ou drag de múltiplas células

**Componentes do Modal:**

1. **Seletor de Tipo (Toggle):**
   ```
   [Outras atividades] [Horário de estudo]
   ```
   - Toggle entre dois tipos
   - Padrão: "Horário de estudo"
   - Cores diferentes para cada tipo

2. **Nome da Atividade:**
   - Input texto obrigatório
   - Placeholder: "Dê um nome para atividade"
   - Exemplos pré-definidos: "Estudar", "Pausa", "Exercício"
   - Máximo 100 caracteres

3. **Seção Horário:**
   - Campo "De:" (time picker HH:MM)
   - Campo "Até:" (time picker HH:MM)
   - Validação: Horário fim > horário início
   - Se seleção foi via drag, pré-preenche automaticamente

4. **Recorrência:**
   - Checkbox "Habilitar recorrência"
   - Se ativado, mostra seletor de dias

5. **Seletor Dias da Semana:**
   - 7 botões: S T Q Q S S D
   - Toggle seleção múltipla
   - Estados: Selecionado (verde) / Não selecionado (cinza)
   - Inicial: Apenas dia da célula clicada está selecionado

6. **Ações:**
   - Botão "Remover Atividade" (com ícone trash)
   - Botão "Cancelar"
   - Botão "Salvar" (destaque)

**Validações:**
- Nome obrigatório
- Horário válido (HH:MM)
- Fim > início
- Sem sobreposição com outras atividades
- Se há sobreposição: Erro "Esse horário já tem uma atividade agendada"

**Estados:**
- Criar nova: Todos os campos vazios, dias com dia atual selecionado
- Editar: Carrega dados da atividade existente
- Delete: Remove atividade e fechamodal

---

### 3. Fluxo de Salvamento

**Ao clicar "Salvar rotina":**

1. **Validações:**
   - Nome da rotina é obrigatório
   - Pelo menos uma atividade deve ser adicionada
   - Nenhuma sobreposição de horários
   - Total de horas não excede limite (se houver ciclo associado)

2. **Comportamento:**
   - Loading spinner
   - Desabilita botão de salvamento
   - Envia dados para API (POST `/api/routines`)

3. **Resposta:**
   - Sucesso: Toast "Rotina salva com sucesso"
   - Redireciona para `/rotina` (listagem)
   - Erro: Toast com mensagem de erro, mantém na página

4. **Estrutura de Dados Enviada:**
```json
{
    "name": "Manhã (07-12h)",
    "notificationsEnabled": true,
    "activities": [
          {
                  "name": "Estudar",
                  "type": "study",
                  "startTime": "07:00",
                  "endTime": "09:00",
                  "recurrenceEnabled": true,
                  "daysOfWeek": [0, 1, 2, 3, 4] // Seg-Sex
                },
          {
                  "name": "Pausa",
                  "type": "other",
                  "startTime": "09:00",
                  "endTime": "09:30",
                  "recurrenceEnabled": true,
                  "daysOfWeek": [0, 1, 2, 3, 4]
                }
        ]
  }
```

---

## 🗄️ Estrutura de Banco de Dados

### Tabela: routines
```sql
CREATE TABLE routines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userId BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('ativo', 'inativo', 'agendado') DEFAULT 'inativo',
    notificationsEnabled BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_status (status),
    UNIQUE KEY uk_userId_name (userId, name)
  );
```

### Tabela: routine_activities
```sql
CREATE TABLE routine_activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    routineId BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('study', 'other') DEFAULT 'study',
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    recurrenceEnabled BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (routineId) REFERENCES routines(id) ON DELETE CASCADE,
    INDEX idx_routineId (routineId),
    INDEX idx_type (type),
    CHECK (endTime > startTime)
  );
```

### Tabela: routine_activity_days
```sql
CREATE TABLE routine_activity_days (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    activityId BIGINT NOT NULL,
    dayOfWeek INT NOT NULL CHECK (dayOfWeek BETWEEN 0 AND 6),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activityId) REFERENCES routine_activities(id) ON DELETE CASCADE,
    INDEX idx_activityId (activityId),
    UNIQUE KEY uk_activityId_dayOfWeek (activityId, dayOfWeek)
  );
```

---

## 🔌 API Endpoints

### GET /api/routines
**Descrição:** Listar todas as rotinas do usuário

**Parâmetros:**
- Nenhum

**Response (200):**
```json
[
    {
          "id": 1,
          "name": "Manhã (07-12h)",
          "status": "ativo",
          "notificationsEnabled": true,
          "createdAt": "2024-01-15T10:00:00Z",
          "updatedAt": "2024-01-15T10:00:00Z",
          "activities": [
                  {
                            "id": 1,
                            "name": "Estudar",
                            "type": "study",
                            "startTime": "07:00",
                            "endTime": "09:00",
                            "daysOfWeek": [0, 1, 2, 3, 4]
                          }
                ]
        }
  ]
```

---

### POST /api/routines
**Descrição:** Criar nova rotina

**Body:**
```json
{
    "name": "Manhã (07-12h)",
    "notificationsEnabled": true,
    "activities": [
          {
                  "name": "Estudar",
                  "type": "study",
                  "startTime": "07:00",
                  "endTime": "09:00",
                  "recurrenceEnabled": true,
                  "daysOfWeek": [0, 1, 2, 3, 4]
                }
        ]
  }
```

**Validações:**
- Nome obrigatório
- Sem sobreposição de horários
- Pelo menos uma atividade

**Response (201):**
```json
{
    "id": 1,
    "name": "Manhã (07-12h)",
    "status": "inativo",
    "notificationsEnabled": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "activities": [...]
  }
```

---

### GET /api/routines/:id
**Descrição:** Obter detalhes completos da rotina

**Response (200):** Mesmo formato de GET /api/routines[0]

---

### PUT /api/routines/:id
**Descrição:** Atualizar rotina

**Body:** Mesmo que POST /api/routines

**Response (200):** Rotina atualizada

---

### DELETE /api/routines/:id
**Descrição:** Deletar rotina (soft delete)

**Response (204):** Sem conteúdo

---

### PATCH /api/routines/:id/status
**Descrição:** Ativar/desativar rotina

**Body:**
```json
{
    "status": "ativo"
  }
```

**Lógica:**
- Se ativar rotina nova, desativa a ativa anterior
- Verifica permissão do usuário

**Response (200):**
```json
{
    "id": 1,
    "status": "ativo",
    "message": "Rotina ativada com sucesso"
  }
```

---

## 🎨 Componentes React

### 1. WeeklyCalendarGrid
```jsx
<WeeklyCalendarGrid
  activities={activities}
  currentWeek={currentWeek}
  onCellClick={(day, hour) => openActivityModal(day, hour)}
  onActivityEdit={(activity) => openActivityModal(null, null, activity)}
  onActivityDelete={(activityId) => deleteActivity(activityId)}
  onWeekChange={(week) => setCurrentWeek(week)}
/>
```

**Props:**
- `activities`: Array de atividades
- `currentWeek`: Data inicial da semana
- `onCellClick`: Callback ao clicar em célula
- `onActivityEdit`: Callback ao editar atividade
- `onActivityDelete`: Callback ao deletar
- `onWeekChange`: Callback ao navegar semanas

**Estados Internos:**
- `hoveredCell`: Célula com hover
- `selectedRange`: Range de seleção (drag)
- `highlightedActivity`: Atividade destacada

---

### 2. ActivityModal
```jsx
<ActivityModal
  isOpen={isOpen}
  activity={selectedActivity}
  onSave={handleSaveActivity}
  onCancel={handleCancel}
  onDelete={handleDeleteActivity}
  initialDay={initialDay}
  initialStartTime={initialStartTime}
/>
```

**Props:**
- `isOpen`: Boolean para controlar visibilidade
- `activity`: Objeto atividade (null para criar)
- `onSave`: Callback ao salvar
- `onCancel`: Callback ao cancelar
- `onDelete`: Callback ao deletar
- `initialDay`: Dia inicial pré-selecionado
- `initialStartTime`: Horário inicial pré-preenchido

---

### 3. DayOfWeekSelector
```jsx
<DayOfWeekSelector
  selectedDays={[0, 1, 2, 3, 4]}
  onChange={(days) => setDaysOfWeek(days)}
/>
```

**Props:**
- `selectedDays`: Array de índices (0-6)
- `onChange`: Callback ao alterar seleção

---

### 4. HourTotalDisplay
```jsx
<HourTotalDisplay
  totalHours={totalHours}
  weeklyLimit={weeklyLimit}
  exceedLimit={exceedLimit}
/>
```

---

## 🧪 Cenários de Teste

### Teste 1: Criar Rotina Simples
1. Click em "+ Nova rotina"
2. Digite nome "Rotina Manhã"
3. Click em célula 07:00 de segunda
4. Preenche atividade "Estudar" de 07:00 a 09:00
5. Seleciona dias Seg-Sex
6. Click "Salvar atividade"
7. Click "Salvar rotina"
8. Verifica se aparece na listagem

### Teste 2: Sobreposição de Horários
1. Cria atividade de 07:00 a 09:00
2. Tenta criar outra de 08:00 a 10:00
3. Esperado: Erro "Esse horário já tem uma atividade agendada"

### Teste 3: Ativar Rotina
1. Cria 2 rotinas
2. Marca primeira como "Ativa"
3. Tenta ativar segunda
4. Modal pergunta: "Quer trocar pela nova?"
5. Click "Ativar"
6. Verifica se primeira virou "Inativa"

### Teste 4: Deletar Rotina
1. Click em "Deletar" em uma rotina
2. Modal pede confirmação
3. Click "Remover rotina"
4. Verifica se sumiu da lista

---

## 📱 Responsividade

- **Desktop (>1024px):** Grid completo com 7 dias lado a lado
- **Tablet (768-1024px):** Grid com scroll horizontal ou dias comprimidos
- **Mobile (<768px):** 
  - Seletor de dia (dropdown)
  - Apenas 1 dia de cada vez
  - Modal otimizado para touch

---

## 🔔 Notificações

Se `notificationsEnabled = true`:
- Web Notification API para avisos de horários
- Notificação 5 minutos antes da atividade
- Conteúdo: "Sua atividade 'Estudar' começa em 5 minutos"
- Permitir snooze: Adia 5, 10 ou 15 minutos
- Som opcional

---

## 🔐 Segurança

- Validar que apenas o dono pode editar/deletar
- Sanitizar nomes de atividades (XSS)
- Rate limiting em POST/PUT/DELETE
- Autenticação obrigatória
- CSRF tokens

---

## 📊 Performance

- Cache de rotinas em localStorage (com invalidação)
- Lazy load de activities ao navegar semanas
- Virtualização do grid para muitas atividades
- Debounce em draggingevents

