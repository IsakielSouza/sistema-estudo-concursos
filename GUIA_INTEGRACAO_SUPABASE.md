# 🚀 Guia Completo: Integração Frontend + Backend + Supabase

## ✅ Status Atual da Integração

### Backend ✓
- **Servidor**: NestJS rodando em `http://localhost:3001`
- **Supabase Service**: Configurado com clientes autenticado e admin
- **JWT Authentication**: Implementado
- **Swagger Docs**: Disponível em `http://localhost:3001/docs`
- **Rotas Implementadas**:
  - Auth (login, registro, Google OAuth)
  - Users (perfil, atualização)
  - Materials (CRUD completo)
  - Rotinas (CRUD com status)
  - Ciclos (CRUD com time division)
  - Sessões (CRUD)

### Frontend ✓
- **Servidor**: Next.js 15 rodando em `http://localhost:3000`
- **API Client**: Configurado em `src/lib/api.ts`
- **Variáveis**: `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1` configurada em `.env.local`
- **Autenticação**: Token armazenado em localStorage
- **Tailwind CSS**: Migrado para v3 e funcionando

### Supabase 🔌
- **Credenciais**: Configuradas em `backend/.env`
  - `SUPABASE_URL`: https://roryqqqhqtgzszvqydjd.supabase.co
  - `SUPABASE_ANON_KEY`: Configurado
  - `SUPABASE_SERVICE_ROLE_KEY`: Configurado
- **Database**: PostgreSQL pronto
- **Auth**: Supabase Auth habilitado
- **RLS (Row Level Security)**: Pronto para ser aplicado

---

## 🔑 Próximo Passo: Aplicar o Schema SQL

### ⚠️ IMPORTANTE
O banco de dados precisa ser inicializado com as tabelas, índices e políticas RLS. Para isso:

### 1️⃣ Acesse o Supabase Console
- Abra: https://app.supabase.com
- Faça login na sua conta
- Selecione o projeto `roryqqqhqtgzszvqydjd`

### 2️⃣ Execute o Schema SQL
1. No painel esquerdo, clique em **SQL Editor**
2. Clique em **"New Query"** ou **"New"**
3. Cole todo o conteúdo do arquivo: `/backend/database/schema.sql`
4. Clique em **"Run"** (ícone play ou Cmd+Enter)
5. Aguarde a execução completar (deve aparecer "Success")

#### ⏱️ O que este script faz:
- ✓ Cria extensão UUID
- ✓ Cria 24 tabelas (users, materials, routines, ciclos, etc.)
- ✓ Cria índices de performance
- ✓ Cria triggers para atualizar timestamps
- ✓ Habilita Row Level Security (RLS)
- ✓ Cria 50+ políticas de segurança
- ✓ Insere 9 tags padrão

---

## 🧪 Testando a Integração Completa

### Teste 1: Verificar Saúde do Backend
```bash
curl http://localhost:3001/api/v1/health
```
Resposta esperada:
```json
{
  "success": true,
  "message": "Sistema funcionando normalmente",
  "data": {
    "status": "ok",
    "environment": "development"
  }
}
```

### Teste 2: Acessar Frontend
Abra: http://localhost:3000

Você deve ver:
- ✓ Dashboard principal
- ✓ Menu lateral com navegação
- ✓ Componentes estilizados com Tailwind v3

### Teste 3: Fazer Login (Após Schema Aplicado)
1. Clique em "Login" no frontend
2. Use Google OAuth OU registre com email/senha
3. O frontend enviará requisição para: `POST http://localhost:3001/api/v1/auth/google` ou `/auth/register`
4. Backend autentica no Supabase e retorna JWT token
5. Token é armazenado em localStorage
6. Requisições subsequentes incluem o token no header `Authorization: Bearer <token>`

### Teste 4: Acessar Swagger Docs
Abra: http://localhost:3001/docs

