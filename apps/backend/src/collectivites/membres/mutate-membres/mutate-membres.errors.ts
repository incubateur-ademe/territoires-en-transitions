import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const MutateMembresSpecificErrors = [
  'MEMBER_NOT_FOUND',
  'ALREADY_ACTIVE_MEMBER',
  'COLLECTIVITE_NOT_FOUND',
  'COLLECTIVITE_HAS_ACTIVE_MEMBERS',
] as const;
export type MutateMembresError =
  (typeof MutateMembresSpecificErrors)[number];

export const mutateMembresErrorConfig: TrpcErrorHandlerConfig<MutateMembresError> =
  {
    specificErrors: {
      MEMBER_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Ce membre n'est pas rattaché à cette collectivité",
      },
      ALREADY_ACTIVE_MEMBER: {
        code: 'CONFLICT',
        message: 'Vous êtes déjà rattaché à cette collectivité',
      },
      COLLECTIVITE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Cette collectivité n'existe pas",
      },
      COLLECTIVITE_HAS_ACTIVE_MEMBERS: {
        code: 'CONFLICT',
        message:
          'Cette collectivité compte déjà des membres. Un administrateur doit vous inviter pour la rejoindre.',
      },
    },
  };

export const MutateMembresErrorEnum = createErrorsEnum(
  MutateMembresSpecificErrors
);
