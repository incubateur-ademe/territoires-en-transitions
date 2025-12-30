import { MethodResult } from '@tet/backend/utils/result.type';
import { NoteError } from './errors';

export type NoteResult<T> = MethodResult<T, NoteError>;
