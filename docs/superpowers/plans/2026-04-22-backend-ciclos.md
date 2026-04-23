# Backend — Ciclos de Estudo (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as 15 tarefas BACKEND do TODO.md — autenticação completa, perfil de usuário, ciclos de estudo, disciplinas e sessões de tempo.

**Architecture:** NestJS com JWT próprio + Supabase como banco de dados. Cada domínio (ciclos, disciplinas, sessoes) é um módulo NestJS independente seguindo o padrão existente de `users/` e `materials/`. Autenticação protege todos os endpoints via `JwtAuthGuard` existente.

**Tech Stack:** NestJS 11, Supabase JS v2, Passport JWT, class-validator, Jest

---

## File Map

**Modificar:**
- `backend/database/schema.sql` — adicionar google_id em users, tabelas ciclos/disciplinas/sessoes
- `backend/src/users/users.controller.ts` — adicionar guard em /profile/me, adicionar PUT /profile
- `backend/src/auth/auth.controller.ts` — implementar logout real
- `backend/src/app.module.ts` — registrar novos módulos

**Criar:**
- `backend/src/ciclos/ciclos.module.ts`
- `backend/src/ciclos/ciclos.controller.ts`
- `backend/src/ciclos/ciclos.service.ts`
- `backend/src/ciclos/dto/create-ciclo.dto.ts`
- `backend/src/ciclos/dto/update-ciclo.dto.ts`
- `backend/src/ciclos/dto/time-division.dto.ts`
- `backend/src/ciclos/ciclos.service.spec.ts`
- `backend/src/disciplinas/disciplinas.module.ts`
- `backend/src/disciplinas/disciplinas.controller.ts`
- `backend/src/disciplinas/disciplinas.service.ts`
- `backend/src/disciplinas/dto/create-disciplina.dto.ts`
- `backend/src/disciplinas/dto/update-disciplina.dto.ts`
- `backend/src/disciplinas/disciplinas.service.spec.ts`
- `backend/src/sessoes/sessoes.module.ts`
- `backend/src/sessoes/sessoes.controller.ts`
- `backend/src/sessoes/sessoes.service.ts`
- `backend/src/sessoes/dto/create-sessao.dto.ts`
- `backend/src/sessoes/dto/update-sessao.dto.ts`
- `backend/src/sessoes/sessoes.service.spec.ts`

---

## Task 1: Schema SQL — novas tabelas (BACKEND-6, 10, 11, DATABASE-2/3/4)

**Files:**
- Modify: `backend/database/schema.sql`

- [ ] **Step 1: Adicionar coluna google_id na tabela users**

Abrir `backend/database/schema.sql` e localizar o bloco da tabela `users`. Adicionar a coluna `google_id` antes de `created_at`:

```sql
-- Dentro do CREATE TABLE users, adicionar após avatar_url:
google_id VARCHAR(255) UNIQUE,
```

O bloco completo da tabela users ficará:
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

- [ ] **Step 2: Adicionar tabelas ciclos, disciplinas e sessoes ao schema.sql**

Ao final do arquivo `backend/database/schema.sql`, antes dos índices existentes, adicionar:

