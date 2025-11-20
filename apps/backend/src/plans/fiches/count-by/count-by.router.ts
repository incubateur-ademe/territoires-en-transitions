import { Injectable } from '@nestjs/common';
import { countByRequestSchema } from '@tet/backend/plans/fiches/count-by/count-by.types';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { CountByService } from './count-by.service';

@Injectable()
export class CountByRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CountByService
  ) {}

  router = this.trpc.router({
    countBy: this.trpc.authedProcedure
      .input(countByRequestSchema)
      .query(({ input }) => {
        const { collectiviteId, countByProperty, filter } = input;
        return this.service.countByProperty(
          collectiviteId,
          countByProperty,
          filter
        );
      }),
  });
}
