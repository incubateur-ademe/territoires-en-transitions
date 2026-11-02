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
