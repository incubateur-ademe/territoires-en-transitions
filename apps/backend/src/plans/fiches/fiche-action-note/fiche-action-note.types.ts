import { MethodResult } from '@tet/backend/utils/result.type';
import { NoteError } from './fiche-action-note.errors';

export type NoteResult<T> = MethodResult<T, NoteError>;
