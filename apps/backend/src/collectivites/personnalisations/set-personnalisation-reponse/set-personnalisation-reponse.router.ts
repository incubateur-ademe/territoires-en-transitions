import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setPersonnalisationReponseErrorConfig } from './set-personnalisation-reponse.errors';
import { setPersonnalisationReponseInputSchema } from './set-personnalisation-reponse.input';
import { SetPersonnalisationReponseService } from './set-personnalisation-reponse.service';

@Injectable()
export class SetPersonnalisationReponseRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setPersonnalisationReponseService: SetPersonnalisationReponseService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setPersonnalisationReponseErrorConfig
  );

  router = this.trpc.router({
    setReponse: this.trpc.authedProcedure
      .input(setPersonnalisationReponseInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.setPersonnalisationReponseService.setPersonnalisationReponse(
            input,
            ctx.user
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
