import { importRequestSchema } from '@/backend/plans/fiches/import/import-plan.request';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { isClientError } from '@/backend/plans/fiches/import/import.errors';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable, Logger } from '@nestjs/common';
import { TRPCError } from '@trpc/server';

@Injectable()
export class ImportPlanRouter {
  private readonly logger = new Logger(ImportPlanRouter.name);

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportPlanService,
    private readonly permission: PermissionService
  ) {}

  router = this.trpc.router({
    import: this.trpc.authedProcedure
      .input(importRequestSchema)
      .mutation(async ({ input, ctx }) => {
        await this.permission.isAllowed(
          ctx.user,
          PermissionOperationEnum['PLANS.FICHES.IMPORT'],
          ResourceType.PLATEFORME,
          null
        );

        const { file, collectiviteId, planName, planType, pilotes, referents } =
          input;

        const result = await this.service.import(
          ctx.user,
          file,
          collectiviteId,
          planName,
          planType,
          pilotes,
          referents
        );

        if (!result.success) {
          const error = result.error;

          // Log error with full details
          this.logger.error('Import failed', {
            errorType: error._tag,
            message: error.message,
            stack: error.stack,
            collectiviteId,
            planName,
          });

          // Return user-friendly error
          throw new TRPCError({
            code: isClientError(error)
              ? 'UNPROCESSABLE_CONTENT'
              : 'INTERNAL_SERVER_ERROR',
            message: error.message,
          });
        }

        return result.data;
      }),
  });
}
