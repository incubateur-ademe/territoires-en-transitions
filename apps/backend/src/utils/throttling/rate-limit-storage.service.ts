import { RedisThrottlerStorage } from '@nestjs-redis/throttler-storage';
import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';
import { buildQueueRedisConnection } from '../config/build-queue-redis-connection';
import ConfigurationService from '../config/configuration.service';

/** Atomic shared counters. Redis outages reject limited requests, without buffering. */
@Injectable()
export class RateLimitStorageService
  implements ThrottlerStorage, OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(RateLimitStorageService.name);
  private readonly client;
  private readonly storage: RedisThrottlerStorage;
  private initialization?: Promise<void>;
  private readonly namespace = process.env.VITEST
    ? `tet:backend:throttle:test:${randomUUID()}`
    : 'tet:backend:throttle';

  constructor(config: ConfigurationService) {
    const connection = buildQueueRedisConnection({
      QUEUE_REDIS_HOST: config.get('QUEUE_REDIS_HOST'),
      QUEUE_REDIS_PORT: config.get('QUEUE_REDIS_PORT'),
      QUEUE_REDIS_URL: config.get('QUEUE_REDIS_URL'),
      QUEUE_REDIS_TLS_CA: config.get('QUEUE_REDIS_TLS_CA'),
    });
    const socket = {
      host: connection.host,
      port: connection.port,
      connectTimeout: 1_000,
    };
    this.client = createClient({
      socket: connection.tls
        ? { ...socket, ...connection.tls, tls: true }
        : socket,
      username: connection.username,
      password: connection.password,
      database: connection.db,
      disableOfflineQueue: true,
      commandsQueueMaxLength: 1_000,
      commandOptions: { timeout: 1_000 },
    });
    // Do not log connection options or raw errors that may contain credentials.
    this.client.on('error', () =>
      this.logger.error('Connexion Redis indisponible pour les limites HTTP')
    );
    this.storage = new RedisThrottlerStorage(this.client);
  }

  onModuleInit(): Promise<void> {
    return (this.initialization ??= this.connect());
  }

  private async connect(): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.client.connect(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(
              new Error('Redis des limites HTTP indisponible au démarrage')
            );
          }, 5_000);
        }),
      ]);
    } catch {
      this.onApplicationShutdown();
      throw new Error('Redis des limites HTTP indisponible au démarrage');
    } finally {
      clearTimeout(timer);
    }
  }

  increment(
    ...[key, ttl, limit, blockDuration, name]: Parameters<
      ThrottlerStorage['increment']
    >
  ) {
    return this.withDeadline(
      this.storage.increment(
        `${this.namespace}:${key}`,
        ttl,
        limit,
        blockDuration,
        name
      )
    );
  }

  ping(): Promise<string> {
    return this.withDeadline(this.client.ping());
  }

  // node-redis commandOptions.timeout bounds the write queue only. Once sent,
  // a command can still wait for Redis; bound the caller's response as well.
  // Sent increments may finish later. The client queue stays capped at 1,000.
  private async withDeadline<T>(operation: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Redis des limites HTTP ne répond pas')),
            1_000
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  onApplicationShutdown(): void {
    if (this.client.isOpen) {
      this.client.destroy();
    }
  }
}
