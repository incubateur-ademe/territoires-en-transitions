import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  demarchePcaetTransitionErrorConfig,
  demarchePcaetTransitionErrors,
} from '../shared/demarche-pcaet-transition.errors';
import {
  demarchePcaetExportErrorConfig,
  demarchePcaetExportErrors,
} from '../exports/generate-exports/generate-demarche-pcaet-exports.errors';

const specificErrors = [
  ...demarchePcaetTransitionErrors,
  ...demarchePcaetExportErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const transmettreDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ...demarchePcaetTransitionErrorConfig,
      ...demarchePcaetExportErrorConfig,
    },
  };

export const TransmettrePourAvisDemarchePcaetErrorEnum =
  createErrorsEnum(specificErrors);
export type TransmettrePourAvisDemarchePcaetError =
  keyof typeof TransmettrePourAvisDemarchePcaetErrorEnum;
