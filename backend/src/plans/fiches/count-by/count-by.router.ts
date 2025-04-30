import { listFichesRequestFiltersSchema } from '@/backend/plans/fiches/list-fiches/list-fiches.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { countByPropertyEnumSchema } from './count-by-property-options.enum';
import { CountByService } from './count-by.service';

const inputSchema = z.object({
  collectiviteId: z.number(),
  countByProperty: countByPropertyEnumSchema,
  filter: listFichesRequestFiltersSchema,
});

@Injectable()
export class CountByRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CountByService
  ) {}

  router = this.trpc.router({
    countBy: this.trpc.authedProcedure.input(inputSchema).query(({ input }) => {
      const { collectiviteId, countByProperty, filter } = input;
      return this.service.countByProperty(
        collectiviteId,
        countByProperty,
        filter
      );
    }),
  });
}
