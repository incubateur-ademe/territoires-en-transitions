import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { startAuditRulesErrors } from '@tet/domain/referentiels';

const specificErrors = [...startAuditRulesErrors, 'DATABASE_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const startAuditErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    AUDIT_NOT_FOUND: {
      code: 'BAD_REQUEST',
      message: "L'audit demandé n'a pas été trouvé.",
    },
    AUDIT_NOT_REQUESTED: {
      code: 'BAD_REQUEST',
      message: "L'audit ne peut pas être commencé car il n'a pas été demandé.",
    },
    USER_NOT_AUDITOR: {
      code: 'BAD_REQUEST',
      message: "L'utilisateur n'est pas un auditeur pour cette collectivité.",
    },
    DATABASE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        "Une erreur de base de données s'est produite lors du démarrage de l'audit",
    },
  },
};

export const StartAuditErrorEnum = createErrorsEnum(specificErrors);
export type StartAuditError = keyof typeof StartAuditErrorEnum;
