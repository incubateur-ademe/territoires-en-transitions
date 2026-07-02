import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  getMesureAuditStatutInputSchema,
  getMesureAuditStatutOutputSchema,
  listMesureAuditStatutsInputSchema,
  listMesureAuditStatutsOutputSchema,
  updateMesureAuditStatutRequestSchema,
} from './handle-mesure-audit-statut.dto';
import { handleMesureAuditStatutErrorConfig } from './handle-mesure-audit-statut.errors';
import { HandleMesureAuditStatutService } from './handle-mesure-audit-statut.service';

@Injectable()
export class HandleMesureAuditStatutRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    handleMesureAuditStatutErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleMesureAuditStatutService
  ) {}

  router = this.trpc.router({
    listMesureAuditStatuts: this.trpc.authedProcedure
      .input(listMesureAuditStatutsInputSchema)
      .output(listMesureAuditStatutsOutputSchema)
      .query(({ input, ctx }) => this.service.listStatuts(input, ctx.user)),

    getMesureAuditStatut: this.trpc.authedProcedure
      .input(getMesureAuditStatutInputSchema)
      .output(getMesureAuditStatutOutputSchema)
      .query(({ input, ctx }) => this.service.getStatut(input, ctx.user)),

    updateMesureAuditStatut: this.trpc.authedProcedure
      .input(updateMesureAuditStatutRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.updateStatut(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
