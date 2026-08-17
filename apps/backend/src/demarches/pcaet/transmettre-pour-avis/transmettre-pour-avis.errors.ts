import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  demarchePcaetTransitionErrorConfig,
  demarchePcaetTransitionErrors,
} from '../shared/demarche-pcaet-transition.errors';

const specificErrors = [...demarchePcaetTransitionErrors] as const;
type SpecificError = (typeof specificErrors)[number];

export const transmettreDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  { specificErrors: demarchePcaetTransitionErrorConfig };

export const TransmettrePourAvisDemarchePcaetErrorEnum =
  createErrorsEnum(specificErrors);
export type TransmettrePourAvisDemarchePcaetError =
  keyof typeof TransmettrePourAvisDemarchePcaetErrorEnum;
