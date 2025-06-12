import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { ApikeysRouter } from './apikeys/apikeys.router';
import { InvitationsRouter } from './invitations/invitations.router';
import { ListUsersService } from './users/list-users/list-users.service';

@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListUsersService,
    private readonly invitationRouter: InvitationsRouter,
    private readonly apikeysRouter: ApikeysRouter
  ) {}

  router = this.trpc.router({
    invitations: this.invitationRouter.router,
    apikeys: this.apikeysRouter.router,

    get: this.trpc.serviceRoleProcedure
      .input(this.service.getInputSchema)
      .query(({ input }) => this.service.getUserWithPermissions(input)),

    getAll: this.trpc.serviceRoleProcedure
      .input(this.service.getAllInputSchema)
      .query(({ input }) => this.service.usersInfoByEmail(input)),
  });
}
