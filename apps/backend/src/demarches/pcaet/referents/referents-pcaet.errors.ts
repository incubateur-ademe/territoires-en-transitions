import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'ORGANISME_INVALIDE',
  'PAS_MEMBRE_ORGANISME',
  'REFERENT_NOT_FOUND',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const referentsPcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ORGANISME_INVALIDE: {
        code: 'BAD_REQUEST',
        message:
          'Les référents PCAET se désignent pour une DREAL, un conseil régional ou une DDT',
      },
      PAS_MEMBRE_ORGANISME: {
        code: 'BAD_REQUEST',
        message: "Cette personne n'est pas membre de l'organisme",
      },
      REFERENT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Le référent n'a pas été trouvé",
      },
    },
  };

export const ReferentsPcaetErrorEnum = createErrorsEnum(specificErrors);
export type ReferentsPcaetError = keyof typeof ReferentsPcaetErrorEnum;
