import { ErrorConfig } from '@tet/backend/utils/trpc/trpc-error-config';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const upsertIndicateurFichesSpecificErrors = [
  'FICHES_OUT_OF_SCOPE',
] as const;
type SpecificError = (typeof upsertIndicateurFichesSpecificErrors)[number];

export const upsertIndicateurFichesTrpcErrorEntries: Record<
  SpecificError,
  ErrorConfig
> = {
  FICHES_OUT_OF_SCOPE: {
    code: 'BAD_REQUEST',
    message:
      'Toutes les fiches doivent appartenir à la collectivité ou être partagées avec elle',
  },
};

export const upsertIndicateurFichesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: upsertIndicateurFichesTrpcErrorEntries,
  };

export const UpsertIndicateurFichesErrorEnum = createErrorsEnum(
  upsertIndicateurFichesSpecificErrors
);
export type UpsertIndicateurFichesError =
  keyof typeof UpsertIndicateurFichesErrorEnum;
