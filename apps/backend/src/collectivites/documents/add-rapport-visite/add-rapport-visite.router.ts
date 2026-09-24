import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { preuveRapportSchema } from '@tet/domain/collectivites';
import { addRapportVisiteInputSchema } from './add-rapport-visite.input';
import { AddRapportVisiteService } from './add-rapport-visite.service';

@Injectable()
export class AddRapportVisiteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addRapportVisiteService: AddRapportVisiteService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    addRapportVisite: this.trpc.authedProcedure
      .input(addRapportVisiteInputSchema)
      .output(preuveRapportSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.addRapportVisiteService.addRapportVisite(
          input,
          { user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
