import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPlanFichesSecteursAVerifierInputSchema } from './list-plan-fiches-secteurs-a-verifier.input';
import { listPlanFichesSecteursAVerifierOutputSchema } from './list-plan-fiches-secteurs-a-verifier.output';
import { ListPlanFichesSecteursAVerifierService } from './list-plan-fiches-secteurs-a-verifier.service';

@Injectable()
export class ListPlanFichesSecteursAVerifierRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListPlanFichesSecteursAVerifierService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    listPlanFichesSecteursAVerifier: this.trpc.authedProcedure
      .input(listPlanFichesSecteursAVerifierInputSchema)
      .output(listPlanFichesSecteursAVerifierOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.service.listFiches(input, { user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
