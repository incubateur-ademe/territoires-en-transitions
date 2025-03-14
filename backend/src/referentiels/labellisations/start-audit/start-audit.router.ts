import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PermissionOperation, ResourceType } from '@/domain/auth';
import { Injectable } from '@nestjs/common';
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
          PermissionOperation.REFERENTIELS_AUDIT,
          ResourceType.AUDIT,
          auditId
        );

        return this.startAuditService.startAudit({ auditId });
      }),
  });
}
