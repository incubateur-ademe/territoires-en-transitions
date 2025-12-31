import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const NoteErrorEnum = createErrorsEnum();
export type NoteError = keyof typeof NoteErrorEnum;
