import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'DOMAINE_NON_ACCESSIBLE',
  'DOMAINE_SOCLE_NON_MODIFIABLE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const removeVulnerabiliteDomaineErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
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
      DOMAINE_NON_ACCESSIBLE: {
        code: 'NOT_FOUND',
        message:
          "Ce domaine de vulnérabilité n'existe pas pour la collectivité",
      },
      DOMAINE_SOCLE_NON_MODIFIABLE: {
        code: 'FORBIDDEN',
        message:
          'Les domaines de la liste réglementaire ne peuvent être ni renommés ni supprimés',
      },
    },
  };

export const RemoveVulnerabiliteDomaineErrorEnum =
  createErrorsEnum(specificErrors);
export type RemoveVulnerabiliteDomaineError =
  keyof typeof RemoveVulnerabiliteDomaineErrorEnum;
