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

export const cloreInstructionErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  { specificErrors: demarchePcaetTransitionErrorConfig };

export const CloreInstructionErrorEnum = createErrorsEnum(specificErrors);
export type CloreInstructionError = keyof typeof CloreInstructionErrorEnum;
