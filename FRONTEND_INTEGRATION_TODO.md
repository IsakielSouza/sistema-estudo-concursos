# EstudoPro - Integração do Frontend com API Backend

## 📋 Resumo Executivo

O frontend em `http://localhost:3000/` está exibindo dados mock hardcoded. A API em `http://localhost:3001/` está totalmente documentada via Swagger. Este documento lista todas as tarefas necessárias para integrar o frontend com a API real.

---

## 🔗 Endpoints Disponíveis na API

### **Auth - Autenticação e OAuth Google**
- `POST /api/v1/auth/login` - Login com email e senha
- `POST /api/v1/auth/google` - Login com Google OAuth
- `POST /api/v1/auth/register` - Registrar novo usuário
- `GET /api/v1/auth/profile` - Obter perfil autenticado
- `POST /api/v1/auth/logout` - Fazer logout

### **Users - Gerenciamento de Usuários**
- `POST /api/v1/users` - Criar novo usuário
- `GET /api/v1/users` - Listar todos os usuários
- `GET /api/v1/users/me` - Obter dados do usuário autenticado ⭐
- `GET /api/v1/users/profile` - Obter perfil do usuário autenticado ⭐
- `PUT /api/v1/users/profile` - Atualizar perfil do usuário
- `GET /api/v1/users/{id}` - Obter usuário por ID
- `PATCH /api/v1/users/{id}` - Atualizar usuário
- `DELETE /api/v1/users/{id}` - Deletar usuário

### **Materials - Materiais de Estudo**
- `POST /api/v1/materials` - Criar novo material
- `GET /api/v1/materials` - Listar todos os materiais ⭐
- `GET /api/v1/materials/search?q=...` - Buscar materiais por palavra-chave
- `GET /api/v1/materials/category/{category}` - Listar por categoria
- `GET /api/v1/materials/exam-type/{examType}` - Listar por tipo de prova
- `GET /api/v1/materials/{id}` - Obter detalhes do material
- `PATCH /api/v1/materials/{id}` - Atualizar material
- `DELETE /api/v1/materials/{id}` - Deletar material

### **Ciclos - Ciclos de Estudo** ⭐ CRÍTICO
- `POST /api/v1/ciclos` - Criar novo ciclo ⭐
- `GET /api/v1/ciclos` - Listar todos os ciclos do usuário ⭐
- `GET /api/v1/ciclos/{id}` - Obter detalhes completo com disciplinas e progresso ⭐
- `PUT /api/v1/ciclos/{id}` - Atualizar ciclo
- `DELETE /api/v1/ciclos/{id}` - Deletar ciclo
- `POST /api/v1/ciclos/{id}/time-division` - Definir divisão percentual entre revisão e novo

### **Sessões - Sessões de Estudo** ⭐ CRÍTICO
- `POST /api/v1/sessoes` - Iniciar nova sessão ⭐
- `GET /api/v1/sessoes` - Listar sessões (opcionalmente filtradas por ciclo) ⭐
- `GET /api/v1/sessoes/{id}` - Obter detalhes da sessão
- `PUT /api/v1/sessoes/{id}` - Atualizar sessão (pausar, retomar, concluir)
- `DELETE /api/v1/sessoes/{id}` - Deletar sessão

### **Routines - Rotinas de Estudo Agendadas**
- `POST /api/v1/routines` - Criar nova rotina
- `GET /api/v1/routines` - Listar todas as rotinas do usuário
- `GET /api/v1/routines/current/active` - Obter rotina ativa atualmente
- `GET /api/v1/routines/{id}` - Obter detalhes da rotina com atividades
- `PATCH /api/v1/routines/{id}` - Atualizar rotina e suas atividades
- `PATCH /api/v1/routines/{id}/status` - Atualizar status (ativa/inativa/agendada)
- `DELETE /api/v1/routines/{id}` - Deletar rotina

### **App - Utilitários**
- `GET /api/v1` - Health check
- `GET /api/v1/health` - Health check detalhado
- `GET /api/v1/info` - Informações da API

---

## ✅ TAREFAS CRÍTICAS DE INTEGRAÇÃO

### **1️⃣ Dashboard Statistics Cards** 
**Status**: TODO | **Prioridade**: 🔴 CRÍTICO | **Estimativa**: 4h

Substituir cards de estatísticas mock por dados reais da API.

**Tempo de Estudo (12h 30m)**
- [ ] Usar `GET /api/v1/sessoes` para filtrar sessões desta semana
- [ ] Somar duração de todas as sessões concluídas
- [ ] Implementar hook `useWeeklyStudyTime()`

**Ciclos Ativos (2)**
- [ ] Usar `GET /api/v1/ciclos`
- [ ] Filtrar ciclos com status "em_progresso"
- [ ] Implementar componente dinâmico

**Sessões Concluídas (45)**
- [ ] Usar `GET /api/v1/sessoes`
- [ ] Contar todas as sessões com status "concluído"
- [ ] Implementar hook `useCompletedSessionsCount()`

**Dias Seguidos - Streak (5 🔥)**
- [ ] Usar `GET /api/v1/sessoes`
- [ ] Calcular dias consecutivos com estudou
- [ ] Implementar utility `calculateStreak(sessions)`

- [ ] Adicionar loading states (skeleton loaders)
- [ ] Adicionar error handling e fallback UI
- [ ] Implementar cache com React Query/SWR

---

### **2️⃣ Current Study Cycle Card**
**Status**: TODO | **Prioridade**: 🔴 CRÍTICO | **Estimativa**: 5h

Substituir ciclo hardcoded por dados reais do usuário.

