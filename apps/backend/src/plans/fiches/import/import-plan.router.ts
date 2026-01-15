import { Injectable } from '@nestjs/common';
import { importPlanInputSchema } from '@tet/backend/plans/fiches/import/import-plan.input';
import { ImportPlanService } from '@tet/backend/plans/fiches/import/import-plan.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { TRPCError } from '@trpc/server';

@Injectable()
export class ImportPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportPlanService
  ) {}

  router = this.trpc.router({
    import: this.trpc.authedProcedure
      .input(importPlanInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.import(
          ctx.user,
          input.file,
          input.collectiviteId,
          input.planName,
          input.planType,
          input.pilotes,
          input.referents
        );

        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error.message,
          });
        }

        return result.data;
      }),
  });
}