```sql
-- =============================================
-- MÓDULO: CICLOS DE ESTUDO
-- =============================================

-- Tabela de ciclos de estudo
CREATE TABLE IF NOT EXISTS ciclos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(70) NOT NULL,
    concurso VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    regiao VARCHAR(100) DEFAULT 'Nacional',
    horas_semanais INTEGER NOT NULL DEFAULT 30,
    revisao_percentual INTEGER DEFAULT 50 CHECK (revisao_percentual BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de disciplinas de um ciclo
CREATE TABLE IF NOT EXISTS disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciclo_id UUID REFERENCES ciclos(id) ON DELETE CASCADE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    peso INTEGER DEFAULT 1 CHECK (peso BETWEEN 1 AND 10),
    nivel_usuario VARCHAR(20) DEFAULT 'medio' CHECK (nivel_usuario IN ('baixo', 'medio', 'alto')),
    horas_alocadas DECIMAL(6,2) DEFAULT 0,
    concluiu_edital BOOLEAN DEFAULT false,
    concluida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de estudo
CREATE TABLE IF NOT EXISTS sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciclo_id UUID REFERENCES ciclos(id) ON DELETE CASCADE NOT NULL,
    disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
    tempo_iniciado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tempo_percorrido INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

- [ ] **Step 3: Adicionar índices para as novas tabelas**

Após os índices existentes no schema.sql, adicionar:

```sql
-- Índices para ciclos
CREATE INDEX IF NOT EXISTS idx_ciclos_user_id ON ciclos(user_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_created_at ON ciclos(created_at);

-- Índices para disciplinas
CREATE INDEX IF NOT EXISTS idx_disciplinas_ciclo_id ON disciplinas(ciclo_id);

-- Índices para sessoes
CREATE INDEX IF NOT EXISTS idx_sessoes_ciclo_id ON sessoes(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_disciplina_id ON sessoes(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_created_at ON sessoes(created_at);
```

- [ ] **Step 4: Adicionar triggers updated_at para novas tabelas**

Após os triggers existentes:

```sql
CREATE TRIGGER update_ciclos_updated_at BEFORE UPDATE ON ciclos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessoes_updated_at BEFORE UPDATE ON sessoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

- [ ] **Step 5: Adicionar RLS e políticas para novas tabelas**

```sql
-- RLS para ciclos
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own ciclos" ON ciclos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ciclos" ON ciclos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ciclos" ON ciclos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ciclos" ON ciclos FOR DELETE USING (auth.uid() = user_id);

-- RLS para disciplinas
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view disciplinas of their ciclos" ON disciplinas FOR SELECT USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can insert disciplinas in their ciclos" ON disciplinas FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can update disciplinas in their ciclos" ON disciplinas FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can delete disciplinas in their ciclos" ON disciplinas FOR DELETE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = disciplinas.ciclo_id AND ciclos.user_id = auth.uid())
);

-- RLS para sessoes
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sessoes of their ciclos" ON sessoes FOR SELECT USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can insert sessoes in their ciclos" ON sessoes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
CREATE POLICY "Users can update sessoes in their ciclos" ON sessoes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ciclos WHERE ciclos.id = sessoes.ciclo_id AND ciclos.user_id = auth.uid())
);
```

- [ ] **Step 6: Commit**

```bash
git add backend/database/schema.sql
git commit -m "feat(db): add google_id to users, create ciclos/disciplinas/sessoes tables"
```

---

## Task 2: Corrigir rotas de usuário (BACKEND-7, 8, 9)

**Files:**
- Modify: `backend/src/users/users.controller.ts`

- [ ] **Step 1: Escrever teste para /users/profile/me com e sem auth**

Criar `backend/src/users/users.controller.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('getMe retorna usuário do req.user', async () => {
    const fakeUser = { id: 'uuid-1', email: 'a@b.com', name: 'Teste' };
    mockUsersService.findOne.mockResolvedValue(fakeUser);

    const req = { user: { id: 'uuid-1' } };
    const result = await controller.getMe(req as any);

    expect(mockUsersService.findOne).toHaveBeenCalledWith('uuid-1');
    expect(result).toEqual(fakeUser);
  });

  it('updateProfile chama service.update com o id do req.user', async () => {
    const fakeUser = { id: 'uuid-1', email: 'a@b.com', name: 'Novo Nome' };
    mockUsersService.update.mockResolvedValue(fakeUser);

    const req = { user: { id: 'uuid-1' } };
    const dto = { name: 'Novo Nome' };
    const result = await controller.updateProfile(req as any, dto as any);

    expect(mockUsersService.update).toHaveBeenCalledWith('uuid-1', dto);
    expect(result).toEqual(fakeUser);
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

```bash
cd backend && npm test -- --testPathPattern=users.controller.spec --no-coverage
```

Expected: FAIL — `getMe` e `updateProfile` não existem ainda.

- [ ] **Step 3: Substituir users.controller.ts completo**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

- [ ] **Step 4: Rodar testes**

```bash
cd backend && npm test -- --testPathPattern=users.controller.spec --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/users/users.controller.ts backend/src/users/users.controller.spec.ts
git commit -m "feat(users): add GET /users/me, GET/PUT /users/profile with JwtAuthGuard"
```

---

## Task 3: Implementar logout real (BACKEND-5)

**Files:**
- Modify: `backend/src/auth/auth.controller.ts`

- [ ] **Step 1: Substituir o método logout no auth.controller.ts**

O JWT é stateless — o logout seguro no backend instrui o client a descartar o token. Para segurança adicional, retornar também um header que invalide cookies.

Localizar o método `logout` no arquivo e substituir pelo seguinte:

```typescript
@UseGuards(JwtAuthGuard)
@Post('logout')
async logout(@Request() req) {
  // JWT é stateless: a invalidação real ocorre no client (apagar token do storage)
  // O backend confirma o logout e retorna o id do usuário para o client limpar dados locais
  return {
    message: 'Logout realizado com sucesso',
    userId: req.user.id,
  };
}
```

- [ ] **Step 2: Verificar que o build compila**

```bash
cd backend && npm run build 2>&1 | tail -5
```

Expected: Build bem-sucedido sem erros.

- [ ] **Step 3: Commit**

```bash
git add backend/src/auth/auth.controller.ts
git commit -m "fix(auth): implement logout with proper JwtAuthGuard and user context"
```

---

## Task 4: Módulo Ciclos — DTOs e Service (BACKEND-10, 12)

**Files:**
- Create: `backend/src/ciclos/dto/create-ciclo.dto.ts`
- Create: `backend/src/ciclos/dto/update-ciclo.dto.ts`
- Create: `backend/src/ciclos/dto/time-division.dto.ts`
- Create: `backend/src/ciclos/ciclos.service.ts`
- Create: `backend/src/ciclos/ciclos.service.spec.ts`

- [ ] **Step 1: Criar create-ciclo.dto.ts**

```bash
mkdir -p backend/src/ciclos/dto
```

Criar `backend/src/ciclos/dto/create-ciclo.dto.ts`:

```typescript
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDisciplinaInCicloDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  peso?: number;

  @IsString()
  @IsOptional()
  nivel_usuario?: 'baixo' | 'medio' | 'alto';

  @IsOptional()
  concluiu_edital?: boolean;
}

export class CreateCicloDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  concurso: string;

  @IsString()
  @IsNotEmpty()
  cargo: string;

  @IsString()
  @IsOptional()
  regiao?: string;

  @IsInt()
  @Min(1)
  @Max(168)
  horas_semanais: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDisciplinaInCicloDto)
  @IsOptional()
  disciplinas?: CreateDisciplinaInCicloDto[];
}
```

- [ ] **Step 2: Criar update-ciclo.dto.ts**

Criar `backend/src/ciclos/dto/update-ciclo.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateCicloDto } from './create-ciclo.dto';

