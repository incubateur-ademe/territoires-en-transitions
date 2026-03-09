import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { ListPersonnalisationThematiquesService } from './list-personnalisation-thematiques.service';

const listThematiquesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

@Injectable()
export class ListPersonnalisationThematiquesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listThematiquesService: ListPersonnalisationThematiquesService
  ) {}

  router = this.trpc.router({
    listThematiques: this.trpc.authedProcedure
      .input(listThematiquesInputSchema)
      .query(async ({ input, ctx }) => {
        return this.listThematiquesService.listThematiques(
          input.collectiviteId,
          ctx.user
        );
      }),
  });
}
