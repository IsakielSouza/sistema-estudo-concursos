import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',
  
  // Configurações para aplicações móveis
  mobile: {
    // URLs permitidas para CORS
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:4200',
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      // URLs de produção para apps móveis (serão configuradas na V2)
      // 'https://api.seudominio.com',
    ],
    
    // Headers permitidos para apps móveis
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
    
    // Configurações de rate limiting para apps móveis
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // limite por IP
      message: 'Muitas requisições deste dispositivo, tente novamente mais tarde.',
    },
  },
  
  // Configurações de segurança
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: 12,
  },
  
  // Configurações do Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Configurações de upload (para V2)
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
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
  
  // Configurações de cache (para V2)
  cache: {
    ttl: 60 * 60, // 1 hora
    max: 100, // máximo de itens em cache
  },
})); 