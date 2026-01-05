import { Result } from '@tet/backend/utils/result.type';
import { DiscussionError } from '../domain/discussion.errors';

export type DiscussionResult<T, E = DiscussionError> = Result<T, E>;
