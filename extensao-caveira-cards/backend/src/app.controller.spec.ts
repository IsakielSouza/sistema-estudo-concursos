import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API response with Hello World message', () => {
      const result = appController.getHello();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'API funcionando corretamente');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('message', 'Hello World!');
      expect(result.data).toHaveProperty('version', '1.0.0');
      expect(result.data).toHaveProperty('environment');
      expect(result.data).toHaveProperty('timestamp');
    });
  });

  describe('health', () => {
    it('should return health check response', () => {
      const result = appController.healthCheck({ isMobile: false });
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Sistema funcionando normalmente');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('status', 'ok');
      expect(result.data).toHaveProperty('timestamp');
      expect(result.data).toHaveProperty('uptime');
      expect(result.data).toHaveProperty('environment');
      expect(result.data).toHaveProperty('version', '1.0.0');
    });
  });

  describe('info', () => {
    it('should return API info response', () => {
      const result = appController.getApiInfo();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Informações da API');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('name', 'Sistema de Estudo para Concursos Públicos');
      expect(result.data).toHaveProperty('version', '1.0.0');
      expect(result.data).toHaveProperty('description');
      expect(result.data).toHaveProperty('features');
      expect(result.data).toHaveProperty('endpoints');
      expect(result.data).toHaveProperty('mobileSupport');
    });
  });
});
