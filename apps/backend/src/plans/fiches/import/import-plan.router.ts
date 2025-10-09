import { importRequestSchema } from '@/backend/plans/fiches/import/import-plan.request';
import { ImportPlanService } from '@/backend/plans/fiches/import/import-plan.service';
import { ImportErrorCode } from '@/backend/plans/fiches/import/types/import-error';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable, Logger } from '@nestjs/common';
import { TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server';

/**
 * Maps ImportErrorCode to appropriate TRPC error codes
 *
 * HTTP Status Code Guidelines:
 * - 400 BAD_REQUEST: Malformed request (syntax error, missing params)
 * - 422 UNPROCESSABLE_CONTENT: Well-formed but semantically incorrect content
 * - 500 INTERNAL_SERVER_ERROR: System/infrastructure issues
 */
function mapImportErrorToTRPCCode(
  errorCode: ImportErrorCode
): TRPC_ERROR_CODE_KEY {
  switch (errorCode) {
    // 422: Content is understood but semantically incorrect
    case ImportErrorCode.EXCEL_PARSING_FAILED:
    case ImportErrorCode.INVALID_FILE_FORMAT:
    case ImportErrorCode.TRANSFORMATION_FAILED:
    case ImportErrorCode.VALIDATION_FAILED:
    case ImportErrorCode.MISSING_RESOLVED_ENTITIES:
    case ImportErrorCode.ADAPTATION_FAILED:
      return 'UNPROCESSABLE_CONTENT';

    // Server errors - System issues, not user's fault
    case ImportErrorCode.ENTITY_RESOLUTION_FAILED:
    case ImportErrorCode.TAG_CREATION_FAILED:
    case ImportErrorCode.PLAN_CREATION_FAILED:
    case ImportErrorCode.INVALID_PLAN_STRUCTURE:
    case ImportErrorCode.TRANSACTION_FAILED:
    case ImportErrorCode.UNKNOWN_ERROR:
      return 'INTERNAL_SERVER_ERROR';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

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
          const errorCode = mapImportErrorToTRPCCode(result.error.code);

          this.logger.error('Import failed', {
            code: result.error.code,
            httpCode: errorCode,
            details: result.error.technicalDetails,
            collectiviteId,
            planName,
          });
          throw new TRPCError({
            code: errorCode,
            message: result.error.userMessage,
          });
        }

        return result.data;
      }),
  });
}
