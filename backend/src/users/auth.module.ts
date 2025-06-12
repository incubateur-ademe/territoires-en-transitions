import { ApikeysController } from '@/backend/users/apikeys/apikeys.controller';
import { ApikeysRouter } from '@/backend/users/apikeys/apikeys.router';
import { ApikeysService } from '@/backend/users/apikeys/apikeys.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { RoleUpdateService } from '@/backend/users/authorizations/roles/role-update.service';
import { RoleService } from '@/backend/users/authorizations/roles/role.service';
import { InvitationService } from '@/backend/users/invitations/invitation.service';
import { InvitationsRouter } from '@/backend/users/invitations/invitations.router';
import { ListUsersController } from '@/backend/users/users/list-users/list-users.controller';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { ConvertJwtToAuthUserService } from './convert-jwt-to-auth-user.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersRouter } from './users.router';
import { ListUsersService } from './users/list-users/list-users.service';

@Global()
@Module({
  imports: [
    NestjsFormDataModule,
    JwtModule.register({
      global: true,
      secret: process.env.SUPABASE_JWT_SECRET,
      signOptions: {
        expiresIn: '6h',
      },
    }),
    CollectivitesModule,
  ],
  controllers: [ApikeysController, ListUsersController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    PermissionService,
    RoleService,
    RoleUpdateService,
    ListUsersService,
    UsersRouter,
    ConvertJwtToAuthUserService,
    ApikeysService,
    ApikeysRouter,
    InvitationService,
    InvitationsRouter,
  ],
  exports: [
    PermissionService,
    RoleUpdateService,
    ListUsersService,
    UsersRouter,
    ConvertJwtToAuthUserService,
  ],
})
export class AuthModule {}
