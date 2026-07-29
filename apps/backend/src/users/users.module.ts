import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ApikeysController } from '@tet/backend/users/apikeys/apikeys.controller';
import { ApikeysRouter } from '@tet/backend/users/apikeys/apikeys.router';
import { ApikeysService } from '@tet/backend/users/apikeys/apikeys.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ListUsersController } from '@tet/backend/users/users/list-users/list-users.controller';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { GetUserRolesAndPermissionsRepository } from './authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.repository';
import { GetUserRolesAndPermissionsService } from './authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { UpdateUserRoleRouter } from './authorizations/update-user-role/update-user-role.router';
import { UpdateUserRoleService } from './authorizations/update-user-role/update-user-role.service';
import { ConvertJwtToAuthUserService } from './convert-jwt-to-auth-user.service';
import { AuthGuard } from './guards/auth.guard';
import { LoginUserWithOidcProviderService } from './authentications/oidc/login-user-with-oidc-provider/login-user-with-oidc-provider.service';
import { ConfirmOidcIdentityLinkedToUserRouter } from './authentications/oidc/confirm-oidc-identity-linked-to-user/confirm-oidc-identity-linked-to-user.router';
import { ConfirmOidcIdentityLinkedToUserService } from './authentications/oidc/confirm-oidc-identity-linked-to-user/confirm-oidc-identity-linked-to-user.service';
import { CreateUserOidcIdentityController } from './authentications/oidc/create-user-oidc-identity/create-user-oidc-identity.controller';
import { CreateUserOidcIdentityService } from './authentications/oidc/create-user-oidc-identity/create-user-oidc-identity.service';
import { CreateSupabaseSessionService } from './authentications/oidc/create-supabase-session.service';
import { InviteUserToLinkOidcIdentityRouter } from './authentications/oidc/invite-user-to-link-oidc-identity/invite-user-to-link-oidc-identity.router';
import { InviteUserToLinkOidcIdentityService } from './authentications/oidc/invite-user-to-link-oidc-identity/invite-user-to-link-oidc-identity.service';
import { HandleUserOidcIdentitiesRouter } from './authentications/oidc/handle-user-oidc-identities/handle-user-oidc-identities.router';
import { HandleUserOidcIdentitiesService } from './authentications/oidc/handle-user-oidc-identities/handle-user-oidc-identities.service';
import { OidcController } from './authentications/oidc/oidc.controller';
import { LinkOidcIdentityToUserSessionRouter } from './authentications/oidc/link-oidc-identity-to-user-session/link-oidc-identity-to-user-session.router';
import { LinkOidcIdentityToUserSessionService } from './authentications/oidc/link-oidc-identity-to-user-session/link-oidc-identity-to-user-session.service';
import { OidcClientService } from './authentications/oidc/oidc-client.service';
import { GetPreselectedCollectiviteRouter } from './authentications/oidc/get-preselected-collectivite/get-preselected-collectivite.router';
import { GetPreselectedCollectiviteService } from './authentications/oidc/get-preselected-collectivite/get-preselected-collectivite.service';
import { LinkOidcIdentityToUserService } from './authentications/oidc/link-oidc-identity-to-user/link-oidc-identity-to-user.service';
import { GetOidcStatusRouter } from './authentications/oidc/get-oidc-status/get-oidc-status.router';
import { GetOidcStatusService } from './authentications/oidc/get-oidc-status/get-oidc-status.service';
import { OidcSessionTicketService } from './authentications/oidc/oidc-session-ticket/oidc-session-ticket.service';
import { UserPreferencesRepository } from './preferences/user-preferences.repository';
import { UserPreferencesRouter } from './preferences/user-preferences.router';
import { UserPreferencesService } from './preferences/user-preferences.service';
import { UsersRouter } from './users.router';
import { ListUsersRepository } from './users/list-users/list-users.repository';
import { ListUsersRouter } from './users/list-users/list-users.router';
import { ListUsersService } from './users/list-users/list-users.service';
import { UpdateUserRouter } from './users/update-user/update-user.router';
import { UpdateUserService } from './users/update-user/update-user.service';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';

@Global()
@Module({
  imports: [
    NestjsFormDataModule,
    TransactionModule,
    JwtModule.register({
      global: true,
      secret: process.env.SUPABASE_JWT_SECRET,
      signOptions: {
        expiresIn: '6h',
      },
    }),
  ],
  controllers: [
    ApikeysController,
    ListUsersController,
    OidcController,
    CreateUserOidcIdentityController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    PermissionService,
    GetUserRolesAndPermissionsService,
    GetUserRolesAndPermissionsRepository,

    OidcClientService,
    LoginUserWithOidcProviderService,
    LinkOidcIdentityToUserService,
    CreateSupabaseSessionService,
    OidcSessionTicketService,
    LinkOidcIdentityToUserSessionService,
    LinkOidcIdentityToUserSessionRouter,
    CreateUserOidcIdentityService,
    InviteUserToLinkOidcIdentityService,
    InviteUserToLinkOidcIdentityRouter,
    ConfirmOidcIdentityLinkedToUserService,
    ConfirmOidcIdentityLinkedToUserRouter,
    HandleUserOidcIdentitiesService,
    HandleUserOidcIdentitiesRouter,
    GetPreselectedCollectiviteService,
    GetPreselectedCollectiviteRouter,
    GetOidcStatusService,
    GetOidcStatusRouter,
    EmailService,

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

    UserPreferencesRepository,
    UserPreferencesService,
    UserPreferencesRouter,
  ],
  exports: [
    PermissionService,
    GetUserRolesAndPermissionsService,
    UpdateUserRoleService,
    ListUsersService,
    UsersRouter,
    UserPreferencesRouter,
    ConvertJwtToAuthUserService,
    UserPreferencesService,
  ],
})
export class UsersModule {}
