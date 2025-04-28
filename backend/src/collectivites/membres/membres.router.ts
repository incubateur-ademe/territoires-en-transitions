import { ExportConnectService } from '@/backend/collectivites/membres/export-connect.service';
import { upsertExportConnectSchema } from '@/backend/collectivites/membres/export-connect.table';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
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

    listExportConnect: this.trpc.authedProcedure.query(({ ctx }) =>
      this.exportConnectService.list(ctx.user)
    ),

    upsertExportConnect: this.trpc.authedProcedure
      .input(upsertExportConnectSchema)
      .mutation(({ input, ctx }) =>
        this.exportConnectService.upsert(input, ctx.user)
      ),
  });
}
