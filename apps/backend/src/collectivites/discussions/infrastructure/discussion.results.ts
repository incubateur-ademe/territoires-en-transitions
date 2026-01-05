import { MethodResult } from '@tet/backend/utils/result.type';
import { DiscussionError } from '../domain/discussion.errors';

export type DiscussionResult<T, E = DiscussionError> = MethodResult<T, E>;
