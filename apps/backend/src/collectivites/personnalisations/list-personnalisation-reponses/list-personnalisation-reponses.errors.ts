import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const ListPersonnalisationReponsesErrorEnum = createErrorsEnum();
export type ListPersonnalisationReponsesError =
  keyof typeof ListPersonnalisationReponsesErrorEnum;
