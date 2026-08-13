import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { vulnerabiliteAccessErrors } from '../shared/demarche-pcaet-vulnerabilite-access.service';

const specificErrors = [
  ...vulnerabiliteAccessErrors,
  'DOMAINE_NON_ACCESSIBLE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const setVulnerabiliteLigneErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DIAGNOSTIC_NON_MODIFIABLE: {
        code: 'CONFLICT',
        message:
          "Le diagnostic n'est modifiable que pendant l'élaboration du dépôt",
      },
      DOMAINE_NON_ACCESSIBLE: {
        code: 'NOT_FOUND',
        message: "Ce domaine de vulnérabilité n'existe pas pour la collectivité",
      },
    },
  };

export const SetVulnerabiliteLigneErrorEnum = createErrorsEnum(specificErrors);
export type SetVulnerabiliteLigneError =
  keyof typeof SetVulnerabiliteLigneErrorEnum;
