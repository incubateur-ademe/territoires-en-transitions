import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'PREUVE_FICHIER',
  'LABELLISATION_IN_PROGRESS',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const editPreuveDocumentErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      PREUVE_FICHIER: {
        code: 'BAD_REQUEST',
        message:
          "Cette preuve est un fichier : le lien ne peut pas être modifié via cette opération.",
      },
      LABELLISATION_IN_PROGRESS: {
        code: 'BAD_REQUEST',
        message:
          "Les documents de candidature ne peuvent plus être modifiés une fois l'audit clôturé et la labellisation en cours.",
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const EditPreuveDocumentErrorEnum = createErrorsEnum(specificErrors);
export type EditPreuveDocumentError = keyof typeof EditPreuveDocumentErrorEnum;
