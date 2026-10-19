import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type ConfigurationService from '../config/configuration.service';
import { RateLimitStorageService } from './rate-limit-storage.service';

// A dedicated disposable Redis is required: the timeout test pauses that server.
const redisUrl = process.env.RATE_LIMIT_ISOLATED_REDIS_URL;

describe.skipIf(!redisUrl)(
  'shared rate-limit storage with isolated Redis',
  () => {
    const services: RateLimitStorageService[] = [];
    const values: Record<string, string | number | undefined> = {
      QUEUE_REDIS_URL: redisUrl,
      QUEUE_REDIS_PORT: 6379,
    };
    const config = {
      get: (key: string) => values[key],
    } as ConfigurationService;

    afterEach(() => {
      for (const service of services.splice(0)) service.onApplicationShutdown();
    });

    async function createStorage(testNamespace = false) {
      vi.stubEnv('VITEST', testNamespace ? 'true' : '');
      const service = new RateLimitStorageService(config);
      vi.unstubAllEnvs();
      services.push(service);
      await service.onModuleInit();
      return service;
    }

    it('enforces one atomic quota across concurrent replicas', async () => {
      const [first, second] = await Promise.all([
        createStorage(),
        createStorage(),
      ]);
      const key = randomUUID();
      const results = await Promise.all(
        Array.from({ length: 30 }, (_, index) =>
          (index % 2 ? first : second).increment(
            key,
            5_000,
            10,
            5_000,
            'contact'
          )
        )
      );
      expect(results.filter((result) => !result.isBlocked)).toHaveLength(10);
      expect(results.filter((result) => result.isBlocked)).toHaveLength(20);
    });

    it('keeps blocking after the hit window expires and releases after the block', async () => {
      const storage = await createStorage();
      const key = randomUUID();
      expect(
        (await storage.increment(key, 100, 1, 600, 'contact')).isBlocked
      ).toBe(false);
      expect(
        (await storage.increment(key, 100, 1, 600, 'contact')).isBlocked
      ).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(
        (await storage.increment(key, 100, 1, 600, 'contact')).isBlocked
      ).toBe(true);
      await vi.waitFor(
        async () => {
          expect(
            (await storage.increment(key, 100, 1, 600, 'contact')).isBlocked
          ).toBe(false);
        },
        { timeout: 2_000, interval: 50 }
      );
    });

    it('connects once, supports readiness and closes without an offline backlog', async () => {
      const storage = await createStorage();
      await Promise.all([storage.onModuleInit(), storage.onModuleInit()]);
      await expect(storage.ping()).resolves.toBe('PONG');
      storage.onApplicationShutdown();
      storage.onApplicationShutdown();
      await expect(storage.ping()).rejects.toThrow();
      await expect(
        storage.increment(randomUUID(), 1_000, 1, 1_000, 'contact')
      ).rejects.toThrow();
    });

    it('isolates independently created test applications', async () => {
      const [first, second] = await Promise.all([
        createStorage(true),
        createStorage(true),
      ]);
      const key = randomUUID();
      expect(
        (await first.increment(key, 5_000, 1, 5_000, 'contact')).isBlocked
      ).toBe(false);
      expect(
        (await first.increment(key, 5_000, 1, 5_000, 'contact')).isBlocked
      ).toBe(true);
      expect(
        (await second.increment(key, 5_000, 1, 5_000, 'contact')).isBlocked
      ).toBe(false);
    });

    it('bounds a stalled Redis command and recovers after the server resumes', async () => {
      const storage = await createStorage();
      const admin = createClient({ url: redisUrl });
      await admin.connect();
      try {
        await admin.sendCommand(['CLIENT', 'PAUSE', '2000', 'ALL']);
        const started = Date.now();
        await expect(storage.ping()).rejects.toThrow();
        expect(Date.now() - started).toBeLessThan(1_800);
        await vi.waitFor(
          async () => {
            await expect(storage.ping()).resolves.toBe('PONG');
          },
          { timeout: 4_000, interval: 100 }
        );
      } finally {
        admin.destroy();
      }
    });
  }
);
