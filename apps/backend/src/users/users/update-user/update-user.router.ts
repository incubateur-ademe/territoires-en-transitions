import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  updateUserInputSchema,
  UpdateUserService,
} from './update-user.service';
import { updateUserErrorConfig } from './update-user.errors';

@Injectable()
export class UpdateUserRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateUserService: UpdateUserService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateUserErrorConfig
  );

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(updateUserInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.updateUserService.updateUser(input, user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