- [ ] Fetchar ciclo ativo com `GET /api/v1/ciclos`
- [ ] Exibir nome real do ciclo (não "Ciclo Policial Federal")
- [ ] Fetchar próxima disciplina com `GET /api/v1/ciclos/{id}`
- [ ] Calcular tempo restante (remainingTime = total - spent)
- [ ] Exibir progresso real (% e horas)
- [ ] Atualizar botão "Retomar Ciclo" para navegar ao ciclo ativo
- [ ] Mostrar status dinâmico (em_progresso, pausado, etc)
- [ ] Adicionar loading e error handling
- [ ] Refresh automático a cada 30s

---

### **3️⃣ Weekly Performance Chart**
**Status**: TODO | **Prioridade**: 🔴 CRÍTICO | **Estimativa**: 4h

Substituir gráfico mock com dados reais dos últimos 7 dias.

- [ ] Fetchar sessões com `GET /api/v1/sessoes?startDate=...&endDate=...`
- [ ] Agrupar por dia da semana (Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
- [ ] Calcular duração total por dia
- [ ] Se nenhuma sessão, atribuir valor 0
- [ ] Renderizar barras dinamicamente
- [ ] Implementar tooltip com detalhes ao hover
- [ ] Adaptar responsiveness para mobile/tablet
- [ ] Adicionar loading state
- [ ] Refresh a cada 1 minuto

---

## 🔧 Configuração Técnica

### **Setup do Cliente HTTP**

Criar `src/lib/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    });

    apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
          return config;
          });

          export default apiClient;
          ```

          ### **Setup React Query**

          Criar `src/lib/queryClient.ts`:

          ```typescript
          import { QueryClient } from '@tanstack/react-query';

          export const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                      staleTime: 1000 * 60 * 5, // 5 minutos
                            cacheTime: 1000 * 60 * 10, // 10 minutos
                                  retry: 1,
                                      },
                                        },
                                        });
                                        ```

                                        ### **Custom Hook Example**

                                        Criar `src/hooks/useCiclos.ts`:

                                        ```typescript
                                        import { useQuery, useMutation } from '@tanstack/react-query';
                                        import apiClient from '@/lib/api';

                                        export function useCiclos() {
                                          return useQuery({
                                              queryKey: ['ciclos'],
                                                  queryFn: async () => {
                                                        const { data } = await apiClient.get('/ciclos');
                                                              return data;
                                                                  },
                                                                    });
                                                                    }

                                                                    export function useCicloById(id: string) {
                                                                      return useQuery({
                                                                          queryKey: ['ciclos', id],
                                                                              queryFn: async () => {
                                                                                    const { data } = await apiClient.get(`/ciclos/${id}`);
                                                                                          return data;
                                                                                              },
                                                                                                  enabled: !!id,
                                                                                                    });
                                                                                                    }
                                                                                                    ```
                                                                                                    
                                                                                                    ---
                                                                                                    
                                                                                                    ## 📊 TAREFAS COMPLEMENTARES
                                                                                                    
                                                                                                    ### **Prioridade ALTA (Próximas)**
                                                                                                    - [ ] Welcome Message Personalização (1h) - Mostrar nome do usuário, hora do dia
                                                                                                    - [ ] Sidebar Data Dinâmica (2h) - Avatar, nome, badges de notificação
                                                                                                    - [ ] Create Cycle Feature (3h) - Form para criar novo ciclo
                                                                                                    
                                                                                                    ### **Prioridade MÉDIA**
                                                                                                    - [ ] Sessions Management (5h) - Iniciar, pausar, concluir sessões
                                                                                                    - [ ] Materials Page (4h) - Listar, buscar, filtrar materiais
                                                                                                    - [ ] Statistics Page (6h) - Gráficos detalhados, comparativos, exportação
                                                                                                    
                                                                                                    ### **Prioridade BAIXA**
                                                                                                    - [ ] Routines Management (5h) - Criar, atualizar rotinas agendadas
                                                                                                    - [ ] Notificações Real-time (4h) - WebSocket ou polling para atualizações
                                                                                                    
                                                                                                    ---
                                                                                                    
                                                                                                    ## ⚙️ Pré-requisitos
                                                                                                    
                                                                                                    - [ ] Backend rodando em `http://localhost:3001`
                                                                                                    - [ ] CORS configurado para aceitar `http://localhost:3000`
                                                                                                    - [ ] Tokens JWT sendo retornados corretamente
                                                                                                    - [ ] `.env.local`:
                                                                                                    ```
                                                                                                    NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
                                                                                                    ```
                                                                                                    
                                                                                                    ---
                                                                                                    
                                                                                                    ## 🧪 Testes Recomendados
                                                                                                    
                                                                                                    - [ ] Unit tests para funções de cálculo (streak, progress)
                                                                                                    - [ ] Integration tests com Mock Service Worker (MSW)
                                                                                                    - [ ] E2E tests para fluxos críticos
                                                                                                    - [ ] Testes de loading states e error boundaries
                                                                                                    
                                                                                                    ---
                                                                                                    
                                                                                                    ## 📝 Checklist Final
                                                                                                    
                                                                                                    - [ ] Remover todos os hardcoded values
                                                                                                    - [ ] Implementar error boundaries
                                                                                                    - [ ] Adicionar loading skeletons
                                                                                                    - [ ] Testar responsiveness (mobile/tablet)
                                                                                                    - [ ] Documentar custom hooks
                                                                                                    - [ ] Atualizar README
                                                                                                    - [ ] Code review antes de merge
                                                                                                    - [ ] Testar com dados reais do backend
                                                                                                    
                                                                                                    ---
                                                                                                    
                                                                                                    **Documento atualizado em**: 5 de Maio de 2026 ✅
