import { DiscussionError } from '../domain/discussion.errors';

export type Result<T, E = DiscussionError> =
  | { success: true; data: T }
  | { success: false; error: E };
