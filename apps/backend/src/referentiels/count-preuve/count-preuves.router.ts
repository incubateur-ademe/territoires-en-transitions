import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { countPreuvesInputSchema } from './count-preuves.input';
import { countPreuvesOutputSchema } from './count-preuves.output';
import { CountPreuvesService } from './count-preuves.service';

@Injectable()
export class CountPreuvesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly countPreuvesService: CountPreuvesService
  ) {}

  router = this.trpc.router({
    countPreuves: this.trpc.authedProcedure
      .input(countPreuvesInputSchema)
      .output(countPreuvesOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        return this.countPreuvesService.countPreuves(input, user);
      }),
  });
}
