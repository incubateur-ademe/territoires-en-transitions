import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'THEMATIQUE_DEJA_EXISTANT',
  'THEMATIQUE_PARENT_NON_ACCESSIBLE',
  'THEMATIQUE_PARENT_SOCLE',
  'THEMATIQUE_PARENT_NON_RACINE',
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
      THEMATIQUE_PARENT_NON_ACCESSIBLE: {
        code: 'NOT_FOUND',
        message:
          "La thématique parente n'existe pas pour la collectivité",
      },
      THEMATIQUE_PARENT_SOCLE: {
        code: 'FORBIDDEN',
        message:
          "Les thématiques de la liste réglementaire n'accueillent pas de sous-thématique",
      },
      THEMATIQUE_PARENT_NON_RACINE: {
        code: 'CONFLICT',
        message:
          'Une sous-thématique de vulnérabilité ne peut pas en porter à son tour',
      },
    },
  };

export const AddVulnerabiliteThematiqueErrorEnum =
  createErrorsEnum(specificErrors);
export type AddVulnerabiliteThematiqueError =
  keyof typeof AddVulnerabiliteThematiqueErrorEnum;
