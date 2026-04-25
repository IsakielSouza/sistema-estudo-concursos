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
