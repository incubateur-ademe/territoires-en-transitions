import 'reflect-metadata';
import { Outbox, OutboxRelay, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { webhookConfigurationTable } from '@tet/backend/utils/webhooks/webhook-configuration.table';
import { webhookMessageTable } from '@tet/backend/utils/webhooks/webhook-message.table';
import { WebhookService } from '@tet/backend/utils/webhooks/webhook.service';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
import { Job, Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import ConfigurationService from '../config/configuration.service';
import { Database } from '../utils/database/database.type';
import { WebhookConsumerService } from './webhook-consumer.service';
import { WebhookOutboxTransport } from './webhook-outbox.transport';

// Match the CommonJS Drizzle types used by the compiled Nest applications.
const require = createRequire(import.meta.url);
const { drizzle } = require('drizzle-orm/node-postgres') as typeof import(
  'drizzle-orm/node-postgres',
  { with: { 'resolution-mode': 'require' } }
);
const { eq, sql } = require('drizzle-orm') as typeof import('drizzle-orm', {
  with: { 'resolution-mode': 'require' },
});

// Explicit opt-in: this suite owns this disposable database, never the application stack.
const databaseUrl = process.env.WEBHOOK_TEST_DATABASE_URL;
const redisUrl = process.env.WEBHOOK_TEST_REDIS_URL;
const sqitchRoot = resolve(
  import.meta.dirname,
  '../../../../data_layer/sqitch'
);

describe.skipIf(!databaseUrl || !redisUrl)(
  'Webhook outbox with PostgreSQL and Redis',
  () => {
    let pool: Pool;
    let db: Database;
    let queue: Queue;
    let storage: OutboxStorage;
    let store: PostgresOutboxStore;
    let relay: OutboxRelay;
    let producer: WebhookService;
    let transport: WebhookOutboxTransport;
    let consumer: WebhookConsumerService;
    let server: Server;
    let endpoint: string;
    let responseStatus = 200;
    let stallResponse = false;
    let beforeResponse: (() => Promise<void>) | undefined;
    let requests: { headers: Record<string, unknown>; payload: unknown }[];

    const runMigration = async (phase: 'deploy' | 'verify' | 'revert') => {
      const client = await pool.connect();
      try {
        await client.query(
          await readFile(
            resolve(sqitchRoot, phase, 'webhooks/outbox.sql'),
            'utf8'
          )
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    };

    const getJob = async (id: string) => {
      const job = await queue.getJob(id);
      if (!job) throw new Error(`Missing webhook job ${id}`);
      return job;
    };

    const createMessage = async (
      payload: unknown = { id: 12, titre: 'Action' }
    ) => {
      await db.transaction(async (tx) => {
        await producer.sendWebhookNotification(
          ApplicationSousScopesEnum.FICHES,
          '12',
          payload,
          tx
        );
      });
      const [message] = await db.select().from(webhookMessageTable);
      return message;
    };

    beforeAll(async () => {
      if (!databaseUrl || !redisUrl)
        throw new Error('Missing isolated database URLs');
      const pgUrl = new URL(databaseUrl);
      const redis = new URL(redisUrl);
      if (
        pgUrl.hostname !== '127.0.0.1' ||
        pgUrl.pathname !== '/tet_webhook_outbox_test' ||
        redis.hostname !== '127.0.0.1'
      ) {
        throw new Error(
          'Webhook tests require disposable localhost PostgreSQL (tet_webhook_outbox_test) and Redis'
        );
      }
      pool = new Pool({ connectionString: databaseUrl });
      db = drizzle(pool);
      await pool.query(
        'DROP SCHEMA IF EXISTS nest_outbox CASCADE; DROP SCHEMA IF EXISTS webhooks CASCADE; DROP TABLE IF EXISTS public.webhook_test_business'
      );
      await pool.query(
        'DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
      );
      await pool.query(
        'DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
      );
      await pool.query(
        'DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
      );
      await pool.query(
        await readFile(
          resolve(sqitchRoot, 'deploy/webhooks/webhooks.sql'),
          'utf8'
        )
      );
      await runMigration('deploy');
      await pool.query(
        'CREATE TABLE IF NOT EXISTS public.webhook_test_business (id integer PRIMARY KEY)'
      );
      queue = new Queue('webhook-outbox-integration', {
        prefix: `test-${randomUUID()}`,
        connection: {
          host: redis.hostname,
          port: Number(redis.port),
          maxRetriesPerRequest: 1,
        },
      });
      await queue.waitUntilReady();
      storage = new OutboxStorage();
      store = new PostgresOutboxStore(
        { executor: fromDrizzle(db), migrate: false },
        storage
      );
      await store.onModuleInit();
      transport = new WebhookOutboxTransport(queue, db);
      relay = new OutboxRelay({
        store,
        transports: { webhooks: transport },
        route: () => 'webhooks',
        relay: { enabled: false },
        retry: { attempts: 3, backoff: { delay: 1, jitter: 'none' } },
      });
      producer = new WebhookService(new Outbox<Transaction>(storage, relay));
      consumer = new WebhookConsumerService(
        db,
        {
          get: () => ({ partner: 'username:password' }),
        } as unknown as ConfigurationService,
        { getContext: () => ({}) } as unknown as ContextStoreService
      );
      server = createServer(async (request, response) => {
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        requests.push({
          headers: request.headers,
          payload: JSON.parse(Buffer.concat(chunks).toString()),
        });
        await beforeResponse?.();
        if (stallResponse) return;
        response.writeHead(responseStatus, {
          'content-type': 'application/json',
        });
        response.end(JSON.stringify({ id: 'external-id' }));
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    }, 30_000);

    beforeEach(async () => {
      vi.restoreAllMocks();
      requests = [];
      responseStatus = 200;
      stallResponse = false;
      beforeResponse = undefined;
      await queue.obliterate({ force: true });
      await pool.query(
        'TRUNCATE nest_outbox.messages, nest_outbox.dead_letters, nest_outbox.inbox, webhooks.webhook_message, webhooks.webhook_configuration, public.webhook_test_business CASCADE'
      );
      await db.insert(webhookConfigurationTable).values({
        ref: 'partner',
        entityType: ApplicationSousScopesEnum.FICHES,
        url: endpoint,
        authenticationMethod: 'bearer',
        payloadFormat: 'default',
        secretKey: 'partner',
      });
    });

    afterAll(async () => {
      await relay?.stop();
      if (queue) {
        await queue.obliterate({ force: true });
        await queue.close();
      }
      if (server)
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve()))
        );
      await pool?.end();
    });

    it('commits business data and notifications together, invisible to the relay before commit', async () => {
      await db.transaction(async (tx) => {
        await tx.execute(
          sql`INSERT INTO public.webhook_test_business VALUES (1)`
        );
        await producer.sendWebhookNotification(
          ApplicationSousScopesEnum.FICHES,
          '1',
          { id: 1 },
          tx
        );
        expect((await relay.runOnce()).claimed).toBe(0);
      });
      expect(
        (await pool.query('SELECT * FROM public.webhook_test_business'))
          .rowCount
      ).toBe(1);
      expect((await relay.runOnce()).published).toBe(1);
      expect(await queue.getWaitingCount()).toBe(1);
    });

    it('rolls back business data, webhook and outbox on failure', async () => {
      await expect(
        db.transaction(async (tx) => {
          await tx.execute(
            sql`INSERT INTO public.webhook_test_business VALUES (1)`
          );
          await producer.sendWebhookNotification(
            ApplicationSousScopesEnum.FICHES,
            '1',
            { id: 1 },
            tx
          );
          throw new Error('cancel transaction');
        })
      ).rejects.toThrow('cancel transaction');
      expect(
        (await pool.query('SELECT * FROM public.webhook_test_business'))
          .rowCount
      ).toBe(0);
      expect(await db.select().from(webhookMessageTable)).toHaveLength(0);
      expect((await store.stats(Date.now())).pending).toBe(0);
      expect((await relay.runOnce()).published).toBe(0);
    });

    it('retains the outbox record when Redis rejects publication and retries safely', async () => {
      const message = await createMessage();
      vi.spyOn(queue, 'add').mockRejectedValueOnce(
        new Error('Redis unavailable')
      );
      expect((await relay.runOnce()).retried).toBe(1);
      expect((await store.stats(Date.now())).pending).toBe(1);
      await pool.query('UPDATE nest_outbox.messages SET available_at = 0');
      expect((await relay.runOnce()).published).toBe(1);
      expect(await queue.getJob(message.id)).toBeDefined();
    });

    it('deduplicates Redis publication after a crash between queue add and outbox acknowledgement', async () => {
      const message = await createMessage();
      const [claimed] = await store.claim({
        owner: 'crashed-worker',
        now: Date.now(),
        leaseMs: 30_000,
        limit: 1,
      });
      await transport.publish(claimed, {
        signal: new AbortController().signal,
      });
      await pool.query('UPDATE nest_outbox.messages SET lease_until = 0');
      expect((await relay.runOnce()).published).toBe(1);
      expect(await queue.getWaitingCount()).toBe(1);
      expect((await queue.getJob(message.id))?.id).toBe(message.id);
    });

    it('uses persisted success to prevent redelivery after Redis jobs have been purged', async () => {
      const message = await createMessage();
      const [claimed] = await store.claim({
        owner: 'crashed-worker',
        now: Date.now(),
        leaseMs: 30_000,
        limit: 1,
      });
      await transport.publish(claimed, {
        signal: new AbortController().signal,
      });
      const job = await getJob(message.id);
      await consumer.process(job);
      expect(requests).toHaveLength(1);
      expect(requests[0].headers['idempotency-key']).toBe(message.id);
      expect(requests[0].headers.authorization).toBe(
        'Bearer username:password'
      );
      expect(requests[0].payload).toEqual({ id: 12, titre: 'Action' });
      await job.remove();
      await pool.query('UPDATE nest_outbox.messages SET lease_until = 0');
      expect((await relay.runOnce()).published).toBe(1);
      expect(await queue.getWaitingCount()).toBe(0);
      await consumer.process(job);
      expect(requests).toHaveLength(1);
    });

    it('preserves Basic authentication and Communs payload mapping', async () => {
      await db
        .update(webhookConfigurationTable)
        .set({ authenticationMethod: 'basic', payloadFormat: 'communs' });
      const message = await createMessage({
        id: 12,
        titre: 'Action',
        collectivite: { id: 9, type: 'commune', communeCode: '75056' },
      });
      await relay.runOnce();
      await consumer.process(await getJob(message.id));
      expect(requests[0].headers.authorization).toBe(
        `Basic ${Buffer.from('username:password').toString('base64')}`
      );
      expect(requests[0].payload).toMatchObject({
        nom: 'Action',
        externalId: '12',
        collectivites: [
          { type: 'Commune', code: '75056', collectiviteId: '9' },
        ],
      });
    });

    it('records delivery failure and retains the same idempotency key on retry', async () => {
      const message = await createMessage();
      await relay.runOnce();
      const job = await getJob(message.id);
      responseStatus = 503;
      await expect(consumer.process(job)).rejects.toThrow();
      expect(
        (
          await db
            .select()
            .from(webhookMessageTable)
            .where(eq(webhookMessageTable.id, message.id))
        )[0].status
      ).toBe('error');
      responseStatus = 200;
      await consumer.process(job);
      expect(
        requests.map((request) => request.headers['idempotency-key'])
      ).toEqual([message.id, message.id]);
    });

    it('does not overwrite a successful concurrent delivery with a late failure', async () => {
      const message = await createMessage();
      await relay.runOnce();
      responseStatus = 503;
      beforeResponse = async () => {
        await db
          .update(webhookMessageTable)
          .set({ status: 'success' })
          .where(eq(webhookMessageTable.id, message.id));
      };
      const job = await getJob(message.id);
      await expect(consumer.process(job)).rejects.toThrow();
      expect(
        (
          await db
            .select()
            .from(webhookMessageTable)
            .where(eq(webhookMessageTable.id, message.id))
        )[0].status
      ).toBe('success');
      await consumer.process(job);
      expect(requests).toHaveLength(1);
    });

    it('aborts a stalled HTTP delivery within its timeout and records failure', async () => {
      const message = await createMessage();
      await relay.runOnce();
      stallResponse = true;
      await expect(
        consumer.process(await getJob(message.id))
      ).rejects.toMatchObject({ name: 'TimeoutError' });
      expect(
        (
          await db
            .select()
            .from(webhookMessageTable)
            .where(eq(webhookMessageTable.id, message.id))
        )[0].status
      ).toBe('error');
    }, 15_000);

    it('rejects mismatched ids before accessing a webhook or Redis', async () => {
      const message = await createMessage();
      const [claimed] = await store.claim({
        owner: 'validation',
        now: Date.now(),
        leaseMs: 30_000,
        limit: 1,
      });
      await expect(
        transport.publish(
          { ...claimed, payload: { messageId: randomUUID() } },
          { signal: new AbortController().signal }
        )
      ).rejects.toThrow('Invalid webhook outbox message');
      expect(await queue.getWaitingCount()).toBe(0);
      await expect(
        consumer.process({ id: randomUUID(), data: { id: message.id } } as Job)
      ).rejects.toThrow('does not match');
    });

    it('verifies the SQL schema and refuses rollback while pending messages or dead letters exist', async () => {
      await runMigration('verify');
      await pool.query('DELETE FROM nest_outbox.migrations');
      await expect(runMigration('verify')).rejects.toThrow(
        'Unexpected outbox schema version'
      );
      await pool.query(
        "INSERT INTO nest_outbox.migrations (version, name) VALUES (1, 'initial')"
      );
      await createMessage();
      await expect(runMigration('revert')).rejects.toThrow('drain');
      const [message] = await store.claim({
        owner: 'dead-letter',
        now: Date.now(),
        leaseMs: 30_000,
        limit: 1,
      });
      await store.deadLetter(message.id, 'dead-letter', {
        attempts: 1,
        error: { attempt: 1, at: Date.now(), error: 'unavailable' },
        reason: 'exhausted',
        failedAt: Date.now(),
      });
      await expect(runMigration('revert')).rejects.toThrow('drain');
      await pool.query('DELETE FROM nest_outbox.dead_letters');
      await runMigration('revert');
      await runMigration('deploy');
      await runMigration('verify');
      expect(
        (await pool.query('SELECT * FROM nest_outbox.messages')).rowCount
      ).toBe(1);
    });
  }
);
