import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { listDefinitionsRequestSchema } from './list-definitions.request';
import ListDefinitionsService from './list-definitions.service';

@Injectable()
export class IndicateurDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListDefinitionsService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDefinitionsRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.getDefinitionsDetaillees(input, ctx.user);
      }),
  });
}
