import {
  createErrorsEnum,
  type TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../../shared/demarche-pcaet-access.service';

const specificErrors = [...demarchePcaetAccessErrors] as const;

type SpecificError = (typeof specificErrors)[number];

export const setDiagnosticReferenceYearErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DEMARCHE_PCAET_NON_MODIFIABLE: {
        code: 'CONFLICT',
        message:
          "Le diagnostic n'est modifiable que pendant l'élaboration du dépôt",
      },
    },
  };

export const SetDiagnosticReferenceYearErrorEnum =
  createErrorsEnum(specificErrors);

export type SetDiagnosticReferenceYearError =
  keyof typeof SetDiagnosticReferenceYearErrorEnum;
