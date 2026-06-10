import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { duplicateFicheErrorConfig } from './duplicate-fiche.errors';
import { duplicateFicheInputSchema } from './duplicate-fiche.input';
import { DuplicateFicheService } from './duplicate-fiche.service';

@Injectable()
export class DuplicateFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: DuplicateFicheService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    duplicateFicheErrorConfig
  );

  router = this.trpc.router({
    duplicate: this.trpc.authedProcedure
      .input(duplicateFicheInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.duplicate(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
