# 🔑 Como Encontrar a SUPABASE_SERVICE_ROLE_KEY

## 📍 Localização Exata no Supabase

### 1. 🌐 Acesse o Painel do Supabase
- Vá para [https://supabase.com](https://supabase.com)
- Faça login na sua conta
- Clique no seu projeto `sistema-estudo-concursos`

### 2. 🔧 Vá para Settings > API
- No menu lateral esquerdo, clique em **"Settings"** (ícone de engrenagem)
- Clique em **"API"** no submenu

### 3. 📋 Encontre as Chaves
Na seção **"Project API keys"** você verá:

```
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 🔍 A SERVICE_ROLE_KEY é a segunda linha
- **service_role secret**: Esta é sua `SUPABASE_SERVICE_ROLE_KEY`
- Copie toda a string que começa com `eyJ...`

## ⚠️ Importante

### 🔒 Segurança
- A `service_role` tem **acesso total** ao banco
- **NUNCA** exponha esta chave no frontend
- Use apenas no backend
- Mantenha-a segura

### 📝 Diferença entre as Chaves

| Chave | Uso | Acesso |
|-------|-----|--------|
| `anon public` | Frontend | Limitado (RLS) |
| `service_role secret` | Backend | Total (bypass RLS) |

## 🔧 Configurar no .env

Adicione a chave no arquivo `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← Esta aqui!
```

## 🚨 Se não encontrar a chave

### Verifique se:
1. ✅ Você está logado no Supabase
2. ✅ Selecionou o projeto correto
3. ✅ Está na seção "Settings" > "API"
4. ✅ Procurou na seção "Project API keys"

### Se ainda não encontrar:
1. **Recrie a chave**: Clique em "Regenerate" ao lado da service_role
2. **Verifique permissões**: Certifique-se de que é admin do projeto
3. **Contate suporte**: Se ainda não aparecer

## 🧪 Teste a Configuração

Após configurar, teste com:

```bash
cd backend
npm run start:dev
```

Se não houver erros de conexão, está funcionando! 🎉

---

**💡 Dica**: A service_role_key é mais longa que a anon_key e geralmente termina com caracteres diferentes. 