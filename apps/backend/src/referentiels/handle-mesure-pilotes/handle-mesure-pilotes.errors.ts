import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'EMPTY_PILOTES_LIST',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const handleMesurePilotesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      EMPTY_PILOTES_LIST: {
        code: 'BAD_REQUEST',
        message: 'La liste des pilotes ne peut pas être vide.',
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const HandleMesurePilotesErrorEnum = createErrorsEnum(specificErrors);
export type HandleMesurePilotesError =
  keyof typeof HandleMesurePilotesErrorEnum;
