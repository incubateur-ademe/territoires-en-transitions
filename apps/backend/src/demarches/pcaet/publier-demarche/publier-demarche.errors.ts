import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  demarchePcaetTransitionErrorConfig,
  demarchePcaetTransitionErrors,
} from '../shared/demarche-pcaet-transition.errors';

const specificErrors = [
  ...demarchePcaetTransitionErrors,
  'DATE_ADOPTION_FUTURE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const publierDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ...demarchePcaetTransitionErrorConfig,
      // Une saisie hors bornes, pas un conflit d'état : le libellé affiché
      // vient du catalogue de l'app, qui reçoit ce code dans `data.errorKey`.
      DATE_ADOPTION_FUTURE: { code: 'BAD_REQUEST' },
    },
  };

export const PublierDemarchePcaetErrorEnum = createErrorsEnum(specificErrors);
export type PublierDemarchePcaetError =
  keyof typeof PublierDemarchePcaetErrorEnum;
