import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setPublicationStatusErrorConfig } from './set-publication-status.errors';
import { setPublicationStatusInputSchema } from './set-publication-status.input';
import { SetPublicationStatusService } from './set-publication-status.service';

@Injectable()
export class SetPublicationStatusRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setPublicationStatusService: SetPublicationStatusService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setPublicationStatusErrorConfig
  );

  router = this.trpc.router({
    setPublicationStatus: this.trpc.authedProcedure
      .input(setPublicationStatusInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.setPublicationStatusService.setPublicationStatus(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
