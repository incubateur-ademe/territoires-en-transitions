import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ApikeysRouter } from './apikeys/apikeys.router';
import { UpdateUserRoleRouter } from './authorizations/update-user-role/update-user-role.router';
import { ConfirmOidcIdentityLinkedToUserRouter } from './authentications/oidc/confirm-oidc-identity-linked-to-user/confirm-oidc-identity-linked-to-user.router';
import { InviteUserToLinkOidcIdentityRouter } from './authentications/oidc/invite-user-to-link-oidc-identity/invite-user-to-link-oidc-identity.router';
import { HandleUserOidcIdentitiesRouter } from './authentications/oidc/handle-user-oidc-identities/handle-user-oidc-identities.router';
import { LinkOidcIdentityToUserSessionRouter } from './authentications/oidc/link-oidc-identity-to-user-session/link-oidc-identity-to-user-session.router';
import { GetPreselectedCollectiviteRouter } from './authentications/oidc/get-preselected-collectivite/get-preselected-collectivite.router';
import { GetOidcStatusRouter } from './authentications/oidc/get-oidc-status/get-oidc-status.router';
import { UserPreferencesRouter } from './preferences/user-preferences.router';
import { ListUsersRouter } from './users/list-users/list-users.router';
import { UpdateUserRouter } from './users/update-user/update-user.router';
@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listUsersRouter: ListUsersRouter,
    private readonly updateUserRouter: UpdateUserRouter,
    private readonly preferencesRouter: UserPreferencesRouter,
    private readonly apikeysRouter: ApikeysRouter,
    private readonly updateUserRoleRouter: UpdateUserRoleRouter,
    private readonly lierIdentiteParSessionRouter: LinkOidcIdentityToUserSessionRouter,
    private readonly demanderRattachementRouter: InviteUserToLinkOidcIdentityRouter,
    private readonly confirmerRattachementRouter: ConfirmOidcIdentityLinkedToUserRouter,
    private readonly gererIdentitesRouter: HandleUserOidcIdentitiesRouter,
    private readonly preselectionCollectiviteRouter: GetPreselectedCollectiviteRouter,
    private readonly statutMigrationRouter: GetOidcStatusRouter
  ) {}

  router = this.trpc.router({
    apikeys: this.apikeysRouter.router,
    preferences: this.preferencesRouter.router,

    authorizations: this.trpc.mergeRouters(this.updateUserRoleRouter.router),

    users: this.trpc.mergeRouters(
      this.listUsersRouter.router,
      this.updateUserRouter.router
    ),

    authentications: this.trpc.router({
      oidc: this.trpc.mergeRouters(
        this.lierIdentiteParSessionRouter.router,
        this.demanderRattachementRouter.router,
        this.confirmerRattachementRouter.router,
        this.gererIdentitesRouter.router,
        this.preselectionCollectiviteRouter.router,
        this.statutMigrationRouter.router
      ),
    }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
