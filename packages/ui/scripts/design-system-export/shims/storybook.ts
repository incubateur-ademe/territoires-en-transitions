/*
 * Modules Storybook importés par les stories : seuls les helpers d'exécution
 * sont fournis (actions muettes) ; les fonctions `play` ne sont pas jouées.
 */
const noop = (): void => undefined;

export const action =
  (_name?: string) =>
  (..._args: ReadonlyArray<unknown>): void =>
    undefined;

export const fn = <T extends (...args: never[]) => unknown>(impl?: T) =>
  impl ?? noop;

export const expect = noop;
export const waitFor = noop;
export const within = noop;
export const userEvent = {};
