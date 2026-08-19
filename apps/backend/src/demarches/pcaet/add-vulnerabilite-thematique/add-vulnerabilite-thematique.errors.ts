import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'THEMATIQUE_DEJA_EXISTANT',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const addVulnerabiliteThematiqueErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      THEMATIQUE_DEJA_EXISTANT: {
        code: 'CONFLICT',
        message: 'Cette thématique de vulnérabilité existe déjà',
      },
    },
  };

export const AddVulnerabiliteThematiqueErrorEnum =
  createErrorsEnum(specificErrors);
export type AddVulnerabiliteThematiqueError =
  keyof typeof AddVulnerabiliteThematiqueErrorEnum;
