import { importRequestSchema } from '@/backend/plans/fiches/import/import-plan.request';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/users/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
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
          PermissionOperationEnum['PLANS.FICHES.IMPORT'],
          ResourceType.PLATEFORME,
          null
        );

        const { file, collectiviteId, planName, planType } = input;
        return this.service.import(file, collectiviteId, planName, planType);
      }),
  });
}
