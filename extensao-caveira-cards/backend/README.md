<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Sistema de Estudo para Concursos Públicos - Backend

Sistema completo para estudo de concursos públicos com NestJS e Supabase, incluindo materiais, simulados e futura integração com IA.

## 🚀 Tecnologias Utilizadas

- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem principal
- **Supabase** - Banco de dados PostgreSQL + Auth
- **JWT** - Autenticação
- **Class-validator** - Validação de dados
- **Passport** - Estratégias de autenticação

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🛠️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `database/schema.sql` no SQL Editor do Supabase
3. Copie as credenciais do projeto (URL e chaves)

### 3. Configurar variáveis de ambiente

Copie o arquivo `env.example` para `.env` e configure:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Supabase Configuration
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# JWT Configuration
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# App Configuration
PORT=3000
NODE_ENV=development
```

### 4. Executar o projeto

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 📚 Estrutura do Projeto

```
src/
├── auth/                 # Autenticação e autorização
│   ├── dto/             # DTOs de autenticação
│   ├── guards/          # Guards de proteção
│   ├── strategies/      # Estratégias de autenticação
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # Gestão de usuários
│   ├── dto/            # DTOs de usuários
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── materials/           # Gestão de materiais
│   ├── dto/            # DTOs de materiais
│   ├── materials.controller.ts
│   ├── materials.service.ts
│   └── materials.module.ts
├── common/              # Código compartilhado
│   ├── supabase/       # Configuração do Supabase
│   ├── decorators/     # Decorators customizados
│   ├── dto/           # DTOs compartilhados
│   ├── guards/        # Guards compartilhados
│   └── interfaces/    # Interfaces compartilhadas
└── app.module.ts       # Módulo principal
```

## 🔐 Autenticação

O sistema utiliza JWT para autenticação. Endpoints protegidos requerem o header:

```
Authorization: Bearer <token>
```

### Endpoints de Autenticação

- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Fazer login
- `GET /auth/profile` - Obter perfil do usuário (protegido)
- `POST /auth/logout` - Fazer logout (protegido)

## 📖 API Endpoints

### Usuários
- `GET /users` - Listar todos os usuários
- `GET /users/:id` - Obter usuário por ID
- `GET /users/profile/me` - Obter perfil do usuário logado
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Materiais
- `GET /materials` - Listar todos os materiais
- `GET /materials/:id` - Obter material por ID
- `GET /materials/search?q=query` - Buscar materiais
- `GET /materials/category/:category` - Filtrar por categoria
- `GET /materials/exam-type/:examType` - Filtrar por tipo de concurso
- `POST /materials` - Criar material (protegido)
- `PATCH /materials/:id` - Atualizar material (protegido)
- `DELETE /materials/:id` - Deletar material (protegido)

## 🗄️ Banco de Dados

O sistema utiliza Supabase (PostgreSQL) com as seguintes tabelas principais:

- `users` - Usuários do sistema
- `materials` - Materiais PDF
- `video_lessons` - Videoaulas do YouTube
- `exams` - Simulados
- `questions` - Questões dos simulados
- `alternatives` - Alternativas das questões
- `user_exam_attempts` - Tentativas de simulados
- `user_answers` - Respostas dos usuários
- `user_progress` - Progresso dos usuários
- `tags` - Tags para categorização
- `material_tags` - Relacionamento materiais-tags
- `favorites` - Favoritos dos usuários

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:cov

# Testes e2e
npm run test:e2e
```

## 📝 Scripts Disponíveis

- `npm run build` - Compilar o projeto
- `npm run start` - Iniciar em modo produção
- `npm run start:dev` - Iniciar em modo desenvolvimento
- `npm run start:debug` - Iniciar em modo debug
- `npm run lint` - Executar linter
- `npm run format` - Formatar código

## 🔧 Desenvolvimento

### Adicionar novo módulo

```bash
# Gerar módulo
nest generate module nome-do-modulo

# Gerar controller
nest generate controller nome-do-modulo

# Gerar service
nest generate service nome-do-modulo
```

### Validação de Dados

O sistema utiliza `class-validator` para validação. Exemplo:

```typescript
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
```

## 🚀 Deploy

### Docker

```bash
# Construir imagem
docker build -t sistema-estudo-concursos .

# Executar container
docker run -p 3000:3000 sistema-estudo-concursos
```

### Variáveis de Ambiente para Produção

Certifique-se de configurar as seguintes variáveis:

- `NODE_ENV=production`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no GitHub.