Você pode testar todos os endpoints diretamente lá:
- Expanda cada controller (Auth, Users, Materials, etc.)
- Clique em "Try it out"
- Envie requisições de teste
- Veja respostas em tempo real

---

## 🗄️ Estrutura de Segurança (RLS)

O schema inclui policies para cada tabela:

### Exemplo: Tabela de Rotinas
```sql
-- Usuários só veem suas próprias rotinas
CREATE POLICY "Users can view their own routines" 
  ON routines FOR SELECT USING (auth.uid() = user_id);

-- Usuários só podem criar rotinas para si mesmos
CREATE POLICY "Users can insert their own routines" 
  ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Benefício**: Mesmo se alguém contornar o frontend, o banco de dados garante que só acesse seus próprios dados.

---

## 🚨 Troubleshooting

### Erro: "Supabase configuration is missing"
- Verifique se as variáveis estão em `backend/.env`
- Variáveis obrigatórias: `SUPABASE_URL` e `SUPABASE_ANON_KEY`

### Erro: "Cannot find module '@supabase/supabase-js'"
```bash
cd backend
npm install
```

### Erro: "CORS error" ao fazer requisições do frontend
- O backend está configurado para CORS
- Verifique se `NEXT_PUBLIC_API_URL` está correto em `frontend/.env.local`

### Erro: "Password authentication failed"
- Verifique a senha do banco em `DATABASE_URL`
- A senha é aquela configurada ao criar o projeto

### Erro: "row level security violation"
- Significa RLS está ativo (bom!)
- Verifique se o usuário autenticado tem permissão para a ação
- O usuário está tentando acessar dados de outro usuário?

---

## 📊 Fluxo Completo de uma Requisição

```
1. Frontend (Next.js)
   ↓
   POST http://localhost:3001/api/v1/routines
   Header: Authorization: Bearer eyJhb...
   Body: { name: "Rotina Matutina", ... }
   
2. Backend (NestJS)
   ↓
   @GetUser() decorator extrai user_id do JWT
   RoutinesService.create(user_id, data)
   
3. Supabase
   ↓
   INSERT INTO routines (id, user_id, name, ...)
   RLS policy verifica: auth.uid() = user_id ✓
   Dados salvos no PostgreSQL
   
4. Resposta ao Frontend
   ↓
   200 OK
   { success: true, data: { id: "uuid", ... } }
   
5. Frontend atualiza UI
   ↓
   Rotina aparece na lista
```

---

## 🔄 Comandos Úteis

### Iniciar servidores
```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

### Ver logs do backend
```bash
tail -f /tmp/backend.log
```

### Matar processos em portas
```bash
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
```

### Resetar o banco (quando necessário)
1. Acesse Supabase Console
2. Vá em **Settings** > **Danger Zone**
3. Clique em **"Reset database"**
4. Execute o schema.sql novamente

---

## ✨ Próximos Passos Após Aplicar Schema

1. **Testar Autenticação**
   - [ ] Registrar novo usuário
   - [ ] Fazer login
   - [ ] Verificar token em localStorage

2. **Testar CRUD de Rotinas**
   - [ ] Criar rotina
   - [ ] Listar rotinas do usuário
   - [ ] Atualizar rotina
   - [ ] Deletar rotina

3. **Testar RLS**
   - [ ] Usuário A não consegue ver dados de Usuário B
   - [ ] Apenas criador pode editar material
   - [ ] Token inválido é rejeitado

4. **Otimizar**
   - [ ] Adicionar índices para queries comuns
   - [ ] Implementar cache no frontend
   - [ ] Configurar realtime (opcional)

---

## 📞 Suporte

Se encontrar erros durante a aplicação do schema:

1. Verifique o console Supabase para mensagens de erro específicas
2. Procure pela linha exata do erro
3. Tente quebrar o script em partes menores
4. Revise as credenciais e conexão

**Dúvidas?** Releia `CREDENCIAIS_SUPABASE.md`
