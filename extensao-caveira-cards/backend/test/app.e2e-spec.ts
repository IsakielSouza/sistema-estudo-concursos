import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'API funcionando corretamente');
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('message', 'Hello World!');
      });
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Sistema funcionando normalmente');
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('status', 'ok');
      });
  });

  it('/info (GET)', () => {
    return request(app.getHttpServer())
      .get('/info')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Informações da API');
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('name', 'Sistema de Estudo para Concursos Públicos');
      });
  });
});
