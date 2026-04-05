import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface MobileInfo {
  deviceId?: string;
  appVersion?: string;
  platform?: 'android' | 'ios' | 'web';
  userAgent?: string;
  isMobile: boolean;
}

export const MobileInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): MobileInfo => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers;
    const userAgent = headers['user-agent'] || '';

    const deviceId = headers['x-device-id'];
    const appVersion = headers['x-app-version'];
    
    // Detectar plataforma
    let platform: 'android' | 'ios' | 'web' = 'web';
    if (userAgent.includes('Android')) {
      platform = 'android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      platform = 'ios';
    }

    const isMobile = platform !== 'web' || !!deviceId;

    return {
      deviceId,
      appVersion,
      platform,
      userAgent,
      isMobile,
    };
  },
); 