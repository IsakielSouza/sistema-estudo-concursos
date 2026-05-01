# 🚀 Deploy Frontend - Vercel

## Pré-requisitos

- Conta no Vercel (https://vercel.com)
- Repositório GitHub conectado
- Frontend build funcionando ✅

## Passo 1: Push para o GitHub

```bash
cd /Users/isakielsouza/projects/sistema-estudo-concursos/frontend
git push origin main
```

## Passo 2: Importar no Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New..." → "Project"
3. Selecione o repositório `sistema-estudo-concursos`
4. Clique em "Import"

## Passo 3: Configurar Variáveis de Ambiente

Na página de configuração do Vercel, adicione as seguintes variáveis:

```
NEXT_PUBLIC_API_URL=https://seu-backend.com/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=672027020409-gu0uo3ehjgmhtt6jl5esq6binjc6bqta.apps.googleusercontent.com
```

**Ou copiar do arquivo local:**
```bash
cat frontend/.env.local
```

## Passo 4: Configurar Build

Deixar as configurações padrão:
- **Framework:** Next.js
- **Build Command:** `npm run build` (detectado automaticamente)
- **Output Directory:** `.next` (detectado automaticamente)

## Passo 5: Deploy

Clique em "Deploy" e aguarde (~2-3 minutos)

## ✅ Verificar Deploy

Após deploy:
1. Acesse a URL fornecida pelo Vercel
2. Teste página de login
3. Teste Google Sign-In
4. Verifique console (F12) para erros

## 🔗 URLs Pós-Deploy

- **Frontend:** https://seu-projeto.vercel.app
- **Backend:** https://seu-backend.com/api/v1

## ⚠️ Configurações Importantes

### Google OAuth Callback URLs

Se o Google OAuth não funcionar, atualize em Google Cloud Console:

1. Vá para https://console.cloud.google.com/
2. OAuth 2.0 Client ID (seu projeto)
3. Adicione Authorized Redirect URIs:
   ```
   https://seu-projeto.vercel.app
   https://seu-projeto.vercel.app/login
   https://seu-projeto.vercel.app/api/auth/callback
   ```

### CORS no Backend

Certifique-se que o backend permite requisições do Vercel:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['https://seu-projeto.vercel.app', 'http://localhost:3000'],
  credentials: true,
});
```

## 🔄 Próximos Deploys

Após o primeiro deploy, cada push para `main` fará deploy automático:

```bash
cd frontend
git add .
git commit -m "Seu commit"
git push origin main
# Deploy automático no Vercel!
```

## 🆘 Troubleshooting

### Build falha?
```bash
cd frontend
npm run build
# Verifica erros localmente primeiro
```

### Variáveis de ambiente não aparecem?
- Vercel cache: Hard refresh (Ctrl+Shift+R)
- Redeploy: Clique em "Redeploy" no dashboard

### Google Sign-In não funciona?
- Verifique `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Verifique Authorized Redirect URIs no Google Cloud
- Verifique CORS do backend

---

**Data:** Maio 2026
**Plataforma:** Vercel + Next.js 15.5.15
