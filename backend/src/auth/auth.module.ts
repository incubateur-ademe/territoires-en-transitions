import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../utils/common/common.module';
import { ConfigModule } from '../utils/config/config.module';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SUPABASE_JWT_SECRET,
    }),
    ConfigModule,
    CommonModule,
    CollectivitesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
