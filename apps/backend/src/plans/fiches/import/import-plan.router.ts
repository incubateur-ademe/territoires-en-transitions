import { Injectable } from '@nestjs/common';
import { importRequestSchema } from '@tet/backend/plans/fiches/import/import-plan.request';
import { ImportPlanService } from '@tet/backend/plans/fiches/import/import-plan.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';

@Injectable()
export class ImportPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportPlanService
  ) {}

  router = this.trpc.router({
    import: this.trpc.authedProcedure
      .input(importRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return this.service.import(input, ctx.user);
      }),
  });
}
