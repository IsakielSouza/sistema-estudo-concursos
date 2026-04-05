import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponseDto } from './common/dto/api-response.dto';
import { MobileInfo } from './common/decorators/mobile-info.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ApiResponseDto {
    return ApiResponseDto.success(
      {
        message: this.appService.getHello(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
      'API funcionando corretamente'
    );
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  healthCheck(@MobileInfo() mobileInfo: any): ApiResponseDto {
    return ApiResponseDto.success(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        mobileInfo: mobileInfo.isMobile ? {
          platform: mobileInfo.platform,
          appVersion: mobileInfo.appVersion,
          deviceId: mobileInfo.deviceId,
        } : null,
      },
      'Sistema funcionando normalmente'
    );
  }

  @Get('info')
  getApiInfo(): ApiResponseDto {
    return ApiResponseDto.success(
      {
        name: 'Sistema de Estudo para Concursos Públicos',
        version: '1.0.0',
        description: 'API para sistema de estudo de concursos públicos com suporte a aplicações móveis',
        features: [
          'Autenticação JWT',
          'Gestão de usuários',
          'Materiais de estudo',
          'Videoaulas',
          'Simulados',
          'Suporte a aplicações móveis',
        ],
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          materials: '/api/v1/materials',
          health: '/api/v1/health',
        },
        mobileSupport: {
          android: true,
          ios: true,
          web: true,
          cors: true,
        },
      },
      'Informações da API'
    );
  }
}