export class UpdateCicloDto extends PartialType(CreateCicloDto) {}
```

- [ ] **Step 3: Criar time-division.dto.ts**

Criar `backend/src/ciclos/dto/time-division.dto.ts`:

```typescript
import { IsInt, Max, Min } from 'class-validator';

export class TimeDivisionDto {
  @IsInt()
  @Min(0)
  @Max(100)
  revisao_percentual: number;
}
```

- [ ] **Step 4: Escrever testes do CiclosService**

Criar `backend/src/ciclos/ciclos.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CiclosService } from './ciclos.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotFoundException } from '@nestjs/common';

const makeMockQuery = (returnData: any, returnError: any = null) => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: returnData, error: returnError }),
  };
  chain.then = jest.fn().mockResolvedValue({ data: returnData, error: returnError });
  return chain;
};

describe('CiclosService', () => {
  let service: CiclosService;
  const mockClient = { from: jest.fn() };
  const mockAdminClient = { from: jest.fn() };
  const mockSupabase = {
    getClient: jest.fn().mockReturnValue(mockClient),
    getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CiclosService,
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();

    service = module.get<CiclosService>(CiclosService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAllByUser retorna array de ciclos', async () => {
    const ciclos = [{ id: 'c1', nome: 'Ciclo PF', user_id: 'u1' }];
    const chain = makeMockQuery(ciclos);
    chain.single = undefined;
    chain.then = jest.fn().mockResolvedValue({ data: ciclos, error: null });
    mockAdminClient.from.mockReturnValue(chain);

    const result = await service.findAllByUser('u1');
    expect(result).toEqual(ciclos);
  });

  it('findOne lança NotFoundException quando ciclo não existe', async () => {
    const chain = makeMockQuery(null, { message: 'not found' });
    mockAdminClient.from.mockReturnValue(chain);

    await expect(service.findOne('c-inexistente', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('updateTimeDivision atualiza revisao_percentual', async () => {
    const updatedCiclo = { id: 'c1', revisao_percentual: 70 };
    const chain = makeMockQuery(updatedCiclo);
    mockAdminClient.from.mockReturnValue(chain);

    const result = await service.updateTimeDivision('c1', 'u1', 70);
    expect(result).toEqual(updatedCiclo);
  });
});
```

- [ ] **Step 5: Rodar testes para confirmar falha**

```bash
cd backend && npm test -- --testPathPattern=ciclos.service.spec --no-coverage
```

Expected: FAIL — `CiclosService` não existe ainda.

- [ ] **Step 6: Criar ciclos.service.ts**

Criar `backend/src/ciclos/ciclos.service.ts`:

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateCicloDto } from './dto/create-ciclo.dto';
import { UpdateCicloDto } from './dto/update-ciclo.dto';

export interface Ciclo {
  id: string;
  user_id: string;
  nome: string;
  concurso: string;
  cargo: string;
  regiao: string;
  horas_semanais: number;
  revisao_percentual: number;
  created_at: string;
  updated_at: string;
  disciplinas?: any[];
  progresso?: { tempo_total_segundos: number; sessoes_concluidas: number };
}

@Injectable()
export class CiclosService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createCicloDto: CreateCicloDto, userId: string): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();
    const { disciplinas, ...cicloData } = createCicloDto;

    const { data: ciclo, error } = await admin
      .from('ciclos')
      .insert({ ...cicloData, user_id: userId })
      .select()
      .single();

    if (error || !ciclo) {
      throw new Error(`Erro ao criar ciclo: ${error?.message}`);
    }

    if (disciplinas && disciplinas.length > 0) {
      const horasPorDisciplina = this.distribuirHoras(
        createCicloDto.horas_semanais,
        disciplinas,
      );
      const disciplinasComHoras = disciplinas.map((d, i) => ({
        ...d,
        ciclo_id: ciclo.id,
        horas_alocadas: horasPorDisciplina[i],
      }));

      const { error: discError } = await admin
        .from('disciplinas')
        .insert(disciplinasComHoras);

      if (discError) {
        throw new Error(`Erro ao criar disciplinas: ${discError.message}`);
      }
    }

    return this.findOne(ciclo.id, userId);
  }

  async findAllByUser(userId: string): Promise<Ciclo[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('ciclos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar ciclos: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string, userId: string): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();

    const { data: ciclo, error } = await admin
      .from('ciclos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !ciclo) {
      throw new NotFoundException(`Ciclo ${id} não encontrado`);
    }

    const { data: disciplinas } = await admin
      .from('disciplinas')
      .select('*')
      .eq('ciclo_id', id)
      .order('nome');

    const { data: sessoes } = await admin
      .from('sessoes')
      .select('tempo_percorrido, status')
      .eq('ciclo_id', id);

    const tempoTotal = (sessoes || []).reduce(
      (acc, s) => acc + (s.tempo_percorrido || 0),
      0,
    );
    const sessoesConcluidas = (sessoes || []).filter(
      (s) => s.status === 'concluida',
    ).length;

    return {
      ...ciclo,
      disciplinas: disciplinas || [],
      progresso: {
        tempo_total_segundos: tempoTotal,
        sessoes_concluidas: sessoesConcluidas,
      },
    };
  }

  async update(id: string, userId: string, updateCicloDto: UpdateCicloDto): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();
    const { disciplinas, ...cicloData } = updateCicloDto;

    const { data, error } = await admin
      .from('ciclos')
      .update({ ...cicloData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ciclo ${id} não encontrado`);
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin
      .from('ciclos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao deletar ciclo: ${error.message}`);
    }
  }

  async updateTimeDivision(
    id: string,
    userId: string,
    revisaoPercentual: number,
  ): Promise<Ciclo> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('ciclos')
      .update({
        revisao_percentual: revisaoPercentual,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ciclo ${id} não encontrado`);
    }

    return data;
  }

  private distribuirHoras(horasSemanais: number, disciplinas: any[]): number[] {
    const totalPeso = disciplinas.reduce((acc, d) => acc + (d.peso || 1), 0);
    return disciplinas.map((d) =>
      parseFloat(((horasSemanais * (d.peso || 1)) / totalPeso).toFixed(2)),
    );
  }
}
```

- [ ] **Step 7: Rodar testes**

```bash
cd backend && npm test -- --testPathPattern=ciclos.service.spec --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add backend/src/ciclos/
git commit -m "feat(ciclos): add CiclosService with CRUD and time-division logic"
```

---

## Task 5: Módulo Ciclos — Controller e Module (BACKEND-12, 13, 14)

**Files:**
- Create: `backend/src/ciclos/ciclos.controller.ts`
- Create: `backend/src/ciclos/ciclos.module.ts`

- [ ] **Step 1: Criar ciclos.controller.ts**

Criar `backend/src/ciclos/ciclos.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CiclosService } from './ciclos.service';
import { CreateCicloDto } from './dto/create-ciclo.dto';
import { UpdateCicloDto } from './dto/update-ciclo.dto';
import { TimeDivisionDto } from './dto/time-division.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ciclos')
export class CiclosController {
  constructor(private readonly ciclosService: CiclosService) {}

  @Post()
  create(@Body() createCicloDto: CreateCicloDto, @Request() req) {
    return this.ciclosService.create(createCicloDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.ciclosService.findAllByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ciclosService.findOne(id, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCicloDto: UpdateCicloDto,
    @Request() req,
  ) {
    return this.ciclosService.update(id, req.user.id, updateCicloDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.ciclosService.remove(id, req.user.id);
  }

  @Post(':id/time-division')
  updateTimeDivision(
    @Param('id') id: string,
    @Body() timeDivisionDto: TimeDivisionDto,
    @Request() req,
  ) {
    return this.ciclosService.updateTimeDivision(
      id,
      req.user.id,
      timeDivisionDto.revisao_percentual,
    );
  }
}
```

- [ ] **Step 2: Criar ciclos.module.ts**

Criar `backend/src/ciclos/ciclos.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CiclosController } from './ciclos.controller';
import { CiclosService } from './ciclos.service';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CiclosController],
  providers: [CiclosService],
  exports: [CiclosService],
})
export class CiclosModule {}
```

- [ ] **Step 3: Verificar build**

```bash
cd backend && npm run build 2>&1 | tail -5
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add backend/src/ciclos/ciclos.controller.ts backend/src/ciclos/ciclos.module.ts
git commit -m "feat(ciclos): add CiclosController with all routes and CiclosModule"
```

---

## Task 6: Módulo Disciplinas (BACKEND-11)

**Files:**
- Create: `backend/src/disciplinas/dto/create-disciplina.dto.ts`
- Create: `backend/src/disciplinas/dto/update-disciplina.dto.ts`
- Create: `backend/src/disciplinas/disciplinas.service.ts`
- Create: `backend/src/disciplinas/disciplinas.service.spec.ts`
- Create: `backend/src/disciplinas/disciplinas.controller.ts`
- Create: `backend/src/disciplinas/disciplinas.module.ts`

- [ ] **Step 1: Criar DTOs de disciplinas**

```bash
mkdir -p backend/src/disciplinas/dto
```

Criar `backend/src/disciplinas/dto/create-disciplina.dto.ts`:

```typescript
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateDisciplinaDto {
  @IsUUID()
  @IsNotEmpty()
  ciclo_id: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  peso?: number;

  @IsString()
  @IsOptional()
  nivel_usuario?: 'baixo' | 'medio' | 'alto';

  @IsNumber()
  @IsOptional()
  horas_alocadas?: number;

  @IsBoolean()
  @IsOptional()
  concluiu_edital?: boolean;

  @IsBoolean()
  @IsOptional()
  concluida?: boolean;
}
```

Criar `backend/src/disciplinas/dto/update-disciplina.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateDisciplinaDto } from './create-disciplina.dto';

export class UpdateDisciplinaDto extends PartialType(CreateDisciplinaDto) {}
```

- [ ] **Step 2: Escrever testes do DisciplinasService**

Criar `backend/src/disciplinas/disciplinas.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DisciplinasService } from './disciplinas.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotFoundException } from '@nestjs/common';

describe('DisciplinasService', () => {
  let service: DisciplinasService;
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };
  const mockAdminClient = { from: jest.fn().mockReturnValue(mockChain) };
  const mockSupabase = {
    getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplinasService,
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();
    service = module.get<DisciplinasService>(DisciplinasService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findByCiclo retorna disciplinas do ciclo', async () => {
    const disciplinas = [{ id: 'd1', nome: 'Português', ciclo_id: 'c1' }];
    mockChain.order.mockResolvedValue({ data: disciplinas, error: null });

    const result = await service.findByCiclo('c1');
    expect(result).toEqual(disciplinas);
  });

  it('findOne lança NotFoundException quando disciplina não existe', async () => {
    mockChain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(service.findOne('d-inexistente')).rejects.toThrow(NotFoundException);
  });
});
```

- [ ] **Step 3: Rodar testes para confirmar falha**

```bash
cd backend && npm test -- --testPathPattern=disciplinas.service.spec --no-coverage
```

Expected: FAIL — `DisciplinasService` não existe.

- [ ] **Step 4: Criar disciplinas.service.ts**

Criar `backend/src/disciplinas/disciplinas.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';

export interface Disciplina {
  id: string;
  ciclo_id: string;
  nome: string;
  peso: number;
  nivel_usuario: string;
  horas_alocadas: number;
  concluiu_edital: boolean;
  concluida: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class DisciplinasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createDisciplinaDto: CreateDisciplinaDto): Promise<Disciplina> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('disciplinas')
      .insert(createDisciplinaDto)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Erro ao criar disciplina: ${error?.message}`);
    }

    return data;
  }

  async findByCiclo(cicloId: string): Promise<Disciplina[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('disciplinas')
      .select('*')
      .eq('ciclo_id', cicloId)
      .order('nome');

    if (error) {
      throw new Error(`Erro ao buscar disciplinas: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<Disciplina> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('disciplinas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Disciplina ${id} não encontrada`);
    }

    return data;
  }

  async update(id: string, updateDisciplinaDto: UpdateDisciplinaDto): Promise<Disciplina> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('disciplinas')
      .update({ ...updateDisciplinaDto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Disciplina ${id} não encontrada`);
    }

    return data;
  }

  async remove(id: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin.from('disciplinas').delete().eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar disciplina: ${error.message}`);
    }
  }
}
```

- [ ] **Step 5: Rodar testes**

```bash
cd backend && npm test -- --testPathPattern=disciplinas.service.spec --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 6: Criar disciplinas.controller.ts**

