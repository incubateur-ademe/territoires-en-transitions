import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { vulnerabiliteAccessErrors } from '../shared/demarche-pcaet-vulnerabilite-access.service';

const specificErrors = [
  ...vulnerabiliteAccessErrors,
  'DOMAINE_DEJA_EXISTANT',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const addVulnerabiliteDomaineErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      DOMAINE_DEJA_EXISTANT: {
        code: 'CONFLICT',
        message: 'Ce domaine de vulnérabilité existe déjà',
      },
    },
  };

export const AddVulnerabiliteDomaineErrorEnum = createErrorsEnum(specificErrors);
export type AddVulnerabiliteDomaineError =
  keyof typeof AddVulnerabiliteDomaineErrorEnum;
