import { ExportConnectService } from '@/backend/collectivites/membres/export-connect.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { exportConnectCreateSchema } from '@/domain/collectivites';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { CollectiviteMembresService } from './membres.service';

@Injectable()
export class CollectiviteMembresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CollectiviteMembresService,
    private readonly exportConnectService: ExportConnectService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(this.service.listInputSchema)
      .query(({ input }) => this.service.list(input)),

    update: this.trpc.authedProcedure
      .input(this.service.updateInputSchema)
      .mutation(({ input }) => this.service.update(input)),

    listExportConnect: this.trpc.authedOrServiceRoleProcedure.query(({ ctx }) =>
      this.exportConnectService.list(ctx.user)
    ),

    upsertExportConnect: this.trpc.authedOrServiceRoleProcedure
      .input(z.array(exportConnectCreateSchema))
      .mutation(({ input, ctx }) =>
        this.exportConnectService.upsert(input, ctx.user)
      ),
  });
}
