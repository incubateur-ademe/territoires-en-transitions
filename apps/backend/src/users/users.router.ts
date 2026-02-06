import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ApikeysRouter } from './apikeys/apikeys.router';
import { UpdateUserRoleRouter } from './authorizations/update-user-role/update-user-role.router';
import { InvitationsRouter } from './invitations/invitations.router';
import { UserPreferencesRouter } from './preferences/user-preferences.router';
import { ListUsersRouter } from './users/list-users/list-users.router';
import { UpdateUserRouter } from './users/update-user/update-user.router';

@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listUsersRouter: ListUsersRouter,
    private readonly updateUserRouter: UpdateUserRouter,
    private readonly invitationRouter: InvitationsRouter,
    private readonly preferencesRouter: UserPreferencesRouter,
    private readonly apikeysRouter: ApikeysRouter,
    private readonly updateUserRoleRouter: UpdateUserRoleRouter
  ) {}

  router = this.trpc.router({
    invitations: this.invitationRouter.router,
    apikeys: this.apikeysRouter.router,
    preferences: this.preferencesRouter.router,

    authorizations: this.trpc.mergeRouters(this.updateUserRoleRouter.router),

    users: this.trpc.mergeRouters(
      this.listUsersRouter.router,
      this.updateUserRouter.router
    ),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
