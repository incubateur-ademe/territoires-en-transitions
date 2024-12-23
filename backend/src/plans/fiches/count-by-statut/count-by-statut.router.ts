import { fetchFichesFilterRequestSchema } from '@/backend/plans/fiches/shared/fetch-fiches-filter.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CountByStatutService } from './count-by-statut.service';

const inputSchema = z.object({
  collectiviteId: z.number(),
  filter: fetchFichesFilterRequestSchema,
});

@Injectable()
export class CountByStatutRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CountByStatutService
  ) {}

  router = this.trpc.router({
    countByStatut: this.trpc.authedProcedure
      .input(inputSchema)
      .query(({ input }) => {
        const { collectiviteId, filter } = input;
        return this.service.countByStatut(collectiviteId, filter);
      }),
  });
}
