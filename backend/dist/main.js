"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://localhost:4200',
            'capacitor://localhost',
            'ionic://localhost',
            'http://localhost',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'X-API-Key',
            'X-Device-ID',
            'X-App-Version',
        ],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api/v1');
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Aplicação rodando na porta ${port}`);
    console.log(`📱 API preparada para aplicações móveis`);
    console.log(`🌐 CORS configurado para múltiplas origens`);
}
bootstrap();
//# sourceMappingURL=main.js.map