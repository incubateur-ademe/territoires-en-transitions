import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['USER_ALREADY_MEMBER', 'PENDING_TAG_CONFLICT'] as const;
type SpecificError = (typeof specificErrors)[number];

export const createInvitationErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      USER_ALREADY_MEMBER: {
        code: 'BAD_REQUEST',
        messageFromCause: true,
      },
      PENDING_TAG_CONFLICT: {
        code: 'BAD_REQUEST',
        messageFromCause: true,
      },
    },
  };

export const CreateInvitationErrorEnum = createErrorsEnum(specificErrors);
export type CreateInvitationError = keyof typeof CreateInvitationErrorEnum;