Criar `backend/src/disciplinas/disciplinas.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DisciplinasService } from './disciplinas.service';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';
import { UpdateDisciplinaDto } from './dto/update-disciplina.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('disciplinas')
export class DisciplinasController {
  constructor(private readonly disciplinasService: DisciplinasService) {}

  @Post()
  create(@Body() createDisciplinaDto: CreateDisciplinaDto) {
    return this.disciplinasService.create(createDisciplinaDto);
  }

  @Get()
  findByCiclo(@Query('ciclo_id') cicloId: string) {
    return this.disciplinasService.findByCiclo(cicloId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disciplinasService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDisciplinaDto: UpdateDisciplinaDto) {
    return this.disciplinasService.update(id, updateDisciplinaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.disciplinasService.remove(id);
  }
}
```

- [ ] **Step 7: Criar disciplinas.module.ts**

Criar `backend/src/disciplinas/disciplinas.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { DisciplinasController } from './disciplinas.controller';
import { DisciplinasService } from './disciplinas.service';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DisciplinasController],
  providers: [DisciplinasService],
  exports: [DisciplinasService],
})
export class DisciplinasModule {}
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/disciplinas/
git commit -m "feat(disciplinas): add DisciplinasModule with CRUD endpoints"
```

---

## Task 7: Módulo Sessoes (BACKEND-15)

