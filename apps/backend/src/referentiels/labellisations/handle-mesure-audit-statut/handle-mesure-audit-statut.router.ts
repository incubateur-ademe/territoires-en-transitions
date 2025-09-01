import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import {
  getMesureAuditStatutInputSchema,
  getMesureAuditStatutOutputSchema,
  listMesureAuditStatutsInputSchema,
  listMesureAuditStatutsOutputSchema,
  updateMesureAuditStatutRequestSchema,
} from './handle-mesure-audit-statut.dto';
import { HandleMesureAuditStatutService } from './handle-mesure-audit-statut.service';

@Injectable()
export class HandleMesureAuditStatutRouter {
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
      .mutation(({ input, ctx }) => this.service.updateStatut(input, ctx.user)),
  });
}
