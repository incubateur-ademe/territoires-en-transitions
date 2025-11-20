import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getAvailableSourcesRequestSchema } from './get-available-sources.request';
import IndicateurSourcesService from './indicateur-sources.service';

@Injectable()
export class IndicateurSourcesRouter {
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
      .query(({ input }) => {
        return this.service.getAvailableSources(input);
      }),
  });
}
