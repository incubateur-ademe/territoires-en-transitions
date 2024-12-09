import { TrpcService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { getFichesActionFilterRequestSchema } from '../models/get-fiches-actions-filter.request';
import { CountByStatutService } from './count-by-statut.service';

const inputSchema = z.object({
  collectiviteId: z.number(),
  filter: getFichesActionFilterRequestSchema,
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
