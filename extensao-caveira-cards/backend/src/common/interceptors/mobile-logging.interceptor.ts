import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MobileLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('MobileAPI');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    
    // Extrair informações do dispositivo móvel
    const deviceId = headers['x-device-id'];
    const appVersion = headers['x-app-version'];
    const userAgent = headers['user-agent'];
    
    const isMobileRequest = deviceId || userAgent?.includes('Mobile') || userAgent?.includes('Android') || userAgent?.includes('iPhone');
    
    if (isMobileRequest) {
      this.logger.log(
        `📱 Mobile Request: ${method} ${url} | Device: ${deviceId || 'Unknown'} | App Version: ${appVersion || 'Unknown'}`
      );
    }

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        if (isMobileRequest) {
          this.logger.log(
            `📱 Mobile Response: ${method} ${url} | Time: ${responseTime}ms | Device: ${deviceId || 'Unknown'}`
          );
        }
      }),
    );
  }
} 