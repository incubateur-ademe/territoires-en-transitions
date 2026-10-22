import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const listContactsErrorConfig: TrpcErrorHandlerConfig<never> = {};

export const ListContactsErrorEnum = createErrorsEnum();
export type ListContactsError = keyof typeof ListContactsErrorEnum;
