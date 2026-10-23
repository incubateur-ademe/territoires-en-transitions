import { describe, expect, it } from 'vitest';
import { backendConfigurationSchema } from './configuration.model';

const schema = backendConfigurationSchema.pick({
  BACKGROUND_TASKS_ENABLED: true,
  QUEUE_PREFIX: true,
});

describe('background tasks configuration', () => {
  it('keeps the existing worker behavior and queue namespace by default', () => {
    expect(schema.parse({})).toEqual({
      BACKGROUND_TASKS_ENABLED: true,
      QUEUE_PREFIX: 'bull',
    });
  });

  it('parses a disabled test target without treating "false" as truthy', () => {
    expect(
      schema.parse({
        BACKGROUND_TASKS_ENABLED: 'false',
        QUEUE_PREFIX: 'staging-test',
      })
    ).toEqual({
      BACKGROUND_TASKS_ENABLED: false,
      QUEUE_PREFIX: 'staging-test',
    });
  });

  it('rejects invalid flags and empty namespaces', () => {
    expect(() =>
      schema.parse({ BACKGROUND_TASKS_ENABLED: 'invalid' })
    ).toThrow();
    expect(() => schema.parse({ QUEUE_PREFIX: '' })).toThrow();
  });
});
