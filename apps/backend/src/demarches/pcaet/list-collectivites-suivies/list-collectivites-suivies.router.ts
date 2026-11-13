import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDossiersInstructionErrorConfig } from '../list-dossiers-instruction/list-dossiers-instruction.errors';
import { listCollectivitesSuiviesInputSchema } from './list-collectivites-suivies.input';
import { ListCollectivitesSuiviesService } from './list-collectivites-suivies.service';

@Injectable()
export class ListCollectivitesSuiviesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listCollectivitesSuiviesService: ListCollectivitesSuiviesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDossiersInstructionErrorConfig
  );

  router = this.trpc.router({
    listCollectivitesSuivies: this.trpc.authedProcedure
      .input(listCollectivitesSuiviesInputSchema)
      .query(async ({ input, ctx }) => {
        const result =
          await this.listCollectivitesSuiviesService.listCollectivitesSuivies(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
