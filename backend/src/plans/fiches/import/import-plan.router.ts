import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { importRequestSchema } from '@/backend/plans/fiches/import/import-plan.request';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PermissionOperation, ResourceType } from '@/domain/auth';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImportPlanRouter {
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
          PermissionOperation.PLANS_FICHES_IMPORT,
          ResourceType.PLATEFORME,
          null
        );

        const { file, collectiviteId, planName, planType } = input;
        return this.service.import(file, collectiviteId, planName, planType);
      }),
  });
}
