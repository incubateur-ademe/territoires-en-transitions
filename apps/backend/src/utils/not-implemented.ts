export const notImplemented =
  (name: string): (() => never) =>
  () => {
    throw new Error(`${name} is not implemented`);
  };
