import { Injectable } from '@nestjs/common';
import { filtersRequestSchema } from '@tet/backend/collectivites/recherches/filters.request';
import RecherchesService from '@tet/backend/collectivites/recherches/recherches.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';

@Injectable()
export class RecherchesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: RecherchesService
  ) {}

  router = this.trpc.router({
    collectivites: this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(({ input, ctx }) =>
        this.service.collectivites(input, { user: ctx.user })
      ),
    referentiels: this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(({ input, ctx }) =>
        this.service.referentiels(input, { user: ctx.user })
      ),
    plans: this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(({ input, ctx }) => this.service.plans(input, { user: ctx.user })),
  });
}
