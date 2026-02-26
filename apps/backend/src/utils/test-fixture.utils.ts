import { onTestFinished } from 'vitest';

interface Cleanup {
  cleanup: () => Promise<void>;
}

// signature des générateurs de fixture (1+ params)
type CreateFixtureFn<
  InputArgs extends [unknown, ...unknown[]],
  Output extends Cleanup
> = (...inputArgs: InputArgs) => Promise<Output>;

// wrap un générateur de fixture dans le `onTestFinished` de vitest
export function withOnTestFinished<
  InputArgs extends [unknown, ...unknown[]],
  FixtureOutput extends Cleanup
>(
  create: CreateFixtureFn<InputArgs, FixtureOutput>
): (...inputArgs: InputArgs) => Promise<Omit<FixtureOutput, 'cleanup'>> {
  return async (...inputArgs: InputArgs) => {
    const { cleanup, ...data } = await create(...inputArgs);

    onTestFinished(async () => {
      await cleanup();
    });

    return data;
  };
}
