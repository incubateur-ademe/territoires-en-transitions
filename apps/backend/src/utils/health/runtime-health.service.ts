import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthCheckService, HealthIndicatorService } from '@nestjs/terminus';
import type { Pool } from 'pg';

export const HEALTH_DEPENDENCIES = Symbol('HEALTH_DEPENDENCIES');
export interface HealthDependencies {
  database: Pick<Pool, 'connect'>;
  redis: () => Promise<unknown>;
}

const HEALTH_TIMEOUT_MS = 1000;

@Injectable()
export class RuntimeHealthService {
  private readonly pending = new Map<string, Promise<void>>();

  constructor(
    @Inject(HEALTH_DEPENDENCIES)
    private readonly dependencies: HealthDependencies,
    private readonly health: HealthCheckService,
    private readonly indicators: HealthIndicatorService
  ) {}

  async readiness() {
    try {
      await this.health.check([
        this.indicators
          .check('database')
          .attempt(({ signal }) =>
            this.probe('database', () => this.checkDatabase(signal))
          )
          .withTimeout(HEALTH_TIMEOUT_MS),
        this.indicators
          .check('redis')
          .attempt(() =>
            this.probe('redis', async () => {
              await this.dependencies.redis();
            })
          )
          .withTimeout(HEALTH_TIMEOUT_MS),
      ]);
      return { status: 'ok' };
    } catch {
      // Driver errors can contain credentials or infrastructure addresses.
      throw new ServiceUnavailableException('Service unavailable');
    }
  }

  private probe(name: string, check: () => Promise<void>): Promise<void> {
    const pending = this.pending.get(name);
    if (pending) return pending;
    const operation = check().finally(() => this.pending.delete(name));
    this.pending.set(name, operation);
    return operation;
  }

  private async checkDatabase(signal: AbortSignal): Promise<void> {
    const client = await this.dependencies.database.connect();
    if (signal.aborted) {
      client.release();
      signal.throwIfAborted();
    }
    let released = false;
    const destroy = () => {
      if (!released) {
        released = true;
        client.release(true);
      }
    };
    signal.addEventListener('abort', destroy, { once: true });
    try {
      await client.query('SELECT 1');
    } catch (error) {
      destroy();
      throw error;
    } finally {
      signal.removeEventListener('abort', destroy);
      if (!released) client.release();
    }
  }
}
