import { LlmError } from './llm.errors';

/** Erreur passagère, qui vaut une nouvelle tentative. */
export const isTransientError = (error: LlmError): boolean => {
  if (error.kind === 'rate_limited') {
    return true;
  }
  if (error.kind === 'api_error') {
    return error.httpStatus === null || error.httpStatus >= 500;
  }
  return false;
};
