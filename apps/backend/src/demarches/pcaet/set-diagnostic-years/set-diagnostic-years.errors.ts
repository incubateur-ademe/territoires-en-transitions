import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { demarchePcaetAccessErrors } from '../shared/demarche-pcaet-access.service';

const specificErrors = [
  ...demarchePcaetAccessErrors,
  'TOPIC_NOT_FOUND',
  'ANNEE_HORS_BORNES',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const setDiagnosticYearsErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      TOPIC_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Ce volet du diagnostic n'existe pas",
      },
      DEMARCHE_PCAET_NON_MODIFIABLE: {
        code: 'CONFLICT',
        message:
          "Le diagnostic n'est modifiable que pendant l'élaboration du dépôt",
      },
      ANNEE_HORS_BORNES: {
        code: 'BAD_REQUEST',
        message:
          "L'année de comptabilisation doit être écoulée, et une année ajoutée doit rester entre 2010 et le dernier horizon réglementaire",
      },
    },
  };

export const SetDiagnosticYearsErrorEnum = createErrorsEnum(specificErrors);
export type SetDiagnosticYearsError = keyof typeof SetDiagnosticYearsErrorEnum;
