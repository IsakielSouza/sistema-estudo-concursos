import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map(data => {
        // Se já for uma ApiResponseDto, retorna como está
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        
        // Caso contrário, envolve em ApiResponseDto
        return ApiResponseDto.success(data);
      }),
    );
  }
} 