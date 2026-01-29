import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TrpcService } from '../../../utils/trpc/trpc.service';
import { ImportPlanApplicationService } from './import-plan.application-service';
import { importPlanInputSchema } from './import-plan.input';

@Injectable()
export class ImportPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportPlanApplicationService
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
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error.message,
          });
        }

        return result.data;
      }),
  });
}
