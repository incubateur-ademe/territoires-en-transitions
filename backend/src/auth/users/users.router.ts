import { isAuthenticatedUser } from '@/backend/auth/index-domain';
import {
  updateUserInputSchema,
  UpdateUserService,
} from '@/backend/auth/users/update-user.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UsersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getUserService: UsersService,
    private readonly updateUserService: UpdateUserService
  ) {}

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(this.getUserService.getInputSchema)
      .query(({ input, ctx }) =>
        this.getUserService.getUserWithPermissions(input, ctx.user)
      ),

    update: this.trpc.authedProcedure
      .input(updateUserInputSchema)
      .mutation(({ input, ctx: { user } }) => {
        if (!isAuthenticatedUser(user)) {
          throw new UnauthorizedException("L'utilisateur n'est pas connecté");
        }

        this.updateUserService.updateUser(input, user);
      }),
  });
}