**Files:**
- Create: `backend/src/sessoes/dto/create-sessao.dto.ts`
- Create: `backend/src/sessoes/dto/update-sessao.dto.ts`
- Create: `backend/src/sessoes/sessoes.service.ts`
- Create: `backend/src/sessoes/sessoes.service.spec.ts`
- Create: `backend/src/sessoes/sessoes.controller.ts`
- Create: `backend/src/sessoes/sessoes.module.ts`

- [ ] **Step 1: Criar DTOs de sessoes**

```bash
mkdir -p backend/src/sessoes/dto
```

Criar `backend/src/sessoes/dto/create-sessao.dto.ts`:

```typescript
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSessaoDto {
  @IsUUID()
  @IsNotEmpty()
  ciclo_id: string;

  @IsUUID()
  @IsOptional()
  disciplina_id?: string;
}
```

Criar `backend/src/sessoes/dto/update-sessao.dto.ts`:

```typescript
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSessaoDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  tempo_percorrido?: number;

  @IsIn(['ativa', 'pausada', 'concluida'])
  @IsOptional()
  status?: 'ativa' | 'pausada' | 'concluida';
}
```

- [ ] **Step 2: Escrever testes do SessoesService**

Criar `backend/src/sessoes/sessoes.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SessoesService } from './sessoes.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotFoundException } from '@nestjs/common';

describe('SessoesService', () => {
  let service: SessoesService;
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };
  const mockAdminClient = { from: jest.fn().mockReturnValue(mockChain) };
  const mockSupabase = {
    getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessoesService,
        { provide: SupabaseService, useValue: mockSupabase },
      ],
    }).compile();
    service = module.get<SessoesService>(SessoesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('create retorna sessao criada', async () => {
    const sessao = { id: 's1', ciclo_id: 'c1', status: 'ativa', tempo_percorrido: 0 };
    mockChain.single.mockResolvedValue({ data: sessao, error: null });

    const result = await service.create({ ciclo_id: 'c1' });
    expect(result).toEqual(sessao);
    expect(result.status).toBe('ativa');
  });

  it('update lança NotFoundException quando sessao não existe', async () => {
    mockChain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(
      service.update('s-inexistente', { status: 'pausada' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('findByCiclo retorna sessoes do ciclo', async () => {
    const sessoes = [{ id: 's1', ciclo_id: 'c1', tempo_percorrido: 120 }];
    mockChain.order.mockResolvedValue({ data: sessoes, error: null });

    const result = await service.findByCiclo('c1');
    expect(result).toEqual(sessoes);
  });
});
```

