import { overmind } from "core-logic/overmind";

/**
 * @deprecated use store variable instead.
 */
export const getCurrentEpciId = (): string => {
  return overmind.state.epciId!;
};
