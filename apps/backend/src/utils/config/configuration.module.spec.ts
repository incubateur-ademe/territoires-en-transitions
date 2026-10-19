import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backendConfigurationSchema } from './configuration.model';
import { ConfigurationModule } from './configuration.module';
import ConfigurationService from './configuration.service';

describe('Backend configuration validation', () => {
  let module: TestingModule | undefined;

  beforeEach(() => {
    for (const [key, schema] of Object.entries(
      backendConfigurationSchema.shape
    )) {
      vi.stubEnv(
        key,
        schema.safeParse(undefined).success ? undefined : 'test-value'
      );
    }
    vi.stubEnv('QUEUE_REDIS_HOST', '127.0.0.1');
  });

  afterEach(async () => {
    await module?.close();
    module = undefined;
    vi.unstubAllEnvs();
  });

  const loadConfiguration = async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          validationSchema: backendConfigurationSchema,
        }),
        ConfigurationModule,
      ],
    }).compile();
    return module.get(ConfigurationService);
  };

  it('provides typed defaults through ConfigurationService', async () => {
    const config = await loadConfiguration();

    expect(config.get('QUEUE_REDIS_PORT')).toBe(6379);
    expect(config.get('PUBLIC_API_THROTTLE_TTL')).toBe(60000);
    expect(config.get('PRO_CONNECT_ENABLED')).toBe(false);
    expect(config.get('MON_COMPTE_ADEME_ENABLED')).toBe(false);
  });

  it('provides transformed values instead of the raw environment strings', async () => {
    vi.stubEnv('QUEUE_REDIS_PORT', '6380');
    vi.stubEnv('PUBLIC_API_THROTTLE_LIMIT', '25');
    vi.stubEnv('DEMARCHE_PCAET_BYPASS_DIAGNOSTIC', 'true');
    vi.stubEnv(
      'SMTP_TO_EMAIL_WHITELIST',
      'first@example.test, second@example.test'
    );

    const config = await loadConfiguration();

    expect(config.get('QUEUE_REDIS_PORT')).toBe(6380);
    expect(config.get('PUBLIC_API_THROTTLE_LIMIT')).toBe(25);
    expect(config.get('DEMARCHE_PCAET_BYPASS_DIAGNOSTIC')).toBe(true);
    expect(config.get('SMTP_TO_EMAIL_WHITELIST')).toEqual([
      'first@example.test',
      'second@example.test',
    ]);
  });

  it.each([
    { key: 'APP_URL', value: undefined, error: 'APP_URL' },
    { key: 'QUEUE_REDIS_HOST', value: undefined, error: 'QUEUE_REDIS_HOST' },
    { key: 'PRO_CONNECT_ENABLED', value: 'true', error: 'PRO_CONNECT_ISSUER' },
  ])(
    'rejects invalid $key configuration before creating providers',
    async ({ key, value, error }) => {
      vi.stubEnv(key, value);

      await expect(loadConfiguration()).rejects.toThrow(error);
    }
  );
});
