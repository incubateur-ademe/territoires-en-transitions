import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import configuration from './configuration';
import { backendConfigurationSchema } from './configuration.model';

describe('Backend configuration', () => {
  let module: TestingModule | undefined;
  let envDirectory: string | undefined;

  beforeEach(() => {
    vi.resetModules();
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
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    if (envDirectory) await rm(envDirectory, { recursive: true, force: true });
    envDirectory = undefined;
  });

  const loadConfiguration = async () => {
    const { ConfigurationModule } = await vi.importActual<
      typeof import('./configuration.module')
    >('./configuration.module');
    const { default: ConfigurationService } = await vi.importActual<
      typeof import('./configuration.service')
    >('./configuration.service');
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true, load: [configuration] }),
        ConfigurationModule,
      ],
    }).compile();
    return module.get(ConfigurationService);
  };

  it('does not load a .env file when the root configuration ignores it', async () => {
    envDirectory = await mkdtemp(join(tmpdir(), 'tet-backend-config-'));
    await writeFile(
      join(envDirectory, '.env'),
      'TET_CONFIG_ENV_PROBE=from-file\n'
    );
    vi.stubEnv('TET_CONFIG_ENV_PROBE', undefined);
    vi.spyOn(process, 'cwd').mockReturnValue(envDirectory);

    await loadConfiguration();

    expect(process.env.TET_CONFIG_ENV_PROBE).toBeUndefined();
  });

  it('provides typed defaults through ConfigurationService', async () => {
    const config = await loadConfiguration();

    expect(config.get('QUEUE_REDIS_PORT')).toBe(6379);
    expect(config.get('PUBLIC_API_THROTTLE_TTL')).toBe(60000);
    expect(config.get('PRO_CONNECT_ENABLED')).toBe(false);
  });

  it('provides transformed values instead of raw environment strings', async () => {
    vi.stubEnv('QUEUE_REDIS_PORT', '6380');
    vi.stubEnv('PUBLIC_API_THROTTLE_LIMIT', '25');
    vi.stubEnv('DEMARCHE_PCAET_BYPASS_DIAGNOSTIC', 'true');
    const config = await loadConfiguration();

    expect(config.get('QUEUE_REDIS_PORT')).toBe(6380);
    expect(config.get('PUBLIC_API_THROTTLE_LIMIT')).toBe(25);
    expect(config.get('DEMARCHE_PCAET_BYPASS_DIAGNOSTIC')).toBe(true);
  });

  it.each(['APP_URL', 'QUEUE_REDIS_HOST'])(
    'rejects a missing %s',
    async (key) => {
      vi.stubEnv(key, undefined);

      await expect(loadConfiguration()).rejects.toThrow(key);
    }
  );
});
