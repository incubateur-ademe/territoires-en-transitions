import { ErrorConfig } from '@tet/backend/utils/trpc/trpc-error-config';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import {
  upsertIndicateurFichesSpecificErrors,
  upsertIndicateurFichesTrpcErrorEntries,
} from '../upsert-indicateur-fiches/upsert-indicateur-fiches.errors';

export const updateIndicateurSpecificErrors = [
  ...upsertIndicateurFichesSpecificErrors,
  'SOUS_INDICATEUR_UNITE_LOCKED',
] as const;
type SpecificError = (typeof updateIndicateurSpecificErrors)[number];

export const updateIndicateurTrpcErrorEntries: Record<
  SpecificError,
  ErrorConfig
> = {
  ...upsertIndicateurFichesTrpcErrorEntries,
  SOUS_INDICATEUR_UNITE_LOCKED: {
    code: 'BAD_REQUEST',
    message:
      'L’unité d’un sous-indicateur est celle de son parent : elle ne peut pas être modifiée directement',
  },
};

export const updateIndicateurErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: updateIndicateurTrpcErrorEntries,
  };

export const UpdateIndicateurErrorEnum = createErrorsEnum(
  updateIndicateurSpecificErrors
);
export type UpdateIndicateurError = keyof typeof UpdateIndicateurErrorEnum;
