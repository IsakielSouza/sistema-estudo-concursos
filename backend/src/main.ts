import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para aplicações móveis
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:4200',
      'capacitor://localhost', // Para aplicações Capacitor
      'ionic://localhost',     // Para aplicações Ionic
      'http://localhost',      // Para aplicações móveis locais
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Device-ID', // Para identificação de dispositivos móveis
      'X-App-Version', // Para controle de versão do app
    ],
    credentials: true,
  });

  // Configurar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configurar prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Configurar Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Sistema de Estudo para Concursos')
    .setDescription('API para gerenciar ciclos de estudo, materiais e rotinas de estudo')
    .setVersion('1.0.0')
    .addTag('Auth', 'Autenticação e OAuth Google')
    .addTag('Users', 'Gerenciamento de Usuários')
    .addTag('Materials', 'Materiais de Estudo')
    .addTag('Ciclos', 'Ciclos de Estudo')
    .addTag('Sessoes', 'Sessões de Estudo')
    .addTag('Routines', 'Rotinas de Estudo Agendadas')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Aplicação rodando na porta ${port}`);
  console.log(`📱 API preparada para aplicações móveis`);
  console.log(`🌐 CORS configurado para múltiplas origens`);
  console.log(`📚 Swagger/OpenAPI disponível em http://localhost:${port}/docs`);
}
bootstrap();
