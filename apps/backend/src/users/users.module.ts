import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ApikeysController } from '@tet/backend/users/apikeys/apikeys.controller';
import { ApikeysRouter } from '@tet/backend/users/apikeys/apikeys.router';
import { ApikeysService } from '@tet/backend/users/apikeys/apikeys.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { InvitationService } from '@tet/backend/users/invitations/invitation.service';
import { InvitationsRouter } from '@tet/backend/users/invitations/invitations.router';
import { ListUsersController } from '@tet/backend/users/users/list-users/list-users.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { GetUserRolesAndPermissionsRepository } from './authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.repository';
import { GetUserRolesAndPermissionsService } from './authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { UpdateUserRoleRouter } from './authorizations/update-user-role/update-user-role.router';
import { UpdateUserRoleService } from './authorizations/update-user-role/update-user-role.service';
import { ConvertJwtToAuthUserService } from './convert-jwt-to-auth-user.service';
import { AuthGuard } from './guards/auth.guard';
import { UserPreferencesRepository } from './preferences/user-preferences.repository';
import { UserPreferencesRouter } from './preferences/user-preferences.router';
import { UserPreferencesService } from './preferences/user-preferences.service';
import { UsersRouter } from './users.router';
import { ListUsersRepository } from './users/list-users/list-users.repository';
import { ListUsersRouter } from './users/list-users/list-users.router';
import { ListUsersService } from './users/list-users/list-users.service';
import { UpdateUserRouter } from './users/update-user/update-user.router';
import { UpdateUserService } from './users/update-user/update-user.service';

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
    GetUserRolesAndPermissionsService,
    GetUserRolesAndPermissionsRepository,

    ListUsersRepository,
    ListUsersService,
    ListUsersRouter,

    UpdateUserService,
    UpdateUserRouter,

    UpdateUserRoleService,
    UpdateUserRoleRouter,

    UsersRouter,

    ConvertJwtToAuthUserService,

    ApikeysService,
    ApikeysRouter,

    InvitationService,
    InvitationsRouter,

    UserPreferencesRepository,
    UserPreferencesService,
    UserPreferencesRouter,
  ],
  exports: [
    PermissionService,
    GetUserRolesAndPermissionsService,
    ListUsersService,
    UsersRouter,
    UserPreferencesRouter,
    ConvertJwtToAuthUserService,
    UserPreferencesService,
  ],
})
export class UsersModule {}
