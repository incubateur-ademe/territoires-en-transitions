import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_DOCUMENTS_BY_SCOPE_ERROR'] as const;

export const ListDocumentsByScopeErrorEnum = createErrorsEnum(specificErrors);
export type ListDocumentsByScopeError =
  keyof typeof ListDocumentsByScopeErrorEnum;
