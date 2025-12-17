import { onTestFinished } from 'vitest';

// signature des générateurs de fixture
export type CreateTestFixture<Input, Output> = (
  input: Input
) => Promise<TestFixtureOutput<Output>>;

interface TestFixtureOutput<Output> {
  data: Output;
  cleanup: () => Promise<void>;
}

// wrap un générateur de fixture dans le `onTestFinished`de vitest
export function withOnTestFinished<Input, Output>(
  create: CreateTestFixture<Input, Output>
): (input: Input) => Promise<Output> {
  return async (input: Input): Promise<Output> => {
    const { data, cleanup } = await create(input);
    onTestFinished(async () => {
      await cleanup();
    });
    return data;
  };
}
