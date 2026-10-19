import type { INestApplication } from '@nestjs/common';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { PoolClient } from 'pg';
import request from 'supertest';
import { httpApplicationOptions } from '../nest/http-application.options';
import { RuntimeHealthModule } from './runtime-health.module';
import { RuntimeHealthService } from './runtime-health.service';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('Runtime health', () => {
  const query = vi.fn();
  const release = vi.fn();
  const connect = vi.fn<() => Promise<PoolClient>>();
  const redis = vi.fn<() => Promise<unknown>>();
  const client = { query, release } as unknown as PoolClient;
  let app: INestApplication;
  let health: RuntimeHealthService;

  beforeEach(async () => {
    query.mockReset().mockResolvedValue({ rows: [{ '?column?': 1 }] });
    release.mockReset();
    connect.mockReset().mockResolvedValue(client);
    redis.mockReset().mockResolvedValue('PONG');
    const module = await Test.createTestingModule({
      imports: [
        RuntimeHealthModule.registerAsync({
          useFactory: () => ({ database: { connect }, redis }),
        }),
      ],
    }).compile();
    app = module.createNestApplication(httpApplicationOptions);
    await app.init();
    health = app.get(RuntimeHealthService);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await app.close();
  });

  test('serves liveness without accessing PostgreSQL or Redis', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200, { status: 'ok' });
    expect(connect).not.toHaveBeenCalled();
    expect(redis).not.toHaveBeenCalled();
  });

  test('reports readiness only after both dependencies respond and releases the connection', async () => {
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200, { status: 'ok' });
    expect(query).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledExactlyOnceWith();
    expect(redis).toHaveBeenCalledTimes(1);
  });

  test.each(['database', 'redis'])(
    'returns a sanitized 503 when %s is unavailable',
    async (dependency) => {
      const error = new Error(
        'postgresql://secret:password@private.internal:5432/database'
      );
      if (dependency === 'database') query.mockRejectedValueOnce(error);
      else redis.mockRejectedValueOnce(error);
      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(503);
      expect(response.body).toEqual({
        message: 'Service unavailable',
        error: 'Service Unavailable',
        statusCode: 503,
      });
      expect(JSON.stringify(response.body)).not.toContain('password');
      expect(release).toHaveBeenCalledTimes(1);
      if (dependency === 'database') expect(release).toHaveBeenCalledWith(true);
    }
  );

  test('destroys a connection when its query exceeds the probe deadline', async () => {
    vi.useFakeTimers();
    const pending = deferred<unknown>();
    query.mockReturnValueOnce(pending.promise);
    const result = expect(health.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    await vi.advanceTimersByTimeAsync(1_000);
    await result;
    expect(release).toHaveBeenCalledExactlyOnceWith(true);
    pending.resolve({ rows: [] });
    await vi.advanceTimersByTimeAsync(0);
    expect(release).toHaveBeenCalledTimes(1);
  });

  test('releases a connection acquired after the deadline without starting a query', async () => {
    vi.useFakeTimers();
    const pending = deferred<PoolClient>();
    connect.mockReturnValueOnce(pending.promise);
    const result = expect(health.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    await vi.advanceTimersByTimeAsync(1_000);
    await result;
    expect(query).not.toHaveBeenCalled();
    pending.resolve(client);
    await vi.advanceTimersByTimeAsync(0);
    expect(release).toHaveBeenCalledExactlyOnceWith();
    expect(query).not.toHaveBeenCalled();
  });

  test('shares an outstanding Redis probe so repeated requests do not accumulate commands', async () => {
    vi.useFakeTimers();
    const pending = deferred<unknown>();
    redis.mockReturnValueOnce(pending.promise);
    const first = expect(health.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    await vi.advanceTimersByTimeAsync(1_000);
    await first;
    const second = expect(health.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
    await vi.advanceTimersByTimeAsync(1_000);
    await second;
    expect(redis).toHaveBeenCalledTimes(1);
    pending.resolve('PONG');
    await vi.advanceTimersByTimeAsync(0);
    await expect(health.readiness()).resolves.toEqual({ status: 'ok' });
    expect(redis).toHaveBeenCalledTimes(2);
  });

  test('shares an outstanding pool acquisition between concurrent probes', async () => {
    vi.useFakeTimers();
    const pending = deferred<PoolClient>();
    connect.mockReturnValueOnce(pending.promise);
    const results = Array.from({ length: 10 }, () =>
      expect(health.readiness()).rejects.toBeInstanceOf(
        ServiceUnavailableException
      )
    );
    await vi.advanceTimersByTimeAsync(1_000);
    await Promise.all(results);
    expect(connect).toHaveBeenCalledTimes(1);
    pending.resolve(client);
    await vi.advanceTimersByTimeAsync(0);
    expect(release).toHaveBeenCalledExactlyOnceWith();
    expect(query).not.toHaveBeenCalled();
  });
});
