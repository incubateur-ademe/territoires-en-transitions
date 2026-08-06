import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { setDemarchePcaetDocumentCouvertureErrorConfig } from './set-document-couverture.errors';
import { setDemarchePcaetDocumentCouvertureInputSchema } from './set-document-couverture.input';
import { SetDemarchePcaetDocumentCouvertureService } from './set-document-couverture.service';

@Injectable()
export class SetDemarchePcaetDocumentCouvertureRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly setDemarchePcaetDocumentCouvertureService: SetDemarchePcaetDocumentCouvertureService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    setDemarchePcaetDocumentCouvertureErrorConfig
  );

  router = this.trpc.router({
    setCouverture: this.trpc.authedProcedure
      .input(setDemarchePcaetDocumentCouvertureInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.setDemarchePcaetDocumentCouvertureService.setCouverture(
            input,
            { user: ctx.user }
          );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
