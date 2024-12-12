import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { ConfigurationModule } from '../config/configuration.module';
import { AuthGuard } from './guards/auth.guard';
import { PermissionService } from '../auth/gestion-des-droits/permission.service';
import { RoleService } from '../auth/gestion-des-droits/roles/role.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SUPABASE_JWT_SECRET,
    }),
    ConfigurationModule,
    CommonModule,
    CollectivitesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    PermissionService,
    RoleService
  ],
  exports: [PermissionService],
})
export class AuthModule {}
