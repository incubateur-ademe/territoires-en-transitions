import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const GetPersonnalisationReponsesErrorEnum = createErrorsEnum();
export type GetPersonnalisationReponsesError =
  keyof typeof GetPersonnalisationReponsesErrorEnum;