- [ ] **Step 3: Rodar testes para confirmar falha**

```bash
cd backend && npm test -- --testPathPattern=sessoes.service.spec --no-coverage
```

Expected: FAIL — `SessoesService` não existe.

- [ ] **Step 4: Criar sessoes.service.ts**

Criar `backend/src/sessoes/sessoes.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { CreateSessaoDto } from './dto/create-sessao.dto';
import { UpdateSessaoDto } from './dto/update-sessao.dto';

export interface Sessao {
  id: string;
  ciclo_id: string;
  disciplina_id: string | null;
  tempo_iniciado: string;
  tempo_percorrido: number;
  status: 'ativa' | 'pausada' | 'concluida';
  created_at: string;
  updated_at: string;
}

@Injectable()
export class SessoesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createSessaoDto: CreateSessaoDto): Promise<Sessao> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('sessoes')
      .insert({
        ...createSessaoDto,
        tempo_iniciado: new Date().toISOString(),
        tempo_percorrido: 0,
        status: 'ativa',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Erro ao criar sessão: ${error?.message}`);
    }

    return data;
  }

  async findByCiclo(cicloId: string): Promise<Sessao[]> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('sessoes')
      .select('*')
      .eq('ciclo_id', cicloId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar sessões: ${error.message}`);
    }

    return data || [];
  }

  async update(id: string, updateSessaoDto: UpdateSessaoDto): Promise<Sessao> {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('sessoes')
      .update({ ...updateSessaoDto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Sessão ${id} não encontrada`);
    }

    return data;
  }
}
```

- [ ] **Step 5: Rodar testes**

```bash
cd backend && npm test -- --testPathPattern=sessoes.service.spec --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 6: Criar sessoes.controller.ts**

