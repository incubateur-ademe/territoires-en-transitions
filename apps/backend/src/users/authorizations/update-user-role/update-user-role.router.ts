import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { updateUserRoleErrorConfig } from './update-user-role.error';
import { UpdateUserRoleService } from './update-user-role.service';

const getResultDataOrThrowError = createTrpcErrorHandler(
  updateUserRoleErrorConfig
);

@Injectable()
export class UpdateUserRoleRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly roleUpdateService: UpdateUserRoleService
  ) {}

  router = this.trpc.router({
    toggleSupportMode: this.trpc.authedProcedure
      .input(
        z.object({
          isEnabled: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.roleUpdateService.toggleSupportMode({
          userId: user.id,
          isEnabled: input.isEnabled,
        });

        return getResultDataOrThrowError(result);
      }),
  });
}
