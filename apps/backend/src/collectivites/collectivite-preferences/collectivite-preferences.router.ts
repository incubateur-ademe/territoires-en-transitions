import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { collectivitePreferencesErrorConfig } from './collectivite-preferences.errors';
import { updateCollectivitePreferencesInputSchema } from './collectivite-preferences.repository';
import { CollectivitePreferencesService } from './collectivite-preferences.service';

@Injectable()
export class CollectivitePreferencesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CollectivitePreferencesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    collectivitePreferencesErrorConfig
  );

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(
        z.object({
          collectiviteId: z.number(),
          preferences: updateCollectivitePreferencesInputSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await this.service.updatePreferences(
          input.collectiviteId,
          input.preferences,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
