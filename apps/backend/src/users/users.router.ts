import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ApikeysRouter } from './apikeys/apikeys.router';
import { UpdateUserRoleRouter } from './authorizations/update-user-role/update-user-role.router';
import { InvitationsRouter } from './invitations/invitations.router';
import { ListUsersService } from './users/list-users/list-users.service';
import {
  updateUserInputSchema,
  UpdateUserService,
} from './users/update-user/update-user.service';

@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listUsersService: ListUsersService,
    private readonly updateUserService: UpdateUserService,
    private readonly invitationRouter: InvitationsRouter,
    private readonly apikeysRouter: ApikeysRouter,
    private readonly updateUserRoleRouter: UpdateUserRoleRouter
  ) {}

  router = this.trpc.router({
    invitations: this.invitationRouter.router,
    apikeys: this.apikeysRouter.router,
    authorizations: this.trpc.mergeRouters(this.updateUserRoleRouter.router),

    getDetails: this.trpc.authedProcedure.query(({ ctx: { user } }) =>
      this.listUsersService.getUserWithAccesses(user)
    ),

    get: this.trpc.serviceRoleProcedure
      .input(this.listUsersService.getInputSchema)
      .query(({ input }) =>
        this.listUsersService.getUserWithAccessesByEmail(input.email)
      ),

    getAll: this.trpc.serviceRoleProcedure
      .input(this.listUsersService.getAllInputSchema)
      .query(({ input }) => this.listUsersService.usersInfoByEmail(input)),

    update: this.trpc.authedProcedure
      .input(updateUserInputSchema)
      .mutation(({ input, ctx: { user } }) =>
        this.updateUserService.updateUser(input, user)
      ),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
