import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { importRequestSchema } from '@/backend/plans/fiches/import/import-plan.request';
import { PermissionOperation, ResourceType } from '@/backend/auth';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';

@Injectable()
export class ImportPlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportPlanService,
    private readonly permission : PermissionService
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
        return this.service.import(
          file,
          collectiviteId,
          planName,
          planType
        );
      }),
  });
}
