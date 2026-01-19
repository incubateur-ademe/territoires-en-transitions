import { onTestFinished } from 'vitest';

interface Cleanup {
  cleanup: () => Promise<void>;
}

// signature des générateurs de fixture
type CreateFixtureFn<Input, Output extends Cleanup> = (
  input: Input
) => Promise<Output>;



// wrap un générateur de fixture dans le `onTestFinished` de vitest
export function withOnTestFinished<Input, FixtureOutput extends Cleanup>(
  create: CreateFixtureFn<Input, FixtureOutput>
): (input: Input) => Promise<Omit<FixtureOutput, 'cleanup'>> {
  return async (input: Input) => {
    const { cleanup, ...data } = await create(input);

    onTestFinished(async () => {
      await cleanup();
    });

    return data;
  };
}
