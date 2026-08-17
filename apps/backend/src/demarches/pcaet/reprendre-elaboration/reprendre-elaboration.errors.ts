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

export const reprendreDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  { specificErrors: demarchePcaetTransitionErrorConfig };

export const ReprendreElaborationDemarchePcaetErrorEnum =
  createErrorsEnum(specificErrors);
export type ReprendreElaborationDemarchePcaetError =
  keyof typeof ReprendreElaborationDemarchePcaetErrorEnum;
