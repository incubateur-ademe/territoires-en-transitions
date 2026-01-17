import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import z from 'zod';
import { StartAuditService } from './start-audit.service';

@Injectable()
export class StartAuditRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly startAuditService: StartAuditService
  ) {}

  router = this.trpc.router({
    startAudit: this.trpc.authedProcedure
      .input(z.object({ auditId: z.number() }))
      .mutation(async ({ input: { auditId }, ctx: { user } }) => {
        await this.permissions.isAllowed(
          user,
          PermissionOperationEnum['REFERENTIELS.AUDIT'],
          ResourceType.AUDIT,
          auditId
        );

        return this.startAuditService.startAudit({ auditId });
      }),
  });
}
