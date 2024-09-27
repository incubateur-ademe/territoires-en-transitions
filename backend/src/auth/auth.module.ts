import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '../common/common.module';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SUPABASE_JWT_SECRET,
    }),
    CommonModule,
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