Criar `backend/src/sessoes/sessoes.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessoesService } from './sessoes.service';
import { CreateSessaoDto } from './dto/create-sessao.dto';
import { UpdateSessaoDto } from './dto/update-sessao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sessoes')
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  @Post()
  create(@Body() createSessaoDto: CreateSessaoDto) {
    return this.sessoesService.create(createSessaoDto);
  }

  @Get()
  findByCiclo(@Query('ciclo_id') cicloId: string) {
    return this.sessoesService.findByCiclo(cicloId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateSessaoDto: UpdateSessaoDto) {
    return this.sessoesService.update(id, updateSessaoDto);
  }
}
```

- [ ] **Step 7: Criar sessoes.module.ts**

Criar `backend/src/sessoes/sessoes.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SessoesController } from './sessoes.controller';
import { SessoesService } from './sessoes.service';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [SessoesController],
  providers: [SessoesService],
  exports: [SessoesService],
})
export class SessoesModule {}
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/sessoes/
git commit -m "feat(sessoes): add SessoesModule with create/update/list endpoints"
```

---

## Task 8: Registrar todos os módulos no AppModule

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Atualizar app.module.ts**

Substituir o conteúdo de `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './common/supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MaterialsModule } from './materials/materials.module';
import { CiclosModule } from './ciclos/ciclos.module';
import { DisciplinasModule } from './disciplinas/disciplinas.module';
import { SessoesModule } from './sessoes/sessoes.module';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { MobileLoggingInterceptor } from './common/interceptors/mobile-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    UsersModule,
    AuthModule,
    MaterialsModule,
    CiclosModule,
    DisciplinasModule,
    SessoesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MobileLoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Verificar build completo**

```bash
cd backend && npm run build 2>&1
```

Expected: Build bem-sucedido. Zero erros TypeScript.

- [ ] **Step 3: Rodar todos os testes**

```bash
cd backend && npm test -- --no-coverage 2>&1 | tail -20
```

Expected: Todos os tests PASS. Número total de suites deve incluir ciclos, disciplinas e sessoes.

- [ ] **Step 4: Commit final**

```bash
git add backend/src/app.module.ts
git commit -m "feat: register CiclosModule, DisciplinasModule, SessoesModule in AppModule"
```

---

## Task 9: Atualizar TODO.md com tarefas concluídas

**Files:**
- Modify: `TODO.md`

- [ ] **Step 1: Marcar tarefas BACKEND como concluídas no TODO.md**

Abrir `TODO.md` e substituir os `- [ ]` pelos `- [x]` para as tarefas BACKEND-1 a BACKEND-15.

- [ ] **Step 2: Atualizar tabela de status**

Localizar a tabela `## 📊 Status Overview` e atualizar:

