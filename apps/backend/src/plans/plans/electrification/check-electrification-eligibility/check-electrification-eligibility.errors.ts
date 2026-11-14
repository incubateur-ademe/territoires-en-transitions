import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'INVALID_ELIGIBILITY_INPUT',
  'ELECTRIFICATION_LAUREATS_UNAVAILABLE',
  'INVALID_ELECTRIFICATION_LAUREATS_CONFIG',
  'INACTIVE_ELECTRIFICATION_LAUREATS_CONFIG',
  'AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const checkElectrificationEligibilityErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      INVALID_ELIGIBILITY_INPUT: {
        code: 'BAD_REQUEST',
        message: "La collectivité à vérifier n'est pas valide.",
      },
      ELECTRIFICATION_LAUREATS_UNAVAILABLE: {
        code: 'PRECONDITION_FAILED',
        message:
          'La correspondance des lauréats Électrification est indisponible.',
      },
      INVALID_ELECTRIFICATION_LAUREATS_CONFIG: {
        code: 'PRECONDITION_FAILED',
        message: 'La correspondance des lauréats Électrification est invalide.',
      },
      INACTIVE_ELECTRIFICATION_LAUREATS_CONFIG: {
        code: 'PRECONDITION_FAILED',
        message:
          "La correspondance des lauréats Électrification n'est pas valide à la date de vérification.",
      },
      AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG: {
        code: 'PRECONDITION_FAILED',
        message: 'La correspondance des lauréats Électrification est ambiguë.',
      },
    },
  };

export const CheckElectrificationEligibilityErrorEnum =
  createErrorsEnum(specificErrors);
export type CheckElectrificationEligibilityError =
  keyof typeof CheckElectrificationEligibilityErrorEnum;
