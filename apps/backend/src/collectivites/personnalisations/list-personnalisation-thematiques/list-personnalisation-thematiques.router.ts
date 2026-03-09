import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listThematiquesInputSchema } from './list-personnalisation-thematiques.input';
import { ListPersonnalisationThematiquesService } from './list-personnalisation-thematiques.service';

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
        return this.listThematiquesService.listThematiques(input, ctx.user);
      }),
  });
}
