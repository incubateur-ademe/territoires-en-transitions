import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  updateUserInputSchema,
  updateUserPreferencesInputSchema,
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
    updatePreferences: this.trpc.authedProcedure
      .input(updateUserPreferencesInputSchema)
      .mutation(({ input, ctx: { user } }) =>
        this.updateUserService.updateUserPreferences(user, input)
      ),
  });
}
