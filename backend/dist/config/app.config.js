"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    mobile: {
        allowedOrigins: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://localhost:4200',
            'capacitor://localhost',
            'ionic://localhost',
            'http://localhost',
        ],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'X-API-Key',
            'X-Device-ID',
            'X-App-Version',
            'X-Platform',
            'X-Build-Number',
        ],
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: 'Muitas requisições deste dispositivo, tente novamente mais tarde.',
        },
    },
    security: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        bcryptRounds: 12,
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    upload: {
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/webm',
        ],
        storagePath: 'uploads',
    },
    cache: {
        ttl: 60 * 60,
        max: 100,
    },
}));
//# sourceMappingURL=app.config.js.map