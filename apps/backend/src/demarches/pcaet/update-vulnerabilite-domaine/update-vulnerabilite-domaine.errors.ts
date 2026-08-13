import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { vulnerabiliteAccessErrors } from '../shared/demarche-pcaet-vulnerabilite-access.service';

const specificErrors = [
  ...vulnerabiliteAccessErrors,
  'DOMAINE_NON_ACCESSIBLE',
  'DOMAINE_SOCLE_NON_MODIFIABLE',
  'DOMAINE_DEJA_EXISTANT',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateVulnerabiliteDomaineErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      DOMAINE_SOCLE_NON_MODIFIABLE: {
        code: 'FORBIDDEN',
        message:
          'Les domaines de la liste réglementaire ne peuvent être ni renommés ni supprimés',
      },
      DOMAINE_DEJA_EXISTANT: {
        code: 'CONFLICT',
        message: 'Ce domaine de vulnérabilité existe déjà',
      },
    },
  };

export const UpdateVulnerabiliteDomaineErrorEnum =
  createErrorsEnum(specificErrors);
export type UpdateVulnerabiliteDomaineError =
  keyof typeof UpdateVulnerabiliteDomaineErrorEnum;
