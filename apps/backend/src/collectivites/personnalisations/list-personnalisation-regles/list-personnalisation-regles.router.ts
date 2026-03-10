import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPersonnalisationReglesInputSchema } from './list-personnalisation-regles.input';
import { ListPersonnalisationReglesService } from './list-personnalisation-regles.service';

@Injectable()
export class ListPersonnalisationReglesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listReglesService: ListPersonnalisationReglesService
  ) {}

  router = this.trpc.router({
    listRegles: this.trpc.authedProcedure
      .input(listPersonnalisationReglesInputSchema)
      .query(async ({ input }) => {
        return this.listReglesService.listRegles(input);
      }),
  });
}
