import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'THEMATIQUE_NON_ACCESSIBLE',
  'THEMATIQUE_SOCLE_NON_MODIFIABLE',
  'THEMATIQUE_DEJA_EXISTANT',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateVulnerabiliteThematiqueErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      THEMATIQUE_NON_ACCESSIBLE: {
        code: 'NOT_FOUND',
        message:
          "Cette thématique de vulnérabilité n'existe pas pour la collectivité",
      },
      THEMATIQUE_SOCLE_NON_MODIFIABLE: {
        code: 'FORBIDDEN',
        message:
          'Les thématiques de la liste réglementaire ne peuvent être ni renommées ni supprimées',
      },
      THEMATIQUE_DEJA_EXISTANT: {
        code: 'CONFLICT',
        message: 'Cette thématique de vulnérabilité existe déjà',
      },
    },
  };

export const UpdateVulnerabiliteThematiqueErrorEnum =
  createErrorsEnum(specificErrors);
export type UpdateVulnerabiliteThematiqueError =
  keyof typeof UpdateVulnerabiliteThematiqueErrorEnum;
