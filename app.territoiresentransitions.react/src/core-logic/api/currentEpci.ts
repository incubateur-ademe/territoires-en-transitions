import {overmind} from 'core-logic/overmind';

export const getCurrentEpciId = (): string | undefined => {
  return overmind.state.currentEpciId;
};
