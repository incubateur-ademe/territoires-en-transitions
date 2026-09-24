import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { preuveAuditSchema } from '@tet/domain/collectivites';
import { addAuditDocumentErrorConfig } from './add-audit-document.errors';
import { addAuditDocumentInputSchema } from './add-audit-document.input';
import { AddAuditDocumentService } from './add-audit-document.service';

@Injectable()
export class AddAuditDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addAuditDocumentService: AddAuditDocumentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    addAuditDocumentErrorConfig
  );

  router = this.trpc.router({
    addAuditDocument: this.trpc.authedProcedure
      .input(addAuditDocumentInputSchema)
      .output(preuveAuditSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.addAuditDocumentService.addAuditDocument(
          input,
          { user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
