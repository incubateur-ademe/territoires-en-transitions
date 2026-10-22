import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import configuration from './configuration';
import { toolsAutomationApiConfigurationSchema } from './configuration.model';

describe('Tools configuration', () => {
  let module: TestingModule | undefined;
  let envDirectory: string | undefined;

  beforeEach(() => {
    vi.resetModules();
    for (const [key, schema] of Object.entries(
      toolsAutomationApiConfigurationSchema.shape
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
    envDirectory = await mkdtemp(join(tmpdir(), 'tet-tools-config-'));
    await writeFile(
      join(envDirectory, '.env'),
      'TET_CONFIG_ENV_PROBE=from-file\n'
    );
    vi.stubEnv('TET_CONFIG_ENV_PROBE', undefined);
    vi.spyOn(process, 'cwd').mockReturnValue(envDirectory);

    await loadConfiguration();

    expect(process.env.TET_CONFIG_ENV_PROBE).toBeUndefined();
  });

  it('provides the typed Redis port default', async () => {
    const config = await loadConfiguration();

    expect(config.get('QUEUE_REDIS_PORT')).toBe(6379);
  });

  it('provides transformed configuration values', async () => {
    vi.stubEnv('QUEUE_REDIS_PORT', '6380');
    vi.stubEnv('CRON_JOBS_FILTER', 'first, second');
    const config = await loadConfiguration();

    expect(config.get('QUEUE_REDIS_PORT')).toBe(6380);
    expect(config.get('CRON_JOBS_FILTER')).toEqual(['first', 'second']);
  });

  it('rejects missing required configuration', async () => {
    vi.stubEnv('TET_API_TOKEN', undefined);

    await expect(loadConfiguration()).rejects.toThrow('TET_API_TOKEN');
  });
});
