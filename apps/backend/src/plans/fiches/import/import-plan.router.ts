import { Injectable } from '@nestjs/common';
import { importRequestSchema } from '@tet/backend/plans/fiches/import/import-plan.request';
import { ImportPlanService } from '@tet/backend/plans/fiches/import/import-plan.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { PermissionOperationEnum } from '@tet/domain/users';

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

        const { file, collectiviteId, planName, planType, pilotes, referents } =
          input;
        return this.service.import(
          ctx.user,
          file,
          collectiviteId,
          planName,
          planType,
          pilotes,
          referents
        );
      }),
  });
}
