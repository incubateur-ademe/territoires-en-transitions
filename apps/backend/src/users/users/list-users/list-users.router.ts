import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { ListUsersService } from './list-users.service';

@Injectable()
export class ListUsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listUsersService: ListUsersService
  ) {}

  router = this.trpc.router({
    get: this.trpc.authedProcedure.query(({ ctx: { user } }) =>
      this.listUsersService.getUserWithRolesAndPermissionsBy({
        userId: user.id,
      })
    ),

    listByEmails: this.trpc.serviceRoleProcedure
      .input(
        z.object({
          emails: z.array(z.string()),
        })
      )
      .query(({ input }) => this.listUsersService.listUsersInfoBy(input)),

    getWithRolesAndPermissionsByEmail: this.trpc.serviceRoleProcedure
      .input(
        z.object({
          email: z.string(),
        })
      )
      .query(({ input }) =>
        this.listUsersService.getUserWithRolesAndPermissionsBy({
          email: input.email,
        })
      ),
  });
}