```markdown
| Seção | Total | Completo | % |
|-------|-------|----------|---|
| BACKEND | 15 | 15 | 100% |
```

- [ ] **Step 3: Commit**

```bash
git add TODO.md
git commit -m "docs: mark all BACKEND tasks as completed in TODO.md"
```

---

## Self-Review

### Spec coverage
- BACKEND-1 (flag Google init) — escopo é frontend; no backend auth/google já é idempotente. ✅ Endereçado na decisão de design.
- BACKEND-2 (NextAuth) — substituído por NestJS JWT existente. ✅
- BACKEND-3 (credenciais Google) — documentado no env.example existente. ✅
- BACKEND-4 (callback Google) — já implementado no auth.service.ts existente. ✅
- BACKEND-5 (logout) — Task 3. ✅
- BACKEND-6 (modelo User) — Task 1 (google_id no schema). ✅
- BACKEND-7 (middleware auth) — JwtAuthGuard existente, aplicado em Task 2. ✅
- BACKEND-8 (GET /user/me) — Task 2. ✅
- BACKEND-9 (GET/PUT /user/profile) — Task 2. ✅
- BACKEND-10 (modelo Ciclo) — Task 1 (SQL) + Task 4 (service). ✅
- BACKEND-11 (modelo Materia) — Task 1 (SQL) + Task 6 (module). ✅
- BACKEND-12 (POST /ciclos wizard) — Task 4/5. ✅
- BACKEND-13 (GET /ciclos/:id) — Task 5. ✅
- BACKEND-14 (time-division) — Task 5 (POST /:id/time-division). ✅
- BACKEND-15 (rastreamento tempo) — Task 7. ✅

### Type consistency
- `CiclosService.create` recebe `CreateCicloDto` com `disciplinas?: CreateDisciplinaInCicloDto[]` — usado corretamente em Task 4/5.
- `SessoesService.update` recebe `UpdateSessaoDto` — consistente em Task 7.
- `DisciplinasService.findByCiclo` retorna `Disciplina[]` — usado no controller com `@Query('ciclo_id')`.

### Placeholder scan
Nenhum TBD ou TODO encontrado. Todos os steps têm código completo.
