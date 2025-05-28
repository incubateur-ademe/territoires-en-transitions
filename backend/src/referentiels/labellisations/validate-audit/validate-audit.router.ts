import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/auth/index-domain';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { ValidateAuditService } from './validate-audit.service';

@Injectable()
export class ValidateAuditRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly permissions: PermissionService,
    private readonly validateAudit: ValidateAuditService
  ) {}

  router = this.trpc.router({
    validateAudit: this.trpc.authedProcedure
      .input(z.object({ auditId: z.number() }))
      .mutation(async ({ input: { auditId }, ctx: { user } }) => {
        await this.permissions.isAllowed(
          user,
          PermissionOperationEnum['REFERENTIELS.AUDIT'],
          ResourceType.AUDIT,
          auditId
        );

        return this.validateAudit.validateAudit({ auditId });
      }),
  });
}
