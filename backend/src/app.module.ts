import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './common/supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MaterialsModule } from './materials/materials.module';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { MobileLoggingInterceptor } from './common/interceptors/mobile-logging.interceptor';
import { SessoesModule } from './sessoes/sessoes.module';
import { CiclosModule } from './ciclos/ciclos.module';
import { RoutinesModule } from './routines/routines.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    UsersModule,
    AuthModule,
    MaterialsModule,
    SessoesModule,
    CiclosModule,
    RoutinesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MobileLoggingInterceptor,
    },
  ],
})
export class AppModule {}
