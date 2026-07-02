import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ResourceType } from '@tet/domain/users';
import z from 'zod';
import { validateAuditErrorConfig } from './validate-audit.errors';
import { ValidateAuditService } from './validate-audit.service';

@Injectable()
export class ValidateAuditRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    validateAuditErrorConfig
  );

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
          'referentiels.labellisations.validate_audit',
          ResourceType.AUDIT,
          auditId
        );

        const result = await this.validateAudit.validateAudit({ auditId });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
