import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { referentsPcaetErrorConfig } from '../referents-pcaet.errors';
import { addReferentInputSchema } from './add-referent.input';
import { AddReferentService } from './add-referent.service';

@Injectable()
export class AddReferentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addReferentService: AddReferentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    referentsPcaetErrorConfig
  );

  router = this.trpc.router({
    add: this.trpc.authedProcedure
      .input(addReferentInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.addReferentService.add(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
