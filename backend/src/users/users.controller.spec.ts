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
