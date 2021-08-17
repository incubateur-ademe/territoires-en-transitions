import {overmind} from 'core-logic/overmind';

/**
 * @deprecated use store variable instead.
 */
export const getCurrentEpciId = (): string | undefined => {
  return overmind.state.currentEpciId;
};
