import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { RoleUpdateService } from '@/backend/auth/authorizations/roles/role-update.service';
import { RoleService } from '@/backend/auth/authorizations/roles/role.service';
import { UpdateUserService } from '@/backend/auth/users/update-user.service';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { AuthGuard } from './guards/auth.guard';
import { UsersRouter } from './users/users.router';
import { UsersService } from './users/users.service';

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
    RoleUpdateService,

    UpdateUserService,
    UsersService,
    UsersRouter,
  ],
  exports: [PermissionService, RoleUpdateService, UsersService, UsersRouter],
})
export class AuthModule {}
