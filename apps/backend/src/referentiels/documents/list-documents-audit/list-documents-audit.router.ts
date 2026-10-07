import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDocumentsAuditErrorConfig } from './list-documents-audit.errors';
import { listDocumentsAuditInputSchema } from './list-documents-audit.input';
import { ListDocumentsAuditService } from './list-documents-audit.service';

@Injectable()
export class ListDocumentsAuditRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDocumentsAuditService: ListDocumentsAuditService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDocumentsAuditErrorConfig
  );

  router = this.trpc.router({
    listDocumentsAudit: this.trpc.authedProcedure
      .input(listDocumentsAuditInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.listDocumentsAuditService.listDocumentsAudit(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
