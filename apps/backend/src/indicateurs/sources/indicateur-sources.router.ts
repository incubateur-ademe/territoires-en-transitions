import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getAvailableSourcesRequestSchema } from './get-available-sources.request';
import IndicateurSourcesService from './indicateur-sources.service';

@Injectable()
export class IndicateurSourcesRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurSourcesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure.query(() => {
      return this.service.getAllSources();
    }),
    available: this.trpc.authedProcedure
      .input(getAvailableSourcesRequestSchema)
      .query(async ({ ctx, input }) => {
        const result = await this.service.getAvailableSources(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
