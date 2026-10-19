import { getDrizzleToken } from '@nestjs/drizzle';
import { Test } from '@nestjs/testing';
import ConfigurationService from '../../config/configuration.service';
import { DatabaseModule } from './database.module';
import type { Database } from './database.type';

const createModule = () =>
  Test.createTestingModule({ imports: [DatabaseModule] })
    .overrideProvider(ConfigurationService)
    .useValue({ get: () => 'postgresql://tools:password@localhost:5432/tools' })
    .compile();

describe('DatabaseModule', () => {
  test('configures a bounded connection timeout without opening a connection', async () => {
    const module = await createModule();
    const db = module.get<Database>(getDrizzleToken());
    try {
      expect(db.$client.options).toMatchObject({
        connectionString: 'postgresql://tools:password@localhost:5432/tools',
        application_name: 'Tools Automation Api',
        connectionTimeoutMillis: 5_000,
      });
      expect(db.$client.totalCount).toBe(0);
    } finally {
      await module.close();
    }
  });

  test('owns a separate pool per application and closes each pool once', async () => {
    const first = await createModule();
    const second = await createModule();
    const firstPool = first.get<Database>(getDrizzleToken()).$client;
    const secondPool = second.get<Database>(getDrizzleToken()).$client;
    const firstEnd = vi.spyOn(firstPool, 'end');
    const secondEnd = vi.spyOn(secondPool, 'end');
    try {
      expect(firstPool).not.toBe(secondPool);
      await first.close();
      expect(firstEnd).toHaveBeenCalledTimes(1);
      expect(secondEnd).not.toHaveBeenCalled();
    } finally {
      await second.close();
    }
    expect(secondEnd).toHaveBeenCalledTimes(1);
  });
});
