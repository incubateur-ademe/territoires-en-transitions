import { Injectable } from '@nestjs/common';
import { collectivitePreferencesErrorConfig } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.errors';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { isServiceRoleUser } from '@tet/backend/users/models/auth.models';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ResourceType } from '@tet/domain/users';
import { z } from 'zod';
import { ResetDisplayPreferencesService } from './reset-display-preferences.service';

const collectiviteIdInputSchema = z.object({ collectiviteId: z.number() });

@Injectable()
export class ResetDisplayPreferencesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ResetDisplayPreferencesService,
    private readonly permission: PermissionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    collectivitePreferencesErrorConfig
  );

  router = this.trpc.router({
    resetCollectiviteDisplayPreferences: this.trpc.authedOrServiceRoleProcedure
      .input(collectiviteIdInputSchema)
      .mutation(async ({ ctx, input }) => {
        if (!isServiceRoleUser(ctx.user)) {
          await this.permission.isAllowed(
            ctx.user,
            'collectivites.mutate',
            ResourceType.COLLECTIVITE,
            input.collectiviteId
          );
        }
        const result = await this.service.resetCollectiviteDisplayPreferences(
          input.collectiviteId
        );
        return this.getResultDataOrThrowError(result);
      }),

    resetAllCollectivitesDisplayPreferences: this.trpc.serviceRoleProcedure
      .input(z.object({}))
      .mutation(async () => {
        return this.service.resetAllCollectivitesDisplayPreferences();
      }),
  });
}
