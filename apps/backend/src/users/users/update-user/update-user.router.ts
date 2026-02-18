import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  updateUserInputSchema,
  UpdateUserService,
} from './update-user.service';

@Injectable()
export class UpdateUserRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateUserService: UpdateUserService
  ) {}

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(updateUserInputSchema)
      .mutation(({ input, ctx: { user } }) =>
        this.updateUserService.updateUser(input, user)
      ),
    acceptCgu: this.trpc.authedProcedure.mutation(({ ctx: { user } }) =>
      this.updateUserService.acceptCgu(user)
    ),
  });
}
