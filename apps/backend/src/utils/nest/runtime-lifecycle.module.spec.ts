import { WorkerHost } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { OutboxRelay } from '@nestjs/outbox';
import { Test } from '@nestjs/testing';
import type { Worker } from 'bullmq';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import request from 'supertest';
import { httpApplicationOptions } from './http-application.options';
import { RuntimeLifecycleModule } from './runtime-lifecycle.module';
import { registerTelemetryShutdown } from './telemetry-shutdown';

@Controller('work')
class TestController {
  @Get()
  get() {
    return { status: 'ok' };
  }
}

class TestWorker extends WorkerHost {
  constructor(private readonly fakeWorker: Worker) {
    super();
  }
  override get worker() {
    return this.fakeWorker;
  }
  async process() {
    return undefined;
  }
}

describe('Runtime lifecycle', () => {
  afterEach(() => registerTelemetryShutdown(async () => undefined));

  test('stops relaying before draining workers and closes databases before telemetry', async () => {
    const order: string[] = [];
    let finishDrain!: () => void;
    const draining = new Promise<void>((resolve) => {
      finishDrain = resolve;
    });
    const close = vi.fn(async () => {
      order.push('worker-draining');
      await draining;
      order.push('worker-closed');
    });
    const relay = Object.assign(Object.create(OutboxRelay.prototype), {
      onApplicationBootstrap: () => undefined,
      onModuleDestroy: () => undefined,
      stop: vi.fn(async () => {
        order.push('relay-stopped');
      }),
    });
    const worker = new TestWorker({ close } as unknown as Worker);
    registerTelemetryShutdown(async () => {
      order.push('telemetry-flushed');
    });
    const module = await Test.createTestingModule({
      imports: [
        RuntimeLifecycleModule,
        DrizzleModule.forRoot({
          drizzle,
          connection: 'postgresql://test:test@localhost:5432/test',
        }),
      ],
      controllers: [TestController],
      providers: [
        { provide: OutboxRelay, useValue: relay },
        { provide: TestWorker, useValue: worker },
      ],
    }).compile();
    const pool = module.get<{ $client: Pool }>(getDrizzleToken()).$client;
    const end = pool.end.bind(pool);
    vi.spyOn(pool, 'end').mockImplementation(async () => {
      order.push('database-closed');
      await end();
    });
    const app = module.createNestApplication(httpApplicationOptions);
    await app.listen(0, '127.0.0.1');
    const closing = app.close();
    try {
      await vi.waitFor(() =>
        expect(order).toEqual(['relay-stopped', 'worker-draining'])
      );
      await request(app.getHttpServer()).get('/work').expect(503);
    } finally {
      finishDrain();
      await closing;
    }
    expect(order).toEqual([
      'relay-stopped',
      'worker-draining',
      'worker-closed',
      'database-closed',
      'telemetry-flushed',
    ]);
    expect(close).toHaveBeenCalledExactlyOnceWith();
  });

  test('keeps the database open until requests already in flight finish', async () => {
    let beginRequest!: () => void;
    let finishRequest!: () => void;
    const started = new Promise<void>((resolve) => {
      beginRequest = resolve;
    });
    const processing = new Promise<void>((resolve) => {
      finishRequest = resolve;
    });
    @Controller('in-flight')
    class InFlightController {
      @Get()
      async get() {
        beginRequest();
        await processing;
        return { status: 'finished' };
      }
    }
    const module = await Test.createTestingModule({
      imports: [
        RuntimeLifecycleModule,
        DrizzleModule.forRoot({
          drizzle,
          connection: 'postgresql://test:test@localhost:5432/test',
        }),
      ],
      controllers: [InFlightController],
    }).compile();
    const pool = module.get<{ $client: Pool }>(getDrizzleToken()).$client;
    const end = vi.spyOn(pool, 'end');
    const app = module.createNestApplication(httpApplicationOptions);
    await app.listen(0, '127.0.0.1');
    const response = request(app.getHttpServer())
      .get('/in-flight')
      .then((value) => value);
    await started;
    const closing = app.close();
    try {
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(end).not.toHaveBeenCalled();
      finishRequest();
      expect((await response).body).toEqual({ status: 'finished' });
    } finally {
      finishRequest();
      await closing;
    }
    expect(end).toHaveBeenCalledTimes(1);
  });

  test('drains every registered worker when the relay fails to stop', async () => {
    const relay = Object.assign(Object.create(OutboxRelay.prototype), {
      onApplicationBootstrap: () => undefined,
      onModuleDestroy: () => undefined,
      stop: vi.fn().mockRejectedValue(new Error('relay failure')),
    });
    const close = vi.fn().mockResolvedValue(undefined);
    const worker = new TestWorker({ close } as unknown as Worker);
    const telemetry = vi.fn().mockResolvedValue(undefined);
    registerTelemetryShutdown(telemetry);
    const module = await Test.createTestingModule({
      imports: [RuntimeLifecycleModule],
      providers: [
        { provide: OutboxRelay, useValue: relay },
        { provide: TestWorker, useValue: worker },
        { provide: 'same-worker-alias', useExisting: TestWorker },
      ],
    }).compile();
    await module.init();
    await module.close();
    expect(close).toHaveBeenCalledTimes(1);
    expect(telemetry).toHaveBeenCalledTimes(1);
  });
});
