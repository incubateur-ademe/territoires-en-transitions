import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { RoleService } from '@/backend/auth/authorizations/roles/role.service';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { AuthGuard } from './guards/auth.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SUPABASE_JWT_SECRET,
    }),
    CollectivitesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    PermissionService,
    RoleService,
  ],
  exports: [PermissionService],
})
export class AuthModule {}
