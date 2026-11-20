import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['CONSUME_PENDING_INVITATIONS_ERROR'] as const;
type ConsumePendingInvitationsSpecificError = (typeof specificErrors)[number];

export const consumePendingInvitationsErrorConfig: TrpcErrorHandlerConfig<ConsumePendingInvitationsSpecificError> =
  {
    specificErrors: {
      CONSUME_PENDING_INVITATIONS_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Les invitations en attente n’ont pas pu être reprises',
      },
    },
  };

export const ConsumePendingInvitationsErrorEnum =
  createErrorsEnum(specificErrors);
export type ConsumePendingInvitationsError =
  keyof typeof ConsumePendingInvitationsErrorEnum;
