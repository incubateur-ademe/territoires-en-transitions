import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const listBibliothequeDocumentsErrorConfig: TrpcErrorHandlerConfig<never> =
  {};

export const ListBibliothequeDocumentsErrorEnum = createErrorsEnum();
export type ListBibliothequeDocumentsError =
  keyof typeof ListBibliothequeDocumentsErrorEnum;
