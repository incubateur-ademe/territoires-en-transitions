import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import {
  getMesureAuditStatutRequestSchema,
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
    getMesureAuditStatut: this.trpc.authedProcedure
      .input(getMesureAuditStatutRequestSchema)
      .query(({ input, ctx }) => this.service.getStatut(input, ctx.user)),

    updateMesureAuditStatut: this.trpc.authedProcedure
      .input(updateMesureAuditStatutRequestSchema)
      .mutation(({ input, ctx }) => this.service.updateStatut(input, ctx.user)),
  });
}
