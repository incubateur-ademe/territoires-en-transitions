import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { importRequestSchema } from '@/backend/plans/fiches/import/import-plan.request';

@Injectable()
export class ImportPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportPlanService
  ) {}

  router = this.trpc.router({
    import: this.trpc.authedProcedure
      .input(importRequestSchema)
      .mutation(({ input, ctx }) => {
        const { file, collectiviteId, planName, planType } = input;
        return this.service.import(
          file,
          collectiviteId,
          planName,
          planType
        );
      }),
  });
}
